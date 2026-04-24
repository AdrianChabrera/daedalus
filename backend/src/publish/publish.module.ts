import { Module } from '@nestjs/common';
import { BuildsModule } from 'src/builds/builds.module';
import { CompatibilityModule } from 'src/compatibility/compatibility.module';
import { PublishService } from './publish.service';
import { PublishController } from './publish.controller';

@Module({
  controllers: [PublishController],
  providers: [PublishService],
  imports: [BuildsModule, CompatibilityModule],
})
export class PublishModule {}
