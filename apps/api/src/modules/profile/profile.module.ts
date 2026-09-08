import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { ProfileService } from './application/profile.service';
import { ProfileController } from './presentation/profile.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
