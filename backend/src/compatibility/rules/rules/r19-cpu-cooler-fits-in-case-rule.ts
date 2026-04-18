import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../../consts/compatibilityMessages';

@Injectable()
export class R19CpuCoolerFitsInCaseRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { cpuCooler, pcCase } = build;
    if (!cpuCooler || !pcCase) return null;

    if (cpuCooler.waterCooled) return null;

    if (
      !cpuCooler.height ||
      !pcCase.maxCpuCoolerHeight ||
      cpuCooler.waterCooled === null ||
      cpuCooler.waterCooled === undefined
    ) {
      return {
        rule: 'R19_CPU_COOLER_FITS_IN_CASE',
        severity: 'unverifiable',
        message:
          'We are sorry, but we cannot verify if the CPU cooler fits in the case because one of them has missing information.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [cpuCooler.name ?? 'CPU Cooler', pcCase.name ?? 'PC Case'],
      };
    }

    const height = cpuCooler.height ? Number(cpuCooler.height) : 0;
    const maxHeight = pcCase.maxCpuCoolerHeight
      ? Number(pcCase.maxCpuCoolerHeight)
      : 0;

    if (height > maxHeight && cpuCooler.waterCooled === false) {
      return {
        rule: 'R19_CPU_COOLER_FITS_IN_CASE',
        severity: 'error',
        message: `CPU Cooler height (${cpuCooler.height} mm) exceeds the maximum CPU Cooler height (${pcCase.maxCpuCoolerHeight} mm) for the case.`,
        components: [cpuCooler.name ?? 'CPU Cooler', pcCase.name ?? 'PC Case'],
      };
    }
    return null;
  }
}
