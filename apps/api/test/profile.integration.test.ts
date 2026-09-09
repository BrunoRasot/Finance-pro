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

describe('Profile deletion with PostgreSQL and verified JWTs', () => {
  let app: NestExpressApplication;
  let server: Server;
  let database: DatabaseService;
  let issuer: Awaited<ReturnType<typeof createJwksServer>>;
  let tokenA: string;
  const userA = randomUUID();
  const userB = randomUUID();
  const originalFetch = global.fetch;

  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url || !new URL(url).pathname.endsWith('_test')) {
      throw new Error(
        'TEST_DATABASE_URL must target a database ending in _test',
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
            SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key-with-safe-length',
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
  });

  beforeEach(async () => {
    global.fetch = jest.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        if (init?.method === 'DELETE') {
          return new Response(null, { status: 200 });
        }
        return originalFetch(input, init);
      },
    );
    const accountA = await database.client.account.create({
      data: {
        ownerId: userA,
        name: 'Cuenta A',
        type: 'CASH',
        currency: 'PEN',
        openingBalance: '10.00',
      },
    });
    await database.client.transaction.create({
      data: {
        ownerId: userA,
        accountId: accountA.id,
        type: 'INCOME',
        category: 'SALARY',
        amount: '5.00',
        date: new Date('2026-09-01'),
        description: 'Ingreso',
        idempotencyKey: randomUUID(),
      },
    });
    await database.client.budget.create({
      data: {
        ownerId: userA,
        month: new Date('2026-09-01'),
        currency: 'PEN',
        category: 'FOOD',
        amount: '20.00',
      },
    });
    const goal = await database.client.savingsGoal.create({
      data: {
        ownerId: userA,
        name: 'Meta',
        currency: 'PEN',
        targetAmount: '100.00',
      },
    });
    await database.client.goalContribution.create({
      data: {
        ownerId: userA,
        goalId: goal.id,
        amount: '2.00',
        date: new Date('2026-09-01'),
        note: 'Aporte',
        idempotencyKey: randomUUID(),
      },
    });
    await database.client.account.create({
      data: {
        ownerId: userB,
        name: 'Cuenta B',
        type: 'BANK',
        currency: 'USD',
        openingBalance: '30.00',
      },
    });
  });

  afterEach(async () => {
    global.fetch = originalFetch;
    await database.client.goalContribution.deleteMany({
      where: { ownerId: { in: [userA, userB] } },
    });
    await database.client.transaction.deleteMany({
      where: { ownerId: { in: [userA, userB] } },
    });
    await database.client.transfer.deleteMany({
      where: { ownerId: { in: [userA, userB] } },
    });
    await database.client.budget.deleteMany({
      where: { ownerId: { in: [userA, userB] } },
    });
    await database.client.savingsGoal.deleteMany({
      where: { ownerId: { in: [userA, userB] } },
    });
    await database.client.account.deleteMany({
      where: { ownerId: { in: [userA, userB] } },
    });
  });

  afterAll(async () => {
    await app.close();
    await issuer.close();
  });

  it('requires the exact confirmation phrase', async () => {
    await request(server)
      .delete('/api/v1/profile')
      .auth(tokenA, { type: 'bearer' })
      .send({ confirmation: 'delete' })
      .expect(400);
  });

  it('deletes only the authenticated user and removes the auth identity', async () => {
    await request(server)
      .delete('/api/v1/profile')
      .auth(tokenA, { type: 'bearer' })
      .send({ confirmation: 'ELIMINAR' })
      .expect(204);

    expect(
      await database.client.account.count({ where: { ownerId: userA } }),
    ).toBe(0);
    expect(
      await database.client.budget.count({ where: { ownerId: userA } }),
    ).toBe(0);
    expect(
      await database.client.savingsGoal.count({ where: { ownerId: userA } }),
    ).toBe(0);
    expect(
      await database.client.account.count({ where: { ownerId: userB } }),
    ).toBe(1);
    expect(global.fetch).toHaveBeenCalledWith(
      `${issuer.url}/auth/v1/admin/users/${userA}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
