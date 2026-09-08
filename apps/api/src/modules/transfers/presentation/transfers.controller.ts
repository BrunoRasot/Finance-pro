import { Body, Controller, Header, Post } from '@nestjs/common';
import { CurrentUser } from '../../../common/security/current-user.decorator';
import { TransfersService } from '../application/transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';

@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfers: TransfersService) {}

  @Post()
  @Header('Cache-Control', 'no-store')
  create(@CurrentUser() ownerId: string, @Body() dto: CreateTransferDto) {
    return this.transfers.create(ownerId, dto);
  }
}
