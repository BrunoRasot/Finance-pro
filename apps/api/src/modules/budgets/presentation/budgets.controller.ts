import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/security/current-user.decorator';
import { BudgetsService } from '../application/budgets.service';
import { BudgetMonthDto, SaveBudgetDto } from './dto/budget.dto';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgets: BudgetsService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async list(@CurrentUser() ownerId: string, @Query() query: BudgetMonthDto) {
    return {
      month: query.month,
      items: await this.budgets.list(ownerId, query.month),
    };
  }

  @Put()
  @Header('Cache-Control', 'no-store')
  save(@CurrentUser() ownerId: string, @Body() dto: SaveBudgetDto) {
    return this.budgets.save(ownerId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUser() ownerId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.budgets.remove(ownerId, id);
  }
}
