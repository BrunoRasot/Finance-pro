import {
  Body,
  Controller,
  Get,
  Header,
  Patch,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/security/current-user.decorator';
import { AccountsService } from '../application/accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { ListAccountsDto } from './dto/list-accounts.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

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
      items: await this.accounts.list(
        ownerId,
        query.limit,
        query.offset,
        query.status === 'ARCHIVED',
      ),
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

  @Patch(':id')
  @Header('Cache-Control', 'no-store')
  update(
    @CurrentUser() ownerId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accounts.update(ownerId, id, dto);
  }

  @Post(':id/archive')
  @Header('Cache-Control', 'no-store')
  archive(
    @CurrentUser() ownerId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.accounts.setArchived(ownerId, id, true);
  }

  @Post(':id/restore')
  @Header('Cache-Control', 'no-store')
  restore(
    @CurrentUser() ownerId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.accounts.setArchived(ownerId, id, false);
  }
}
