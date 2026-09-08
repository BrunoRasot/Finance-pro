import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ApiExceptionFilter } from './common/http/api-exception.filter';
import { AccessGuard } from './common/security/access.guard';
import { validateEnvironment, type Environment } from './config/environment';
import { HealthModule } from './modules/health/health.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TransfersModule } from './modules/transfers/transfers.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { GoalsModule } from './modules/goals/goals.module';
import { ExportsModule } from './modules/exports/exports.module';
import { TokenVerifier } from './common/security/token-verifier';
import { SupabaseTokenVerifier } from './common/security/supabase-token-verifier';
import { ProfileModule } from './modules/profile/profile.module';
import { rateLimitTracker } from './common/security/rate-limit-tracker';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env',
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => [
        {
          ttl: config.get('RATE_LIMIT_TTL_MS', { infer: true }),
          limit: config.get('RATE_LIMIT_MAX', { infer: true }),
          getTracker: (request) => Promise.resolve(rateLimitTracker(request)),
        },
      ],
    }),
    HealthModule,
    AccountsModule,
    TransactionsModule,
    ReportsModule,
    TransfersModule,
    BudgetsModule,
    GoalsModule,
    ExportsModule,
    ProfileModule,
  ],
  providers: [
    { provide: TokenVerifier, useClass: SupabaseTokenVerifier },
    { provide: APP_GUARD, useClass: AccessGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class AppModule {}
