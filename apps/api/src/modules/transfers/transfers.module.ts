import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { TransfersService } from './application/transfers.service';
import { TransferRepository } from './application/ports/transfer.repository';
import { PrismaTransferRepository } from './infrastructure/persistence/prisma-transfer.repository';
import { TransfersController } from './presentation/transfers.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [TransfersController],
  providers: [
    TransfersService,
    { provide: TransferRepository, useClass: PrismaTransferRepository },
  ],
})
export class TransfersModule {}
