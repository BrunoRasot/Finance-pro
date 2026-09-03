import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AccountsService } from './application/accounts.service';
import { AccountRepository } from './application/ports/account.repository';
import { PrismaAccountRepository } from './infrastructure/persistence/prisma-account.repository';
import { AccountsController } from './presentation/accounts.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AccountsController],
  providers: [
    AccountsService,
    { provide: AccountRepository, useClass: PrismaAccountRepository },
  ],
})
export class AccountsModule {}
