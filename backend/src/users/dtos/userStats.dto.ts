import { IsDate, IsInt } from 'class-validator';

export class UserStatsDto {
  @IsInt()
  buildsCount!: number;

  @IsInt()
  favoriteBuildsCount!: number;

  @IsInt()
  favoriteComponentsCount!: number;

  @IsInt()
  reviewsCount!: number;

  @IsDate()
  memberSince!: Date;
}
