import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { json } from 'express';
import helmet from 'helmet';
import type { Environment } from '../config/environment';
import { requestIdMiddleware } from '../common/http/request-id.middleware';

export function configureApp(app: NestExpressApplication): void {
  const config = app.get(ConfigService<Environment, true>);

  app.disable('x-powered-by');
  // Do not trust forwarded client IPs until the deployment proxy is known.
  app.set('trust proxy', false);
  app.use(requestIdMiddleware);
  app.use(helmet());
  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    exposedHeaders: ['X-Request-Id'],
    credentials: false,
    maxAge: 600,
  });
  app.use(json({ limit: '32kb' }));
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transformOptions: { enableImplicitConversion: false },
      validationError: { target: false, value: false },
      exceptionFactory: () => new BadRequestException('Invalid request data'),
    }),
  );
}
