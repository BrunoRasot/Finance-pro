import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/configure-app';
import type { Environment } from './config/environment';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  configureApp(app);
  app.enableShutdownHooks();
  const config = app.get(ConfigService<Environment, true>);
  await app.listen(
    config.get('PORT', { infer: true }),
    config.get('HOST', { infer: true }),
  );
  Logger.log(`API listening at ${await app.getUrl()}/api/v1`, 'Bootstrap');
}

void bootstrap().catch(() => {
  Logger.error(
    'API startup failed. Check configuration and port availability.',
    'Bootstrap',
  );
  process.exitCode = 1;
});
