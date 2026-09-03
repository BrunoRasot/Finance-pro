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
import { AccountsService } from '../application/accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { ListAccountsDto } from './dto/list-accounts.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Post()
  @Header('Cache-Control', 'no-store')
  create(@CurrentUser() ownerId: string, @Body() dto: CreateAccountDto) {
    return this.accounts.create(ownerId, dto);
  }

  @Get()
  @Header('Cache-Control', 'no-store')
  async list(@CurrentUser() ownerId: string, @Query() query: ListAccountsDto) {
    return {
      items: await this.accounts.list(ownerId, query.limit, query.offset),
      limit: query.limit,
      offset: query.offset,
    };
  }

  @Get(':id')
  @Header('Cache-Control', 'no-store')
  find(
    @CurrentUser() ownerId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.accounts.find(ownerId, id);
  }
}
