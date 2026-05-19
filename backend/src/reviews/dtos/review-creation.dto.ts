import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { ComponentType } from '../../components/entities/component-type.enum';

export class ReviewCreationDto {
  @IsString()
  @Length(0, 1000)
  @IsOptional()
  text?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  stars?: number;

  @IsInt()
  @IsOptional()
  buildId?: number;

  @IsString()
  @IsEnum(ComponentType)
  @IsOptional()
  componentType!: string;

  @IsString()
  @IsUUID('4')
  @IsOptional()
  componentId?: string;
}
