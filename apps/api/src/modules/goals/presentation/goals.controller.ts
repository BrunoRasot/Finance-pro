import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/security/current-user.decorator';
import { GoalsService } from '../application/goals.service';
import {
  CreateContributionDto,
  CreateGoalDto,
  ListGoalsDto,
  UpdateGoalDto,
} from './dto/goal.dto';

@Controller('goals')
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}
  @Post()
  @Header('Cache-Control', 'no-store')
  create(@CurrentUser() ownerId: string, @Body() dto: CreateGoalDto) {
    return this.goals.create(ownerId, dto);
  }
  @Get()
  @Header('Cache-Control', 'no-store')
  async list(@CurrentUser() ownerId: string, @Query() query: ListGoalsDto) {
    return {
      items: await this.goals.list(ownerId, query.status === 'ARCHIVED'),
    };
  }
  @Patch(':id')
  @Header('Cache-Control', 'no-store')
  update(
    @CurrentUser() ownerId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goals.update(ownerId, id, dto);
  }
  @Post(':id/archive')
  @Header('Cache-Control', 'no-store')
  archive(
    @CurrentUser() ownerId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.goals.setArchived(ownerId, id, true);
  }
  @Post(':id/restore')
  @Header('Cache-Control', 'no-store')
  restore(
    @CurrentUser() ownerId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.goals.setArchived(ownerId, id, false);
  }
  @Post(':id/contributions')
  @Header('Cache-Control', 'no-store')
  contribute(
    @CurrentUser() ownerId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateContributionDto,
  ) {
    return this.goals.contribute(ownerId, id, dto);
  }
}
