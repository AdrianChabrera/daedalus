import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../consts/compatibilityMessages';

@Injectable()
export class R15RamQuantityLimitRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { motherboard, rams } = build;
    if (!motherboard || !rams || rams.length === 0) return null;

    if (
      motherboard.memorySlots === null ||
      motherboard.memorySlots === undefined ||
      rams.some((br) => !br.ram?.quantity)
    ) {
      return {
        rule: 'R15_RAM_QUANTITY_LIMIT',
        severity: 'unverifiable',
        message:
          'We are sorry, but we cannot verify how many RAM modules can be installed in the motherboard because one of them has missing information.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [
          motherboard.name ?? 'Motherboard',
          rams.map((br) => br.ram?.name ?? 'RAM').join(', '),
        ],
      };
    }

    const totalRamModules = rams
      .map((br) => br.quantity * (br.ram?.quantity ?? 0))
      .reduce((a, b) => a + b, 0);

    if (totalRamModules > motherboard.memorySlots) {
      return {
        rule: 'R15_RAM_QUANTITY_LIMIT',
        severity: 'error',
        message: `The number of RAM modules assigned to the motherboard: (${totalRamModules}) exceeds its maximum supported: (${motherboard.memorySlots}).`,
        components: [
          motherboard.name ?? 'Motherboard',
          rams.map((br) => br.ram?.name ?? 'RAM').join(', '),
        ],
      };
    }
    return null;
  }
}
