import { Body, Controller, Delete, HttpCode } from '@nestjs/common';
import { CurrentUser } from '../../../common/security/current-user.decorator';
import { ProfileService } from '../application/profile.service';
import { DeleteProfileDto } from './dto/delete-profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Delete()
  @HttpCode(204)
  async delete(
    @CurrentUser() ownerId: string,
    @Body() body: DeleteProfileDto,
  ): Promise<void> {
    void body;
    await this.profile.delete(ownerId);
  }
}
