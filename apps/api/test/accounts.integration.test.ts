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

describe('Accounts with PostgreSQL and verified JWTs', () => {
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
  });

  afterAll(async () => {
    try {
      if (database)
        await database.client.account.deleteMany({
          where: { ownerId: { in: [userA, userB] } },
        });
    } finally {
      await app?.close();
      await issuer?.close();
    }
  });

  it('requires authentication', async () => {
    await request(server).get('/api/v1/accounts').expect(401);
  });

  it('persists the exact opening amount and server-derived owner', async () => {
    const response = await request(server)
      .post('/api/v1/accounts')
      .auth(tokenA, { type: 'bearer' })
      .send({
        name: '  Efectivo  ',
        type: 'CASH',
        currency: 'PEN',
        openingBalance: '9007199254740993.01',
      })
      .expect(201);
    const body = response.body as {
      id: string;
      openingBalance: string;
      name: string;
    };
    accountId = body.id;
    expect(body).toMatchObject({
      name: 'Efectivo',
      openingBalance: '9007199254740993.01',
    });
    const stored = await database.client.account.findUniqueOrThrow({
      where: { id: accountId },
    });
    expect(stored.ownerId).toBe(userA);
    expect(stored.openingBalance.toFixed(2)).toBe(body.openingBalance);
  });

  it('lists only accounts belonging to the verified user', async () => {
    const own = await request(server)
      .get('/api/v1/accounts?limit=1')
      .auth(tokenA, { type: 'bearer' })
      .expect(200);
    expect(own.body).toMatchObject({ items: [{ id: accountId }], limit: 1 });
    const other = await request(server)
      .get('/api/v1/accounts')
      .auth(tokenB, { type: 'bearer' })
      .expect(200);
    expect(other.body).toMatchObject({ items: [] });
  });

  it('returns 404 for another user account and an unknown account', async () => {
    await request(server)
      .get(`/api/v1/accounts/${accountId}`)
      .auth(tokenB, { type: 'bearer' })
      .expect(404);
    await request(server)
      .get(`/api/v1/accounts/${randomUUID()}`)
      .auth(tokenB, { type: 'bearer' })
      .expect(404);
    await request(server)
      .get(`/api/v1/accounts/${accountId}`)
      .auth(tokenA, { type: 'bearer' })
      .expect(200);
  });

  it.each([
    { ownerId: userB },
    { openingBalance: 1.25 },
    { openingBalance: '-1' },
    { openingBalance: '0.001' },
    { openingBalance: '1e3' },
    { name: '  ' },
    { currency: 'INVALID' },
  ])('rejects invalid input or ownership injection %j', async (fields) => {
    await request(server)
      .post('/api/v1/accounts')
      .auth(tokenA, { type: 'bearer' })
      .send({
        name: 'Cuenta',
        type: 'BANK',
        currency: 'PEN',
        openingBalance: '0',
        ...fields,
      })
      .expect(400);
  });

  it('bounds pagination and validates identifiers', async () => {
    await request(server)
      .get('/api/v1/accounts?limit=101')
      .auth(tokenA, { type: 'bearer' })
      .expect(400);
    await request(server)
      .get('/api/v1/accounts/not-a-uuid')
      .auth(tokenA, { type: 'bearer' })
      .expect(400);
  });

  it('enforces the nonnegative opening balance in PostgreSQL', async () => {
    await expect(
      database.client.account.create({
        data: {
          ownerId: userA,
          name: 'Invalid',
          type: 'CASH',
          currency: 'PEN',
          openingBalance: '-1',
        },
      }),
    ).rejects.toThrow();
  });
});
