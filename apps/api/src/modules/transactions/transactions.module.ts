import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { TransactionsService } from './application/transactions.service';
import { TransactionRepository } from './application/ports/transaction.repository';
import { PrismaTransactionRepository } from './infrastructure/persistence/prisma-transaction.repository';
import { TransactionsController } from './presentation/transactions.controller';
@Module({
  imports: [DatabaseModule],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    { provide: TransactionRepository, useClass: PrismaTransactionRepository },
  ],
})
export class TransactionsModule {}
