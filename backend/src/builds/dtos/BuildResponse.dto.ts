import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsArray,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Build } from '../entities/build';

export class BuildResponseDto {
  @IsNumber()
  id!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string;

  @IsOptional()
  pcCaseName?: string | null;

  @IsOptional()
  cpuCoolerName?: string | null;

  @IsOptional()
  cpuName?: string | null;

  @IsArray()
  fanNames?: string[];

  @IsOptional()
  gpuName?: string | null;

  @IsOptional()
  keyboardName?: string | null;

  @IsArray()
  monitorNames?: string[];

  @IsOptional()
  motherboardName?: string | null;

  @IsOptional()
  mouseName?: string | null;

  @IsOptional()
  powerSupplyName?: string | null;

  @IsArray()
  ramNames?: string[];

  @IsArray()
  storageDriveNames?: string[];

  @IsNotEmpty()
  username!: string;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  constructor(build: Build, username: string) {
    this.name = build.name;
    this.description = build.description;
    this.username = username;
    this.id = build.id;

    this.pcCaseName = build.pcCase?.name;
    this.cpuCoolerName = build.cpuCooler?.name;
    this.cpuName = build.cpu?.name;
    this.motherboardName = build.motherboard?.name;
    this.powerSupplyName = build.powerSupply?.name;
    this.gpuName = build.gpu?.name;
    this.keyboardName = build.keyboard?.name;
    this.mouseName = build.mouse?.name;

    this.fanNames =
      build.fans?.map((bf) => bf.fan?.name ?? 'Unknown Fan') ?? [];
    this.ramNames =
      build.rams?.map((br) => br.ram?.name ?? 'Unknown Ram') ?? [];
    this.monitorNames =
      build.monitors?.map((bm) => bm.monitor?.name ?? 'Unknown Monitor') ?? [];
    this.storageDriveNames =
      build.storageDrives?.map(
        (bs) => bs.storageDrive?.name ?? 'Unknown Storage Drive',
      ) ?? [];
  }
}
