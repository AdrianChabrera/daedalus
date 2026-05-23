import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsArray,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Build } from '../entities/build.entity';
import { StorageDrive } from '../../components/entities/main-entities/storage-drive.entity';
import { Ram } from '../../components/entities/main-entities/ram.entity';
import { PowerSupply } from '../../components/entities/main-entities/power-supply.entity';
import { Mouse } from '../../components/entities/main-entities/mouse.entity';
import { Motherboard } from '../../components/entities/main-entities/motherboard.entity';
import { Monitor } from '../../components/entities/main-entities/monitor.entity';
import { Keyboard } from '../../components/entities/main-entities/keyboard.entity';
import { Gpu } from '../../components/entities/main-entities/gpu.entity';
import { Fan } from '../../components/entities/main-entities/fan.entity';
import { Cpu } from '../../components/entities/main-entities/cpu.entity';
import { CpuCooler } from '../../components/entities/main-entities/cpu-cooler.entity';
import { PcCase } from '../../components/entities/main-entities/pc-case.entity';
import { ComponentWithQuantityResponseDto } from './ComponentWithQuantityResponse.dto';

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

  @IsString()
  @IsOptional()
  photoUrl?: string | null;

  @IsOptional()
  pcCase?: PcCase | null;

  @IsOptional()
  cpuCooler?: CpuCooler | null;

  @IsOptional()
  cpu?: Cpu | null;

  @IsArray()
  fans?: ComponentWithQuantityResponseDto<Fan>[];

  @IsOptional()
  gpu?: Gpu | null;

  @IsOptional()
  keyboard?: Keyboard | null;

  @IsArray()
  monitors?: ComponentWithQuantityResponseDto<Monitor>[];

  @IsOptional()
  motherboard?: Motherboard | null;

  @IsOptional()
  mouse?: Mouse | null;

  @IsOptional()
  powerSupply?: PowerSupply | null;

  @IsArray()
  rams?: ComponentWithQuantityResponseDto<Ram>[];

  @IsArray()
  storageDrives?: ComponentWithQuantityResponseDto<StorageDrive>[];

  @IsNotEmpty()
  username!: string;

  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @IsOptional()
  averageRating?: number | null;

  @IsOptional()
  reviewCount?: number;

  constructor(build: Build, username: string) {
    this.name = build.name;
    this.description = build.description;
    this.photoUrl = build.photoUrl;
    this.username = username;
    this.id = build.id;
    this.published = build.published;

    this.averageRating = build.averageRating ?? null;
    this.reviewCount = build.reviewCount ?? 0;

    this.pcCase = build.pcCase;
    this.cpuCooler = build.cpuCooler;
    this.cpu = build.cpu;
    this.motherboard = build.motherboard;
    this.powerSupply = build.powerSupply;
    this.gpu = build.gpu;
    this.keyboard = build.keyboard;
    this.mouse = build.mouse;

    this.fans =
      build.fans?.map(
        (bf) => new ComponentWithQuantityResponseDto(bf.fan, bf.quantity),
      ) ?? [];
    this.rams =
      build.rams?.map(
        (br) => new ComponentWithQuantityResponseDto(br.ram, br.quantity),
      ) ?? [];
    this.monitors =
      build.monitors?.map(
        (bm) => new ComponentWithQuantityResponseDto(bm.monitor, bm.quantity),
      ) ?? [];
    this.storageDrives =
      build.storageDrives?.map(
        (bs) =>
          new ComponentWithQuantityResponseDto(bs.storageDrive, bs.quantity),
      ) ?? [];
  }
}
