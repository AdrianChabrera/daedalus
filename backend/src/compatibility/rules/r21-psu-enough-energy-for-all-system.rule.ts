import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../consts/compatibilityMessages';

@Injectable()
export class R21PSUEnoughEneryForAllSystemRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { cpu, gpu, powerSupply } = build;
    if (!cpu || !powerSupply) return null;

    if (!cpu.tdp || !powerSupply.wattage || (gpu && !gpu.tdp)) {
      return {
        rule: 'R21_PSU_ENOUGH_ENERGY_FOR_ALL_SYSTEM',
        severity: 'unverifiable',
        message:
          'We are sorry, but we cannot verify if the power supply is powerful enough for all the system because of missing information about the components.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [
          cpu.name ?? 'CPU',
          gpu?.name ?? 'GPU',
          powerSupply.name ?? 'Power Supply',
        ],
      };
    }

    const cpuConsumption =
      cpu.manufacturer === 'AMD' ? +cpu.tdp * 1.35 : +cpu.tdp * 1.5;
    const gpuConsumption = gpu ? Number(gpu.tdp) : 0;
    const restOfSystemConsumption = 80;

    const totalConsumption =
      cpuConsumption + gpuConsumption + restOfSystemConsumption;

    if (+powerSupply.wattage * 0.75 < totalConsumption) {
      return {
        rule: 'R21_PSU_ENOUGH_ENERGY_FOR_ALL_SYSTEM',
        severity: 'error',
        message: `Total consumption of the system must be less than 75% of the power supply wattage to ensure a stable system. With this selection, the total energy provided to the system must be greater than ${Math.ceil(totalConsumption / 0.75)}W, but it's ${powerSupply.wattage}W.`,
        components: [
          cpu.name ?? 'CPU',
          gpu?.name ?? 'GPU',
          powerSupply.name ?? 'Power Supply',
        ],
      };
    }
    return null;
  }
}
