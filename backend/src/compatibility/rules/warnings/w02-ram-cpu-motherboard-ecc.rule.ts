import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';

@Injectable()
export class W02RamCpuMotherboardEccRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { cpu, motherboard, rams } = build;
    if (!cpu || !motherboard || !rams || rams.length === 0) return null;

    if (
      rams.every((br) => br.ram?.ecc) &&
      (!cpu.eccSupport || !motherboard.eccSupport)
    ) {
      return {
        rule: 'W02_RAM_CPU_MOTHERBOARD_ECC',
        severity: 'warning',
        message: `The RAM implements ecc, but the CPU or the motherboard don't support it. Be aware that you may experience unexpected behavior with this combination. It is recommended to use components with matching ecc support for optimal performance and stability.`,
        components: [
          cpu.name ?? 'CPU',
          motherboard.name ?? 'Motherboard',
          rams.map((br) => br.ram?.name ?? 'RAM').join(', '),
        ],
      };
    }
    return null;
  }
}
