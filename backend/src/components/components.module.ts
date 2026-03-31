import { Module } from '@nestjs/common';
import { ComponentsController } from './components.controller';
import { ComponentsService } from './components.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Case } from './entities/main-entities/case.entity';
import { Cpu } from './entities/main-entities/cpu.entity';
import { Fan } from './entities/main-entities/fan.entity';
import { CpuCooler } from './entities/main-entities/cpu-cooler.entity';
import { Gpu } from './entities/main-entities/gpu.entity';
import { Keyboard } from './entities/main-entities/keyboard.entity';
import { Monitor } from './entities/main-entities/monitor.entity';
import { Motherboard } from './entities/main-entities/motherboard.entity';
import { Mouse } from './entities/main-entities/mouse.entity';
import { PowerSupply } from './entities/main-entities/power-supply.entity';
import { Ram } from './entities/main-entities/ram.entity';
import { StorageDrive } from './entities/main-entities/storage.entity';
import { PcieSlot } from './entities/secondary-entities/pcie-slot.entity';
import { M2Slot } from './entities/secondary-entities/m2-slot.entity';

@Module({
  controllers: [ComponentsController],
  providers: [ComponentsService],
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
    ]),
  ],
})
export class ComponentsModule {}
