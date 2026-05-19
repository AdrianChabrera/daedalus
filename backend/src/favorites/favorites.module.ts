import { Module } from '@nestjs/common';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserFavoriteComponent } from './entities/userFavoriteComponent.entity';
import { UsersModule } from '../users/users.module';
import { BuildsModule } from '../builds/builds.module';
import { ComponentsModule } from '../components/components.module';

@Module({
  controllers: [FavoritesController],
  providers: [FavoritesService],
  imports: [
    TypeOrmModule.forFeature([UserFavoriteComponent]),
    UsersModule,
    BuildsModule,
    ComponentsModule,
  ],
})
export class FavoritesModule {}
