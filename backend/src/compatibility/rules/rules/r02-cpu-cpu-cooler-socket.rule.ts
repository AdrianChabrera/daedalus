import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../../consts/compatibilityMessages';

@Injectable()
export class R02CpuCpuCoolerSocketRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { cpu, cpuCooler } = build;
    if (!cpu || !cpuCooler) return null;

    if (!cpu.socket || cpuCooler.supportedSockets.length === 0) {
      return {
        rule: 'R02_CPU_CPU_COOLER_SOCKET',
        severity: 'unverifiable',
        message:
          'We are sorry, but we cannot verify if the CPU socket is supported by the CPU cooler because one of them has missing socket information.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [cpu.name ?? 'CPU', cpuCooler.name ?? 'CPU Cooler'],
      };
    }

    if (!cpuCooler.supportedSockets.includes(cpu.socket)) {
      return {
        rule: 'R02_CPU_CPU_COOLER_SOCKET',
        severity: 'error',
        message: `CPU socket (${cpu.socket}) must be supported by CPU cooler (${cpuCooler.supportedSockets.join(', ')})`,
        components: [cpu.name ?? 'CPU', cpuCooler.name ?? 'CPU Cooler'],
      };
    }
    return null;
  }
}
