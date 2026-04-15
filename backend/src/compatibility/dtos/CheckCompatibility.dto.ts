import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { ComponentWithQuantityDto } from 'src/builds/dtos/ComponentWithQuantity.dto';

export class CheckCompatibilityDto {
  @IsOptional()
  buildId?: number;

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
  @IsOptional()
  fanIds?: ComponentWithQuantityDto[];

  @IsUUID('4')
  @IsOptional()
  gpuId?: string;

  @IsUUID('4')
  @IsOptional()
  keyboardId?: string;

  @IsArray()
  @IsOptional()
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
  @IsOptional()
  ramIds?: ComponentWithQuantityDto[];

  @IsArray()
  @IsOptional()
  storageDriveIds?: ComponentWithQuantityDto[];
}
