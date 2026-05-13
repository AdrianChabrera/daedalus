import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
import { BuildsModule } from 'src/builds/builds.module';
import { ComponentsModule } from 'src/components/components.module';
import { Review } from './entities/review.entity';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService],
  imports: [
    TypeOrmModule.forFeature([Review]),
    UsersModule,
    BuildsModule,
    ComponentsModule,
  ],
})
export class ReviewsModule {}
