import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../../consts/compatibilityMessages';

@Injectable()
export class R14RamMotherboardMemoryTypeRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { motherboard, rams } = build;
    if (!motherboard || !rams || rams.length === 0) return null;

    if (
      motherboard.ramType === null ||
      motherboard.ramType === undefined ||
      rams.some((br) => !br.ram?.memoryType)
    ) {
      return {
        rule: 'R14_RAM_MOTHERBOARD_MEMORY_TYPE',
        severity: 'unverifiable',
        message:
          'We are sorry, but we cannot verify the compatibility between the RAM and the motherboard memory type because one of them has missing information.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [
          motherboard.name ?? 'Motherboard',
          rams.map((br) => br.ram?.name ?? 'RAM').join(', '),
        ],
      };
    }

    if (rams.some((br) => br.ram.memoryType !== motherboard.ramType)) {
      return {
        rule: 'R14_RAM_MOTHERBOARD_MEMORY_TYPE',
        severity: 'error',
        message: `One or more RAM types aren't supported by the motherboard. Motherboard supports: (${motherboard.ramType ?? 'Unknown'}). RAM types included in the build: (${rams.map((br) => br.ram?.memoryType).join(', ')}).`,
        components: [
          motherboard.name ?? 'Motherboard',
          rams.map((br) => br.ram?.name ?? 'RAM').join(', '),
        ],
      };
    }
    return null;
  }
}
