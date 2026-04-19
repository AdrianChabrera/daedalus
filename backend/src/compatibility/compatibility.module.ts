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
import { R01CpuMotherboardSocketRule } from './rules/rules/r01-cpu-motherboard-socket.rule';
import { R02CpuCpuCoolerSocketRule } from './rules/rules/r02-cpu-cpu-cooler-socket.rule';
import { R03CpuRamTypeRule } from './rules/rules/r03-cpu-ram-type.rule';
import { R04CpuMustHaveCoolerRule } from './rules/rules/r04-cpu-must-have-cooler.rule';
import { R06GpuFitsInCaseRule } from './rules/rules/r06-gpu-fits-in-case.rule';
import { R08SystemMustHaveGpuRule } from './rules/rules/r08-system-must-have-gpu.rule';
import { R14RamMotherboardMemoryTypeRule } from './rules/rules/r14-ram-motherboard-memory-type.rule';
import { W01MultipleRamModelsWarning } from './rules/warnings/w01-multiple-ram-models.warning';
import { R15RamQuantityLimitRule } from './rules/rules/r15-ram-quantity-limit.rule';
import { R16RamMotherboardMaxMemoryRule } from './rules/rules/r16-ram-motherboard-max-memory.rule';
import { W02RamCpuMotherboardEccRule } from './rules/warnings/w02-ram-cpu-motherboard-ecc.rule';
import { R19CpuCoolerFitsInCaseRule } from './rules/rules/r19-cpu-cooler-fits-in-case-rule';
import { R18MotherboardCaseFormFactorRule } from './rules/rules/r18-motherboard-case-form-factor.rule';
import { R20RadiatorFitsInCaseRule } from './rules/rules/r20-radiator-fits-in-case.rule';
import { W03IncludedPowerSupplyWarning } from './rules/warnings/w03-included-power-supply.warning';
import { R21PSUEnoughEneryForAllSystemRule } from './rules/rules/r21-psu-enough-energy-for-all-system.rule';
import { R17RamMotherboardFormFactorRule } from './rules/rules/r17-ram-motherboard-form-factor.rule';
import { R12R13DrivesBaysRule } from './rules/rules/r12-r13-SSD-HDD-bays.rule';
import { R09R10M2SlotAssignmentRule } from './rules/rules/r09-r10-m2-drive-needs-slot.rule';
import { W04M2SlotGenRule } from './rules/warnings/w04-m2-slot-gen.rule';
import { R23MotherbardU2PortsRule } from './rules/rules/r23-motherboard-u2-ports.rule';
import { R22MotherboardSataPortsRule } from './rules/rules/r22-motherboard-sata-ports.rule';
import { U01UnverifiableStorageInterfaces } from './rules/unverifiable/u01-unverifiable-storage-interfaces.unverifiable';
import { R07R11PcieSlotAssignmentRule } from './rules/rules/r07-r11-pcie-slot-assignments.rule';
import { R05GpuPowerConnectorsRule } from './rules/rules/r05-gpu-power-connectors.rule';
import { W05W06CpuPowerConnectorWarning } from './rules/warnings/w05-w06-cpu-power-connector.warning';
import { R24R25SATAConnectorsRule } from './rules/rules/r24-r25-SATA-power-connectors.rule';

const rules = [
  new R01CpuMotherboardSocketRule(),
  new R02CpuCpuCoolerSocketRule(),
  new R03CpuRamTypeRule(),
  new R04CpuMustHaveCoolerRule(),
  new R05GpuPowerConnectorsRule(),
  new R06GpuFitsInCaseRule(),
  new R07R11PcieSlotAssignmentRule(),
  new R08SystemMustHaveGpuRule(),
  new R09R10M2SlotAssignmentRule(),
  new R12R13DrivesBaysRule(),
  new R14RamMotherboardMemoryTypeRule(),
  new R15RamQuantityLimitRule(),
  new R16RamMotherboardMaxMemoryRule(),
  new R17RamMotherboardFormFactorRule(),
  new R18MotherboardCaseFormFactorRule(),
  new R19CpuCoolerFitsInCaseRule(),
  new R20RadiatorFitsInCaseRule(),
  new R21PSUEnoughEneryForAllSystemRule(),
  new R22MotherboardSataPortsRule(),
  new R23MotherbardU2PortsRule(),
  new R24R25SATAConnectorsRule(),
  new W01MultipleRamModelsWarning(),
  new W02RamCpuMotherboardEccRule(),
  new W03IncludedPowerSupplyWarning(),
  new W04M2SlotGenRule(),
  new W05W06CpuPowerConnectorWarning(),
  new U01UnverifiableStorageInterfaces(),
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
