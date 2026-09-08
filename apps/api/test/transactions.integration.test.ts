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

describe('Transactions with PostgreSQL and verified JWTs', () => {
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

  const input = (overrides: Record<string, unknown> = {}) => ({
    type: 'INCOME',
    category: 'SALARY',
    amount: '50.25',
    date: '2026-09-03',
    description: ' Pago ',
    idempotencyKey: randomUUID(),
    ...overrides,
  });
  const post = (body: object, token = tokenA, account = accountId) =>
    request(server)
      .post(`/api/v1/accounts/${account}/transactions`)
      .auth(token, { type: 'bearer' })
      .send(body);
  const get = (suffix: string, token = tokenA, account = accountId) =>
    request(server)
      .get(`/api/v1/accounts/${account}/${suffix}`)
      .auth(token, { type: 'bearer' });
  const patch = (
    transactionId: string,
    body: object,
    token = tokenA,
    account = accountId,
  ) =>
    request(server)
      .patch(`/api/v1/accounts/${account}/transactions/${transactionId}`)
      .auth(token, { type: 'bearer' })
      .send(body);
  const remove = (transactionId: string, token = tokenA, account = accountId) =>
    request(server)
      .delete(`/api/v1/accounts/${account}/transactions/${transactionId}`)
      .auth(token, { type: 'bearer' });

  it('requires authentication for every movement endpoint', async () => {
    await request(server)
      .post(`/api/v1/accounts/${accountId}/transactions`)
      .send(input())
      .expect(401);
    await request(server)
      .get(`/api/v1/accounts/${accountId}/transactions`)
      .expect(401);
    await request(server)
      .get(`/api/v1/accounts/${accountId}/balance`)
      .expect(401);
    await request(server)
      .patch(`/api/v1/accounts/${accountId}/transactions/${randomUUID()}`)
      .send(input())
      .expect(401);
    await request(server)
      .delete(`/api/v1/accounts/${accountId}/transactions/${randomUUID()}`)
      .expect(401);
  });
  it('returns the opening balance before any movements', async () => {
    const response = await get('balance').expect(200);
    expect(response.body).toEqual({
      accountId,
      currency: 'PEN',
      openingBalance: '100.00',
      totalIncome: '0.00',
      totalExpense: '0.00',
      balance: '100.00',
    });
  });
  it('persists income and expenses and derives an exact balance', async () => {
    const response = await post(input()).expect(201);
    expect(response.body).toMatchObject({
      accountId,
      amount: '50.25',
      description: 'Pago',
      date: '2026-09-03',
    });
    expect(response.headers['cache-control']).toBe('no-store');
    await post(
      input({
        type: 'EXPENSE',
        category: 'FOOD',
        amount: '20.10',
        date: '2026-09-02',
      }),
    ).expect(201);
    const balance = await get('balance').expect(200);
    expect(balance.body).toMatchObject({
      totalIncome: '50.25',
      totalExpense: '20.10',
      balance: '130.15',
    });
  });
  it('filters by type, category and inclusive dates with stable pagination', async () => {
    const response = await get(
      'transactions?type=EXPENSE&category=FOOD&from=2026-09-02&to=2026-09-02&limit=1',
    ).expect(200);
    expect(response.body).toMatchObject({
      items: [{ amount: '20.10', category: 'FOOD' }],
      limit: 1,
      offset: 0,
    });
    const empty = await get('transactions?from=2026-09-04').expect(200);
    expect(empty.body).toMatchObject({ items: [] });
    const first = await get('transactions?limit=1').expect(200);
    const second = await get('transactions?limit=1&offset=1').expect(200);
    expect(first.body).toMatchObject({ items: [{ date: '2026-09-03' }] });
    expect(second.body).toMatchObject({ items: [{ date: '2026-09-02' }] });
  });
  it('hides foreign and missing accounts on reads and writes', async () => {
    for (const account of [accountId, randomUUID()]) {
      await post(input(), tokenB, account).expect(404);
      await get('transactions', tokenB, account).expect(404);
      await get('balance', tokenB, account).expect(404);
    }
  });
  it.each([
    { amount: '0' },
    { amount: '0.00' },
    { amount: '-1' },
    { amount: 12.5 },
    { amount: '1e2' },
    { amount: '0.001' },
    { amount: '10000000000000000' },
    { category: 'FOOD' },
    { type: 'TRANSFER' },
    { date: '2026-02-30' },
    { date: '2026-09-03T10:00:00Z' },
    { date: '0000-01-01' },
    { description: 'a'.repeat(251) },
    { ownerId: randomUUID() },
    { currency: 'USD' },
    { idempotencyKey: 'bad' },
  ])('rejects invalid financial data %j', async (overrides) => {
    await post(input(overrides)).expect(400);
  });
  it.each([
    'limit=101',
    'offset=10001',
    'from=2026-02-30',
    'from=2026-09-03&to=2026-09-01',
    'category=INVALID',
  ])('rejects invalid history query %s', async (query) => {
    await get(`transactions?${query}`).expect(400);
  });
  it('deduplicates simultaneous retries and rejects reuse with different data', async () => {
    const body = input({ amount: '0.10' });
    const results = await Promise.all([
      post(body).expect(201),
      post(body).expect(201),
      post({ ...body, amount: '0.1' }).expect(201),
    ]);
    const ids = results.map((result) => (result.body as { id: string }).id);
    expect(new Set(ids).size).toBe(1);
    expect(
      await database.client.transaction.count({
        where: {
          ownerId: userA,
          idempotencyKey: body.idempotencyKey,
        },
      }),
    ).toBe(1);
    await post({ ...body, amount: '9' }).expect(409);
    expect((await get('balance').expect(200)).body).toMatchObject({
      balance: '130.25',
    });
  });
  it('keeps high-value balances exact and allows negative balances', async () => {
    const account = await database.client.account.create({
      data: {
        ownerId: userA,
        name: 'Precisión',
        type: 'BANK',
        currency: 'USD',
        openingBalance: '9999999999999999.99',
      },
    });
    await post(input({ amount: '0.02' }), tokenA, account.id).expect(201);
    expect(
      (await get('balance', tokenA, account.id).expect(200)).body,
    ).toMatchObject({ currency: 'USD', balance: '10000000000000000.01' });
    await post(
      input({ type: 'EXPENSE', category: 'OTHER', amount: '200' }),
    ).expect(201);
    expect((await get('balance').expect(200)).body).toMatchObject({
      balance: '-69.75',
    });
  });
  it('enforces owner consistency, positivity and category rules in PostgreSQL', async () => {
    const base = {
      ownerId: userA,
      accountId,
      type: 'INCOME' as const,
      category: 'SALARY' as const,
      amount: '1',
      date: new Date('2026-09-03T00:00:00Z'),
      description: '',
      idempotencyKey: randomUUID(),
    };
    await expect(
      database.client.transaction.create({ data: { ...base, ownerId: userB } }),
    ).rejects.toThrow();
    await expect(
      database.client.transaction.create({ data: { ...base, amount: '0' } }),
    ).rejects.toThrow();
    await expect(
      database.client.transaction.create({
        data: { ...base, category: 'FOOD' },
      }),
    ).rejects.toThrow();
  });

  it('scopes idempotency to the user and rejects moving a retry to a different account', async () => {
    const body = input({ amount: '1.00' });
    await post(body).expect(201);
    const second = await database.client.account.create({
      data: {
        ownerId: userA,
        name: 'Segunda',
        type: 'CASH',
        currency: 'PEN',
        openingBalance: '0',
      },
    });
    await post(body, tokenA, second.id).expect(409);
    const foreign = await database.client.account.create({
      data: {
        ownerId: userB,
        name: 'Propia de B',
        type: 'BANK',
        currency: 'USD',
        openingBalance: '0',
      },
    });
    await post(body, tokenB, foreign.id).expect(201);
    expect(
      (await get('transactions', tokenB, foreign.id).expect(200)).body,
    ).toMatchObject({ items: [{ accountId: foreign.id, amount: '1.00' }] });
  });

  it('enables row level security on movements', async () => {
    const rows = await database.client.$queryRaw<
      { enabled: boolean }[]
    >`SELECT relrowsecurity AS enabled FROM pg_class WHERE oid = 'public.transactions'::regclass`;
    expect(rows).toEqual([{ enabled: true }]);
  });

  it('updates an owned movement and immediately recalculates the balance', async () => {
    const maintenanceAccount = await database.client.account.create({
      data: {
        ownerId: userA,
        name: 'Cuenta para edición',
        type: 'CASH',
        currency: 'PEN',
        openingBalance: '100.00',
      },
    });
    const created = await post(
      input({
        type: 'EXPENSE',
        category: 'FOOD',
        amount: '10.00',
        description: 'Antes',
      }),
      tokenA,
      maintenanceAccount.id,
    ).expect(201);
    const createdId = (created.body as { id: string }).id;
    const response = await patch(
      createdId,
      {
        type: 'INCOME',
        category: 'FREELANCE',
        amount: '25.50',
        date: '2026-09-04',
        description: ' Después ',
      },
      tokenA,
      maintenanceAccount.id,
    ).expect(200);
    expect(response.body as object).toMatchObject({
      id: createdId,
      type: 'INCOME',
      category: 'FREELANCE',
      amount: '25.50',
      date: '2026-09-04',
      description: 'Después',
    });
    expect(response.headers['cache-control']).toBe('no-store');
    const balance = await get('balance', tokenA, maintenanceAccount.id).expect(
      200,
    );
    expect(balance.body).toMatchObject({
      openingBalance: '100.00',
      totalIncome: '25.50',
      totalExpense: '0.00',
      balance: '125.50',
    });
  });

  it('rejects invalid, foreign and missing movement updates', async () => {
    const created = await post(input()).expect(201);
    const createdId = (created.body as { id: string }).id;
    const valid = {
      type: 'INCOME',
      category: 'SALARY',
      amount: '1.00',
      date: '2026-09-05',
      description: '',
    };
    await patch(createdId, { ...valid, category: 'FOOD' }).expect(400);
    await patch(createdId, { ...valid, ownerId: userA }).expect(400);
    await patch(createdId, valid, tokenB).expect(404);
    await patch(randomUUID(), valid).expect(404);
    await patch('invalid', valid).expect(400);
  });

  it('deletes only owned movements and recalculates the balance', async () => {
    const maintenanceAccount = await database.client.account.create({
      data: {
        ownerId: userA,
        name: 'Cuenta para eliminación',
        type: 'CASH',
        currency: 'PEN',
        openingBalance: '20.00',
      },
    });
    const created = await post(
      input({ type: 'EXPENSE', category: 'OTHER', amount: '7.25' }),
      tokenA,
      maintenanceAccount.id,
    ).expect(201);
    const createdId = (created.body as { id: string }).id;
    await remove(createdId, tokenB, maintenanceAccount.id).expect(404);
    await remove(randomUUID(), tokenA, maintenanceAccount.id).expect(404);
    expect(
      (await get('balance', tokenA, maintenanceAccount.id).expect(200)).body,
    ).toMatchObject({ totalExpense: '7.25', balance: '12.75' });
    const response = await remove(
      createdId,
      tokenA,
      maintenanceAccount.id,
    ).expect(200);
    expect(response.body as object).toEqual({ deleted: true });
    expect(response.headers['cache-control']).toBe('no-store');
    await remove(createdId, tokenA, maintenanceAccount.id).expect(404);
    expect(
      (await get('balance', tokenA, maintenanceAccount.id).expect(200)).body,
    ).toMatchObject({ totalExpense: '0.00', balance: '20.00' });
    expect(
      (
        (
          await get(
            'transactions?limit=100',
            tokenA,
            maintenanceAccount.id,
          ).expect(200)
        ).body as {
          items: unknown[];
        }
      ).items,
    ).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: createdId })]),
    );
  });

  it('keeps movement data while an account is archived and blocks new activity', async () => {
    const before = await database.client.transaction.count({
      where: { ownerId: userA, accountId },
    });
    expect(before).toBeGreaterThan(0);
    await request(server)
      .post(`/api/v1/accounts/${accountId}/archive`)
      .auth(tokenA, { type: 'bearer' })
      .expect(201);
    await post(input()).expect(404);
    await get('transactions').expect(404);
    await get('balance').expect(404);
    expect(
      await database.client.transaction.count({
        where: { ownerId: userA, accountId },
      }),
    ).toBe(before);
    await request(server)
      .post(`/api/v1/accounts/${accountId}/restore`)
      .auth(tokenA, { type: 'bearer' })
      .expect(201);
    await get('balance').expect(200);
  });
});
