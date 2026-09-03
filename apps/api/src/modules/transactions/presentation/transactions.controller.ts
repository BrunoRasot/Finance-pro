import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/security/current-user.decorator';
import { TransactionsService } from '../application/transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsDto } from './dto/list-transactions.dto';
@Controller('accounts/:accountId')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}
  @Post('transactions')
  @Header('Cache-Control', 'no-store')
  create(
    @CurrentUser() ownerId: string,
    @Param('accountId', new ParseUUIDPipe()) accountId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactions.create(ownerId, accountId, dto);
  }
  @Get('transactions')
  @Header('Cache-Control', 'no-store')
  list(
    @CurrentUser() ownerId: string,
    @Param('accountId', new ParseUUIDPipe()) accountId: string,
    @Query() query: ListTransactionsDto,
  ) {
    return this.transactions.list(ownerId, accountId, query);
  }
  @Get('balance')
  @Header('Cache-Control', 'no-store')
  balance(
    @CurrentUser() ownerId: string,
    @Param('accountId', new ParseUUIDPipe()) accountId: string,
  ) {
    return this.transactions.balance(ownerId, accountId);
  }
}
