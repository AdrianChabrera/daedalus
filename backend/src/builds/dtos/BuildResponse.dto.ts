import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsArray,
  IsOptional,
} from 'class-validator';

export class BuildResponseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string;

  @IsOptional()
  pcCaseName?: string;

  @IsOptional()
  cpuCoolerName?: string;

  @IsOptional()
  cpuName?: string;

  @IsArray()
  fanNames?: string[];

  @IsOptional()
  gpuName?: string;

  @IsOptional()
  keyboardName?: string;

  @IsArray()
  monitorNames?: string[];

  @IsOptional()
  motherboardName?: string;

  @IsOptional()
  mouseName?: string;

  @IsOptional()
  powerSupplyName?: string;

  @IsArray()
  ramNames?: string[];

  @IsArray()
  storageDriveNames?: string[];

  @IsNotEmpty()
  username!: string;
}
