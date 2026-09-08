import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { config as loadEnv } from 'dotenv';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { validateEnvironment } from '../src/config/environment';
import { DatabaseService } from '../src/infrastructure/database/database.service';
import { createJwksServer } from './support/jwks-server';

loadEnv({ path: '.env.test', quiet: true });

describe('Transfers with PostgreSQL and verified JWTs', () => {
  let app: NestExpressApplication;
  let server: Server;
  let database: DatabaseService;
  let issuer: Awaited<ReturnType<typeof createJwksServer>>;
  let tokenA: string;
  let fromId: string;
  let toId: string;
  let usdId: string;
  let foreignId: string;
  const userA = randomUUID();
  const userB = randomUUID();

  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url || !new URL(url).pathname.endsWith('_test'))
      throw new Error(
        'TEST_DATABASE_URL must target a dedicated database ending in _test',
      );
    issuer = await createJwksServer();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue(
        new ConfigService(
          validateEnvironment({
            NODE_ENV: 'test',
            DATABASE_URL: url,
            SUPABASE_URL: issuer.url,
            RATE_LIMIT_MAX: 1000,
          }),
        ),
      )
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({
      bodyParser: false,
      logger: false,
    });
    configureApp(app);
    await app.init();
    server = app.getHttpServer();
    database = app.get(DatabaseService);
    tokenA = await issuer.issue(userA);
    const createAccount = async (
      ownerId: string,
      name: string,
      currency: 'PEN' | 'USD',
      openingBalance: string,
    ) =>
      database.client.account.create({
        data: { ownerId, name, currency, openingBalance, type: 'BANK' },
      });
    fromId = (await createAccount(userA, 'Origen', 'PEN', '100.00')).id;
    toId = (await createAccount(userA, 'Destino', 'PEN', '15.00')).id;
    usdId = (await createAccount(userA, 'Dólares', 'USD', '5.00')).id;
    foreignId = (await createAccount(userB, 'Ajena', 'PEN', '0.00')).id;
  });

  afterAll(async () => {
    try {
      if (database)
        await database.client.transaction.deleteMany({
          where: { ownerId: { in: [userA, userB] } },
        });
      if (database)
        await database.client.transfer.deleteMany({
          where: { ownerId: { in: [userA, userB] } },
        });
      if (database)
        await database.client.account.deleteMany({
          where: { ownerId: { in: [userA, userB] } },
        });
    } finally {
      await app?.close();
      await issuer?.close();
    }
  });

  const input = (overrides: Record<string, unknown> = {}) => ({
    fromAccountId: fromId,
    toAccountId: toId,
    amount: '30.00',
    date: '2026-09-05',
    description: 'Ahorro',
    idempotencyKey: randomUUID(),
    ...overrides,
  });
  const post = (body: object, token = tokenA) =>
    request(server)
      .post('/api/v1/transfers')
      .auth(token, { type: 'bearer' })
      .send(body);
  const balance = (accountId: string) =>
    request(server)
      .get(`/api/v1/accounts/${accountId}/balance`)
      .auth(tokenA, { type: 'bearer' });

  it('requires authentication and strict input', async () => {
    await request(server).post('/api/v1/transfers').send(input()).expect(401);
    await post(input({ ownerId: userB })).expect(400);
    await post(input({ amount: 30 })).expect(400);
    await post(input({ amount: '0.00' })).expect(400);
    await post(input({ date: '2026-02-30' })).expect(400);
  });

  it('creates both balance effects atomically and excludes them from reports', async () => {
    const payload = input();
    const response = await post(payload).expect(201);
    const transferId = (response.body as { id: string }).id;
    expect(response.body).toMatchObject({
      fromAccountId: fromId,
      toAccountId: toId,
      amount: '30.00',
      currency: 'PEN',
      description: 'Ahorro',
    });
    expect(response.headers['cache-control']).toBe('no-store');
    expect((await balance(fromId).expect(200)).body).toMatchObject({
      totalExpense: '30.00',
      balance: '70.00',
    });
    expect((await balance(toId).expect(200)).body).toMatchObject({
      totalIncome: '30.00',
      balance: '45.00',
    });
    const movements = await database.client.transaction.findMany({
      where: { transferId },
      orderBy: { type: 'asc' },
    });
    expect(movements).toHaveLength(2);
    expect(movements.map((movement) => movement.category)).toEqual([
      'TRANSFER',
      'TRANSFER',
    ]);
    const history = await request(server)
      .get(
        `/api/v1/accounts/${fromId}/transactions?category=TRANSFER&limit=20&offset=0`,
      )
      .auth(tokenA, { type: 'bearer' })
      .expect(200);
    const historyBody = history.body as {
      items: Array<Record<string, unknown>>;
    };
    expect(historyBody.items).toHaveLength(1);
    expect(historyBody.items[0]).toMatchObject({
      category: 'TRANSFER',
      transferId,
      type: 'EXPENSE',
      amount: '30.00',
    });
    const report = await request(server)
      .get('/api/v1/reports/monthly?month=2026-09')
      .auth(tokenA, { type: 'bearer' })
      .expect(200);
    const pen = (
      report.body as {
        currencies: Array<{
          currency: string;
          income: string;
          expense: string;
          net: string;
          categories: unknown[];
        }>;
      }
    ).currencies.find((item) => item.currency === 'PEN');
    expect(pen).toEqual({
      currency: 'PEN',
      income: '0.00',
      expense: '0.00',
      net: '0.00',
      categories: [],
    });
  });

  it('is idempotent and rejects reuse with different data', async () => {
    const payload = input({ amount: '4.25' });
    const [first, second] = await Promise.all([post(payload), post(payload)]);
    expect([first.status, second.status]).toEqual([201, 201]);
    expect((first.body as { id: string }).id).toBe(
      (second.body as { id: string }).id,
    );
    expect(
      await database.client.transfer.count({
        where: { ownerId: userA, idempotencyKey: payload.idempotencyKey },
      }),
    ).toBe(1);
    await post({ ...payload, amount: '4.26' }).expect(409);
  });

  it('rejects same-account, mixed-currency, foreign and archived accounts', async () => {
    await post(input({ toAccountId: fromId })).expect(400);
    await post(input({ toAccountId: usdId })).expect(400);
    await post(input({ toAccountId: foreignId })).expect(404);
    await database.client.account.update({
      where: { id: toId },
      data: { archivedAt: new Date() },
    });
    const before = await database.client.transfer.count({
      where: { ownerId: userA },
    });
    await post(input()).expect(404);
    expect(
      await database.client.transfer.count({ where: { ownerId: userA } }),
    ).toBe(before);
    await database.client.account.update({
      where: { id: toId },
      data: { archivedAt: null },
    });
  });
});
