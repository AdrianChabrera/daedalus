import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsUUID,
  IsArray,
  IsOptional,
} from 'class-validator';
import { ComponentWithQuantityDto } from './ComponentWithQuantity.dto';

export class BuildCreationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsUUID('4')
  @IsOptional()
  caseId?: string;

  @IsUUID('4')
  @IsOptional()
  cpuCoolerId?: string;

  @IsUUID('4')
  @IsOptional()
  cpuId?: string;

  @IsArray()
  @IsNotEmpty()
  fanIds?: ComponentWithQuantityDto[];

  @IsUUID('4')
  @IsOptional()
  gpuId?: string;

  @IsUUID('4')
  @IsOptional()
  keyboardId?: string;

  @IsArray()
  @IsNotEmpty()
  monitorIds?: ComponentWithQuantityDto[];

  @IsUUID('4')
  @IsOptional()
  motherboardId?: string;

  @IsUUID('4')
  @IsOptional()
  mouseId?: string;

  @IsUUID('4')
  @IsOptional()
  powerSupplyId?: string;

  @IsArray()
  @IsNotEmpty()
  ramIds?: ComponentWithQuantityDto[];

  @IsArray()
  @IsNotEmpty()
  storageDriveIds?: ComponentWithQuantityDto[];
}
