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

describe('Monthly reports with PostgreSQL and verified JWTs', () => {
  let app: NestExpressApplication;
  let server: Server;
  let database: DatabaseService;
  let issuer: Awaited<ReturnType<typeof createJwksServer>>;
  let tokenA: string;
  let tokenB: string;
  let accountId: string;
  const userA = randomUUID();
  const userB = randomUUID();

  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url || !new URL(url).pathname.endsWith('_test')) {
      throw new Error(
        'TEST_DATABASE_URL must target a dedicated database ending in _test',
      );
    }
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
    accountId = (
      await database.client.account.create({
        data: {
          ownerId: userA,
          name: 'Movimientos',
          type: 'CASH',
          currency: 'PEN',
          openingBalance: '100.00',
        },
      })
    ).id;
  });

  afterAll(async () => {
    try {
      if (database)
        await database.client.transaction.deleteMany({
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

  async function movement(
    account: string,
    owner: string,
    date: string,
    amount: string,
    type: 'INCOME' | 'EXPENSE' = 'INCOME',
  ) {
    await database.client.transaction.create({
      data: {
        accountId: account,
        ownerId: owner,
        date: new Date(`${date}T00:00:00Z`),
        amount,
        type,
        category: type === 'INCOME' ? 'SALARY' : 'FOOD',
        description: 'Test report',
        idempotencyKey: randomUUID(),
      },
    });
  }
  const summary = (month: string, token = tokenA) =>
    request(server)
      .get(`/api/v1/reports/monthly?month=${month}`)
      .auth(token, { type: 'bearer' });
  it('requires authentication', async () => {
    await request(server)
      .get('/api/v1/reports/monthly?month=2026-09')
      .expect(401);
  });
  it('does not classify opening balances as monthly income', async () => {
    const response = await summary('2026-09').expect(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toEqual({
      month: '2026-09',
      currencies: ['PEN', 'USD'].map((currency) => ({
        currency,
        income: '0.00',
        expense: '0.00',
        net: '0.00',
        categories: [],
      })),
    });
  });
  it('includes the first and last day and excludes adjacent months', async () => {
    await movement(accountId, userA, '2026-08-31', '999');
    await movement(accountId, userA, '2026-09-01', '50.25');
    await movement(accountId, userA, '2026-09-30', '70.30', 'EXPENSE');
    await movement(accountId, userA, '2026-10-01', '999');
    const response = await summary('2026-09').expect(200);
    expect(response.body).toMatchObject({
      currencies: [
        {
          currency: 'PEN',
          income: '50.25',
          expense: '70.30',
          net: '-20.05',
          categories: [
            { type: 'INCOME', category: 'SALARY', total: '50.25', count: '1' },
            { type: 'EXPENSE', category: 'FOOD', total: '70.30', count: '1' },
          ],
        },
        { currency: 'USD', income: '0.00' },
      ],
    });
  });
  it('aggregates across accounts, separates currencies and excludes other owners', async () => {
    const second = await database.client.account.create({
      data: {
        ownerId: userA,
        name: 'Otra cuenta',
        type: 'BANK',
        currency: 'PEN',
        openingBalance: '1000',
      },
    });
    const dollars = await database.client.account.create({
      data: {
        ownerId: userA,
        name: 'USD',
        type: 'BANK',
        currency: 'USD',
        openingBalance: '9000',
      },
    });
    const other = await database.client.account.create({
      data: {
        ownerId: userB,
        name: 'Ajena',
        type: 'BANK',
        currency: 'PEN',
        openingBalance: '0',
      },
    });
    await movement(second.id, userA, '2026-09-15', '0.01');
    await movement(dollars.id, userA, '2026-09-15', '9999999999999999.99');
    await movement(dollars.id, userA, '2026-09-16', '0.02');
    await movement(other.id, userB, '2026-09-15', '8888');
    expect((await summary('2026-09').expect(200)).body).toMatchObject({
      currencies: [
        { income: '50.26', expense: '70.30', net: '-20.04' },
        {
          currency: 'USD',
          income: '10000000000000000.01',
          net: '10000000000000000.01',
        },
      ],
    });
    expect((await summary('2026-09', tokenB).expect(200)).body).toMatchObject({
      currencies: [{ income: '8888.00', expense: '0.00' }, { income: '0.00' }],
    });
  });
  it('handles leap day and the December year boundary', async () => {
    await movement(accountId, userA, '2028-02-29', '0.01');
    await movement(accountId, userA, '2028-03-01', '300');
    expect((await summary('2028-02').expect(200)).body).toMatchObject({
      currencies: [{ income: '0.01' }, { income: '0.00' }],
    });
    await movement(accountId, userA, '2026-12-31', '0.02');
    await movement(accountId, userA, '2027-01-01', '300');
    expect((await summary('2026-12').expect(200)).body).toMatchObject({
      currencies: [{ income: '0.02' }, { income: '0.00' }],
    });
  });
  it.each([
    '',
    '0000-01',
    '2026-00',
    '2026-13',
    '2026-1',
    '2026-01-01',
    '2026-09&ownerId=00000000-0000-4000-8000-000000000000',
    '2026-09&month=2026-10',
  ])('rejects invalid report query %s', async (month) => {
    await summary(month).expect(400);
  });
});
