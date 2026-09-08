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

describe('Savings goals with PostgreSQL and verified JWTs', () => {
  let app: NestExpressApplication;
  let server: Server;
  let database: DatabaseService;
  let issuer: Awaited<ReturnType<typeof createJwksServer>>;
  let tokenA: string;
  let tokenB: string;
  let goalId: string;
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
  });

  afterAll(async () => {
    try {
      await database?.client.goalContribution.deleteMany({
        where: { ownerId: { in: [userA, userB] } },
      });
      await database?.client.savingsGoal.deleteMany({
        where: { ownerId: { in: [userA, userB] } },
      });
    } finally {
      await app?.close();
      await issuer?.close();
    }
  });

  const auth = (
    method: 'get' | 'post' | 'patch',
    path: string,
    token = tokenA,
  ) => request(server)[method](path).auth(token, { type: 'bearer' });

  it('validates input and creates a private goal', async () => {
    const input = {
      name: 'Fondo de emergencia',
      currency: 'PEN',
      targetAmount: '1000.00',
      deadline: '2027-01-31',
    };
    await request(server).post('/api/v1/goals').send(input).expect(401);
    await auth('post', '/api/v1/goals')
      .send({ ...input, targetAmount: '0.00' })
      .expect(400);
    await auth('post', '/api/v1/goals')
      .send({ ...input, deadline: '2027-02-30' })
      .expect(400);
    const response = await auth('post', '/api/v1/goals')
      .send(input)
      .expect(201);
    goalId = (response.body as { id: string }).id;
    expect(response.body).toMatchObject({
      ...input,
      savedAmount: '0.00',
      remainingAmount: '1000.00',
      progressPercent: 0,
    });
    const foreign = await auth('get', '/api/v1/goals', tokenB).expect(200);
    expect((foreign.body as { items: unknown[] }).items).toEqual([]);
  });

  it('records an idempotent contribution and calculates progress', async () => {
    const input = {
      amount: '125.50',
      date: '2026-09-05',
      note: 'Primer aporte',
      idempotencyKey: randomUUID(),
    };
    const [first, second] = await Promise.all([
      auth('post', `/api/v1/goals/${goalId}/contributions`).send(input),
      auth('post', `/api/v1/goals/${goalId}/contributions`).send(input),
    ]);
    expect([first.status, second.status]).toEqual([201, 201]);
    expect(first.body).toMatchObject({
      savedAmount: '125.50',
      remainingAmount: '874.50',
      progressPercent: 12.55,
    });
    expect(
      await database.client.goalContribution.count({
        where: { ownerId: userA },
      }),
    ).toBe(1);
    await auth('post', `/api/v1/goals/${goalId}/contributions`)
      .send({ ...input, amount: '126.00' })
      .expect(409);
  });

  it('updates the target without changing currency or saved history', async () => {
    const response = await auth('patch', `/api/v1/goals/${goalId}`)
      .send({
        name: 'Emergencias',
        targetAmount: '500.00',
        deadline: null,
      })
      .expect(200);
    expect(response.body).toMatchObject({
      name: 'Emergencias',
      currency: 'PEN',
      targetAmount: '500.00',
      savedAmount: '125.50',
      deadline: null,
    });
  });

  it('archives, blocks contributions and restores only owned goals', async () => {
    await auth('post', `/api/v1/goals/${goalId}/archive`).expect(201);
    await auth('post', `/api/v1/goals/${goalId}/contributions`)
      .send({
        amount: '5.00',
        date: '2026-09-05',
        note: '',
        idempotencyKey: randomUUID(),
      })
      .expect(404);
    const archived = await auth('get', '/api/v1/goals?status=ARCHIVED').expect(
      200,
    );
    expect((archived.body as { items: unknown[] }).items).toHaveLength(1);
    await auth('post', `/api/v1/goals/${goalId}/restore`, tokenB).expect(404);
    await auth('post', `/api/v1/goals/${goalId}/restore`).expect(201);
  });
});
