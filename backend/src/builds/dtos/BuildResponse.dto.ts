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
import { StorageDrive } from 'src/components/entities/main-entities/storage.entity';
import { Ram } from 'src/components/entities/main-entities/ram.entity';
import { PowerSupply } from 'src/components/entities/main-entities/power-supply.entity';
import { Mouse } from 'src/components/entities/main-entities/mouse.entity';
import { Motherboard } from 'src/components/entities/main-entities/motherboard.entity';
import { Monitor } from 'src/components/entities/main-entities/monitor.entity';
import { Keyboard } from 'src/components/entities/main-entities/keyboard.entity';
import { Gpu } from 'src/components/entities/main-entities/gpu.entity';
import { Fan } from 'src/components/entities/main-entities/fan.entity';
import { Cpu } from 'src/components/entities/main-entities/cpu.entity';
import { CpuCooler } from 'src/components/entities/main-entities/cpu-cooler.entity';
import { PcCase } from 'src/components/entities/main-entities/pc-case.entity';

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
  pcCase?: PcCase | null;

  @IsOptional()
  cpuCooler?: CpuCooler | null;

  @IsOptional()
  cpu?: Cpu | null;

  @IsArray()
  fans?: Fan[];

  @IsOptional()
  gpu?: Gpu | null;

  @IsOptional()
  keyboard?: Keyboard | null;

  @IsArray()
  monitors?: Monitor[];

  @IsOptional()
  motherboard?: Motherboard | null;

  @IsOptional()
  mouse?: Mouse | null;

  @IsOptional()
  powerSupply?: PowerSupply | null;

  @IsArray()
  rams?: Ram[];

  @IsArray()
  storageDrives?: StorageDrive[];

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

    this.pcCase = build.pcCase;
    this.cpuCooler = build.cpuCooler;
    this.cpu = build.cpu;
    this.motherboard = build.motherboard;
    this.powerSupply = build.powerSupply;
    this.gpu = build.gpu;
    this.keyboard = build.keyboard;
    this.mouse = build.mouse;

    this.fans = build.fans?.map((bf) => bf.fan ?? 'Unknown Fan') ?? [];
    this.rams = build.rams?.map((br) => br.ram ?? 'Unknown Ram') ?? [];
    this.monitors =
      build.monitors?.map((bm) => bm.monitor ?? 'Unknown Monitor') ?? [];
    this.storageDrives =
      build.storageDrives?.map(
        (bs) => bs.storageDrive ?? 'Unknown Storage Drive',
      ) ?? [];
  }
}
