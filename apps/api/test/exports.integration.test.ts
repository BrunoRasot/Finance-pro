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

describe('Authenticated data exports', () => {
  let app: NestExpressApplication;
  let server: Server;
  let database: DatabaseService;
  let issuer: Awaited<ReturnType<typeof createJwksServer>>;
  let tokenA: string;
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

    const [accountA, accountB] = await Promise.all([
      database.client.account.create({
        data: {
          ownerId: userA,
          name: '=Cuenta privada',
          type: 'BANK',
          currency: 'PEN',
          openingBalance: '100.00',
        },
      }),
      database.client.account.create({
        data: {
          ownerId: userB,
          name: 'Cuenta ajena',
          type: 'CASH',
          currency: 'USD',
          openingBalance: '900.00',
        },
      }),
    ]);
    await Promise.all([
      database.client.transaction.create({
        data: {
          ownerId: userA,
          accountId: accountA.id,
          type: 'EXPENSE',
          category: 'FOOD',
          amount: '12.50',
          date: new Date('2026-09-05T00:00:00.000Z'),
          description: '=SUM(1,2)',
          idempotencyKey: randomUUID(),
        },
      }),
      database.client.transaction.create({
        data: {
          ownerId: userB,
          accountId: accountB.id,
          type: 'INCOME',
          category: 'SALARY',
          amount: '900.00',
          date: new Date('2026-09-05T00:00:00.000Z'),
          description: 'Dato ajeno',
          idempotencyKey: randomUUID(),
        },
      }),
    ]);
  });

  afterAll(async () => {
    try {
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

  it('requires authentication and exports only the owner backup', async () => {
    await request(server).get('/api/v1/exports/data.json').expect(401);
    const response = await request(server)
      .get('/api/v1/exports/data.json')
      .auth(tokenA, { type: 'bearer' })
      .expect(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['content-disposition']).toContain(
      'finance-pro-backup.json',
    );
    expect(response.body).toMatchObject({
      version: 1,
      accounts: [{ name: '=Cuenta privada', openingBalance: '100.00' }],
      transactions: [{ amount: '12.50', description: '=SUM(1,2)' }],
      transfers: [],
      budgets: [],
      goals: [],
      goalContributions: [],
    });
    expect(response.text).not.toContain('Cuenta ajena');
    expect(response.text).not.toContain('ownerId');
    expect(response.text).not.toContain('idempotencyKey');
  });

  it('returns spreadsheet-compatible CSV and neutralizes formulas', async () => {
    const response = await request(server)
      .get('/api/v1/exports/transactions.csv')
      .auth(tokenA, { type: 'bearer' })
      .buffer(true)
      .parse((res, callback) => {
        res.setEncoding('utf8');
        let body = '';
        res.on('data', (chunk: string) => (body += chunk));
        res.on('end', () => callback(null, body));
      })
      .expect(200);
    const csv = response.body as unknown as string;
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toContain(
      'finance-pro-movimientos.csv',
    );
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"\'=Cuenta privada"');
    expect(csv).toContain('"\'=SUM(1,2)"');
    expect(csv).not.toContain('Cuenta ajena');
  });
});
