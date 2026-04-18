import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../../consts/compatibilityMessages';

@Injectable()
export class R01CpuMotherboardSocketRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { cpu, motherboard } = build;
    if (!cpu || !motherboard) return null;

    if (!cpu.socket || !motherboard.socket) {
      return {
        rule: 'R01_CPU_MOTHERBOARD_SOCKET',
        severity: 'unverifiable',
        message:
          'We are sorry, but we cannot verify the compatibility between the CPU and the motherboard sockets because one of them has missing socket information.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [cpu.name ?? 'CPU', motherboard.name ?? 'Motherboard'],
      };
    }

    if (cpu.socket !== motherboard.socket) {
      return {
        rule: 'R01_CPU_MOTHERBOARD_SOCKET',
        severity: 'error',
        message: `CPU socket (${cpu.socket}) must match motherboard socket (${motherboard.socket})`,
        components: [cpu.name ?? 'CPU', motherboard.name ?? 'Motherboard'],
      };
    }
    return null;
  }
}
