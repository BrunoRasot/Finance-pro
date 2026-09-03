import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { IsString, Length } from 'class-validator';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { Public } from '../src/common/security/public.decorator';
import { validateEnvironment } from '../src/config/environment';

class ExampleDto {
  @IsString()
  @Length(1, 50)
  name!: string;
}

// Test-only routes exercise the actual global pipeline, never production routes.
@Controller('test')
class TestController {
  @Public()
  @Post('validate')
  validate(@Body() dto: ExampleDto): ExampleDto {
    return dto;
  }

  @Get('private')
  privateRoute(): { secret: string } {
    return { secret: 'must-not-be-returned' };
  }

  @Public()
  @Get('failure')
  failure(): never {
    throw new Error('database-password-must-not-leak');
  }

  @Public()
  @Get('http-failure')
  httpFailure(): never {
    throw new InternalServerErrorException('internal-query-must-not-leak');
  }
}

async function createApp(limit = 100): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    controllers: [TestController],
  })
    .overrideProvider(ConfigService)
    .useValue(
      new ConfigService(
        validateEnvironment({
          NODE_ENV: 'test',
          CORS_ORIGINS: 'http://localhost:3000',
          RATE_LIMIT_MAX: limit,
        }),
      ),
    )
    .compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({
    bodyParser: false,
    logger: false,
  });
  configureApp(app);
  await app.init();
  return app;
}

describe('API HTTP and security boundaries', () => {
  let app: NestExpressApplication;
  let server: Server;

  beforeAll(async () => {
    app = await createApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes only minimal liveness information and security headers', async () => {
    const response = await request(server)
      .get('/api/v1/health/live')
      .expect(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-request-id']).toMatch(/^[a-f0-9-]{36}$/);
  });

  it('does not trust a client-provided request identifier', async () => {
    const response = await request(server)
      .get('/api/v1/health/live')
      .set('X-Request-Id', 'untrusted-input')
      .expect(200);
    expect(response.headers['x-request-id']).not.toBe('untrusted-input');
  });

  it('allows preflight from the configured browser origin', async () => {
    const response = await request(server)
      .options('/api/v1/health/live')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET')
      .expect(204);
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
    expect(
      response.headers['access-control-allow-credentials'],
    ).toBeUndefined();
  });

  it('does not grant CORS access to an unknown origin', async () => {
    const response = await request(server)
      .get('/api/v1/health/live')
      .set('Origin', 'https://untrusted.example')
      .expect(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it.each([undefined, 'Bearer fabricated-token'])(
    'denies private routes even with an unverified header: %s',
    async (authorization) => {
      const call = request(server).get('/api/v1/test/private');
      if (authorization) call.set('Authorization', authorization);
      const response = await call.expect(401);
      expect(response.text).not.toContain('must-not-be-returned');
    },
  );

  it('accepts a valid DTO', async () => {
    await request(server)
      .post('/api/v1/test/validate')
      .send({ name: 'Example' })
      .expect(201, { name: 'Example' });
  });

  it.each([
    { name: 'Example', admin: true },
    { name: 123 },
    {},
    { name: null },
  ])('rejects unknown fields and invalid DTOs: %j', async (body) => {
    await request(server).post('/api/v1/test/validate').send(body).expect(400);
  });

  it('rejects malformed JSON without echoing the body', async () => {
    const response = await request(server)
      .post('/api/v1/test/validate')
      .set('Content-Type', 'application/json')
      .send('{"secret":"do-not-echo"')
      .expect(400);
    expect(response.text).not.toContain('do-not-echo');
    expect(response.body).toMatchObject({
      requestId: response.headers['x-request-id'],
    });
  });

  it('rejects oversized payloads', async () => {
    await request(server)
      .post('/api/v1/test/validate')
      .send({ name: 'a'.repeat(33 * 1024) })
      .expect(413);
  });

  it.each(['failure', 'http-failure'])('sanitizes %s errors', async (route) => {
    const logger = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    try {
      const response = await request(server)
        .get(`/api/v1/test/${route}`)
        .expect(500);
      expect(response.body).toMatchObject({
        statusCode: 500,
        message: 'Internal server error',
        requestId: response.headers['x-request-id'],
      });
      expect(response.text).not.toContain('must-not-leak');
      expect(JSON.stringify(logger.mock.calls)).not.toContain('must-not-leak');
    } finally {
      logger.mockRestore();
    }
  });

  it('returns a structured 404', async () => {
    const response = await request(server).get('/api/v1/missing').expect(404);
    expect(response.body).toMatchObject({ statusCode: 404 });
  });

  it('limits requests without trusting spoofed forwarded IPs', async () => {
    const limitedApp = await createApp(3);
    try {
      const limitedServer = limitedApp.getHttpServer();
      for (let index = 0; index < 3; index += 1) {
        await request(limitedServer).get('/api/v1/health/live').expect(200);
      }
      const response = await request(limitedServer)
        .get('/api/v1/health/live')
        .set('X-Forwarded-For', '203.0.113.100')
        .expect(429);
      expect(response.headers['retry-after']).toBeDefined();
    } finally {
      await limitedApp.close();
    }
  });
});
