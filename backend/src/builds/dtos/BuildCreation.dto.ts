import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsUUID,
  IsArray,
  IsOptional,
} from 'class-validator';

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
  @IsUUID('4', { each: true })
  fanIds?: string[];

  @IsUUID('4')
  @IsOptional()
  gpuId?: string;

  @IsUUID('4')
  keyboardId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  monitorIds?: string[];

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
  @IsUUID('4', { each: true })
  ramIds?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  storageDriveIds?: string[];
}
