import { Module } from '@nestjs/common';
import { CompatibilityController } from './compatibility.controller';
import { CompatibilityService } from './compatibility.service';
import { PcCase } from 'src/components/entities/main-entities/pc-case.entity';
import { CpuCooler } from 'src/components/entities/main-entities/cpu-cooler.entity';
import { Cpu } from 'src/components/entities/main-entities/cpu.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { Gpu } from 'src/components/entities/main-entities/gpu.entity';
import { Fan } from 'src/components/entities/main-entities/fan.entity';
import { Keyboard } from 'src/components/entities/main-entities/keyboard.entity';
import { Monitor } from 'src/components/entities/main-entities/monitor.entity';
import { Motherboard } from 'src/components/entities/main-entities/motherboard.entity';
import { Mouse } from 'src/components/entities/main-entities/mouse.entity';
import { PowerSupply } from 'src/components/entities/main-entities/power-supply.entity';
import { Ram } from 'src/components/entities/main-entities/ram.entity';
import { StorageDrive } from 'src/components/entities/main-entities/storage.entity';
import { M2Slot } from 'src/components/entities/secondary-entities/m2-slot.entity';
import { PcieSlot } from 'src/components/entities/secondary-entities/pcie-slot.entity';
import { Build } from 'src/builds/entities/build';
import { BuildFan } from 'src/builds/entities/build-fans.entity';
import { BuildRam } from 'src/builds/entities/build-rams.entity';
import { BuildMonitor } from 'src/builds/entities/build-monitors.entity';
import { BuildStorageDrive } from 'src/builds/entities/build-storage-drives.entity';
import { ComponentsModule } from 'src/components/components.module';
import { BuildsModule } from 'src/builds/builds.module';
import { COMPATIBILITY_RULES } from './interfaces/compatibility-rule.interface';
import { R01CpuMotherboardSocketRule } from './rules/r01-cpu-motherboard-socket.rule';
import { R02CpuCpuCoolerSocketRule } from './rules/r02-cpu-cpu-cooler-socket.rule';
import { R03CpuRamTypeRule } from './rules/r03-cpu-ram-type.rule';
import { R04CpuMustHaveCoolerRule } from './rules/r04-cpu-must-have-cooler.rule';
import { R06GpuFitsInCaseRule } from './rules/r06-gpu-fits-in-case.rule';
import { R08SystemMustHaveGpuRule } from './rules/r08-system-must-have-gpu.rule';
import { R14RamMotherboardMemoryTypeRule } from './rules/r14-ram-motherboard-memory-type.rule';
import { W01MultipleRamModelsWarning } from './warnings/w01-multiple-ram-models.warning';
import { R15RamQuantityLimitRule } from './rules/r15-ram-quantity-limit.rule';
import { R16RamMotherboardMaxMemoryRule } from './rules/r16-ram-motherboard-max-memory.rule';
import { W02RamCpuMotherboardEccRule } from './warnings/w02-ram-cpu-motherboard-ecc.rule';
import { R19CpuCoolerFitsInCaseRule } from './rules/r19-cpu-cooler-fits-in-case-rule';
import { R18MotherboardCaseFormFactorRule } from './rules/r18-motherboard-case-form-factor.rule';
import { R20RadiatorFitsInCaseRule } from './rules/r20-radiator-fits-in-case.rule';
import { W03IncludedPowerSupplyWarning } from './warnings/w03-included-power-supply.warning';
import { R21PSUEnoughEneryForAllSystemRule } from './rules/r21-psu-enough-energy-for-all-system.rule';
import { R17RamMotherboardFormFactorRule } from './rules/r17-ram-motherboard-form-factor.rule';

const rules = [
  new R01CpuMotherboardSocketRule(),
  new R02CpuCpuCoolerSocketRule(),
  new R03CpuRamTypeRule(),
  new R04CpuMustHaveCoolerRule(),
  new R06GpuFitsInCaseRule(),
  new R08SystemMustHaveGpuRule(),
  new R14RamMotherboardMemoryTypeRule(),
  new R15RamQuantityLimitRule(),
  new R16RamMotherboardMaxMemoryRule(),
  new R17RamMotherboardFormFactorRule(),
  new R18MotherboardCaseFormFactorRule(),
  new R19CpuCoolerFitsInCaseRule(),
  new R20RadiatorFitsInCaseRule(),
  new R21PSUEnoughEneryForAllSystemRule(),
  new W01MultipleRamModelsWarning(),
  new W02RamCpuMotherboardEccRule(),
  new W03IncludedPowerSupplyWarning(),
];

@Module({
  controllers: [CompatibilityController],
  providers: [
    CompatibilityService,
    {
      provide: COMPATIBILITY_RULES,
      useFactory: () => {
        return [...rules];
      },
    },
  ],
  imports: [
    TypeOrmModule.forFeature([
      PcCase,
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
    BuildsModule,
    ComponentsModule,
  ],
})
export class CompatibilityModule {}
