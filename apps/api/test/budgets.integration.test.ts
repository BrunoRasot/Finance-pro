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

describe('Budgets with PostgreSQL and verified JWTs', () => {
  let app: NestExpressApplication;
  let server: Server;
  let database: DatabaseService;
  let issuer: Awaited<ReturnType<typeof createJwksServer>>;
  let tokenA: string;
  let tokenB: string;
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
    tokenB = await issuer.issue(userB);

    const account = await database.client.account.create({
      data: {
        ownerId: userA,
        name: 'Diaria',
        type: 'BANK',
        currency: 'PEN',
        openingBalance: '0.00',
      },
    });
    await database.client.transaction.createMany({
      data: [
        {
          ownerId: userA,
          accountId: account.id,
          type: 'EXPENSE',
          category: 'FOOD',
          amount: '45.50',
          date: new Date('2026-09-04T00:00:00.000Z'),
          description: 'Mercado',
          idempotencyKey: randomUUID(),
        },
        {
          ownerId: userA,
          accountId: account.id,
          type: 'EXPENSE',
          category: 'FOOD',
          amount: '10.00',
          date: new Date('2026-08-31T00:00:00.000Z'),
          description: 'Mes anterior',
          idempotencyKey: randomUUID(),
        },
      ],
    });
  });

  afterAll(async () => {
    try {
      await database?.client.budget.deleteMany({
        where: { ownerId: { in: [userA, userB] } },
      });
      await database?.client.transaction.deleteMany({
        where: { ownerId: { in: [userA, userB] } },
      });
      await database?.client.account.deleteMany({
        where: { ownerId: { in: [userA, userB] } },
      });
    } finally {
      await app?.close();
      await issuer?.close();
    }
  });

  const save = (body: object, token = tokenA) =>
    request(server)
      .put('/api/v1/budgets')
      .auth(token, { type: 'bearer' })
      .send(body);

  it('requires authentication and validates the complete input', async () => {
    const valid = {
      month: '2026-09',
      currency: 'PEN',
      category: 'FOOD',
      amount: '100.00',
    };
    await request(server).put('/api/v1/budgets').send(valid).expect(401);
    await save({ ...valid, month: '2026-13' }).expect(400);
    await save({ ...valid, category: 'SALARY' }).expect(400);
    await save({ ...valid, amount: '0.00' }).expect(400);
    await save({ ...valid, ownerId: userB }).expect(400);
  });

  it('creates and updates one monthly budget with actual spending', async () => {
    const input = {
      month: '2026-09',
      currency: 'PEN',
      category: 'FOOD',
      amount: '100.00',
    };
    const created = await save(input).expect(200);
    expect(created.body).toMatchObject({
      ...input,
      spent: '45.50',
      remaining: '54.50',
      usagePercent: 45.5,
    });
    const updated = await save({ ...input, amount: '40.00' }).expect(200);
    expect(updated.body).toMatchObject({
      amount: '40.00',
      spent: '45.50',
      remaining: '-5.50',
      usagePercent: 113.75,
    });
    expect(
      await database.client.budget.count({ where: { ownerId: userA } }),
    ).toBe(1);
  });

  it('lists only the requested owner and month', async () => {
    await save(
      { month: '2026-09', currency: 'USD', category: 'OTHER', amount: '25.00' },
      tokenB,
    ).expect(200);
    const response = await request(server)
      .get('/api/v1/budgets?month=2026-09')
      .auth(tokenA, { type: 'bearer' })
      .expect(200);
    const body = response.body as {
      month: string;
      items: Array<{ currency: string }>;
    };
    expect(body.month).toBe('2026-09');
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.currency).toBe('PEN');
  });

  it('deletes only budgets owned by the authenticated user', async () => {
    const own = await database.client.budget.findFirstOrThrow({
      where: { ownerId: userA },
    });
    const foreign = await database.client.budget.findFirstOrThrow({
      where: { ownerId: userB },
    });
    await request(server)
      .delete(`/api/v1/budgets/${foreign.id}`)
      .auth(tokenA, { type: 'bearer' })
      .expect(404);
    await request(server)
      .delete(`/api/v1/budgets/${own.id}`)
      .auth(tokenA, { type: 'bearer' })
      .expect(204);
  });
});
