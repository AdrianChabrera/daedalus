import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuildsService } from './builds.service';
import { BuildsController } from './builds.controller';
import { Case } from '../components/entities/main-entities/case.entity';
import { CpuCooler } from '../components/entities/main-entities/cpu-cooler.entity';
import { Cpu } from '../components/entities/main-entities/cpu.entity';
import { Fan } from '../components/entities/main-entities/fan.entity';
import { Gpu } from '../components/entities/main-entities/gpu.entity';
import { Keyboard } from '../components/entities/main-entities/keyboard.entity';
import { Monitor } from '../components/entities/main-entities/monitor.entity';
import { Motherboard } from '../components/entities/main-entities/motherboard.entity';
import { Mouse } from '../components/entities/main-entities/mouse.entity';
import { PowerSupply } from '../components/entities/main-entities/power-supply.entity';
import { Ram } from '../components/entities/main-entities/ram.entity';
import { StorageDrive } from '../components/entities/main-entities/storage.entity';
import { M2Slot } from '../components/entities/secondary-entities/m2-slot.entity';
import { PcieSlot } from '../components/entities/secondary-entities/pcie-slot.entity';
import { Build } from './entities/build';
import { UsersModule } from '../users/users.module';
import { ComponentsModule } from '../components/components.module';
import { BuildFan } from './entities/build-fans.entity';
import { BuildRam } from './entities/build-rams.entity';
import { BuildMonitor } from './entities/build-monitors.entity';
import { BuildStorageDrive } from './entities/build-storage-drives.entity';

@Module({
  controllers: [BuildsController],
  providers: [BuildsService],
  imports: [
    TypeOrmModule.forFeature([
      Case,
      CpuCooler,
      Cpu,
      Fan,
      Gpu,
      Keyboard,
      Monitor,
      Motherboard,
      Mouse,
      PowerSupply,
      Ram,
      StorageDrive,
      M2Slot,
      PcieSlot,
      Build,
      BuildFan,
      BuildRam,
      BuildMonitor,
      BuildStorageDrive,
    ]),
    UsersModule,
    ComponentsModule,
  ],
})
export class BuildsModule {}
