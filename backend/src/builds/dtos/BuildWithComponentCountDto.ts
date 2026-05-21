import { IsNotEmpty, IsNumber } from 'class-validator';
import { Build } from '../entities/build.entity';

export class BuildWithComponentCountDto {
  build!: Build;

  @IsNumber()
  @IsNotEmpty()
  quantity!: number;
}
