import {
  IsEnum,
  IsInt,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { ComponentType } from 'src/components/entities/component-type.enum';

export class ReviewCreationDto {
  @IsString()
  @Length(0, 1000)
  text?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  stars?: number;

  @IsInt()
  buildId?: number;

  @IsString()
  @IsEnum(ComponentType)
  componentType!: string;

  @IsString()
  @IsUUID('4')
  componentId?: string;
}
