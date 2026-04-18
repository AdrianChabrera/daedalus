import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../../consts/compatibilityMessages';

@Injectable()
export class R03CpuRamTypeRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { cpu, rams } = build;
    if (!cpu || !rams || rams.length === 0) return null;

    if (
      cpu.supportedMemoryTypes?.length === 0 ||
      cpu.supportedMemoryTypes === null ||
      cpu.supportedMemoryTypes === undefined ||
      rams.some((br) => !br.ram?.memoryType)
    ) {
      return {
        rule: 'R03_CPU_RAM_TYPE',
        severity: 'unverifiable',
        message:
          'We are sorry, but we cannot verify the compatibility between the CPU and the RAM types because one of them has missing type information.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [
          cpu.name ?? 'CPU',
          rams.map((br) => br.ram?.name ?? 'RAM').join(', '),
        ],
      };
    }

    if (
      rams.some((br) => !cpu.supportedMemoryTypes?.includes(br.ram.memoryType!))
    ) {
      return {
        rule: 'R03_CPU_RAM_TYPE',
        severity: 'error',
        message: `One or more RAM types aren't supported by the CPU. CPU supports: (${cpu.supportedMemoryTypes?.join(', ') ?? 'Unknown'}). RAM types included in the build: (${rams.map((br) => br.ram?.memoryType).join(', ')}).`,
        components: [
          cpu.name ?? 'CPU',
          rams.map((br) => br.ram?.name ?? 'RAM').join(', '),
        ],
      };
    }
    return null;
  }
}
