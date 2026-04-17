import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../consts/compatibilityMessages';

@Injectable()
export class R16RamMotherboardMaxMemoryRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { motherboard, rams } = build;
    if (!motherboard || !rams || rams.length === 0) return null;

    if (
      motherboard.maxMemory === null ||
      motherboard.maxMemory === undefined ||
      rams.some((br) => !br.ram?.quantity) ||
      rams.some((br) => !br.ram?.capacity)
    ) {
      return {
        rule: 'R16_RAM_MOTHERBOARD_MAX_MEMORY',
        severity: 'unverifiable',
        message:
          'We are sorry, but we cannot verify the maximum RAM capacity supported by the motherboard because one of the components involved has missing information.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [
          motherboard.name ?? 'Motherboard',
          rams.map((br) => br.ram?.name ?? 'RAM').join(', '),
        ],
      };
    }

    const totalRamCapacity = rams
      .map((br) => br.quantity * (br.ram?.capacity ?? 0))
      .reduce((a, b) => a + b, 0);

    if (totalRamCapacity > motherboard.maxMemory) {
      return {
        rule: 'R16_RAM_MOTHERBOARD_MAX_MEMORY',
        severity: 'error',
        message: `The total RAM capacity assigned to the motherboard: (${totalRamCapacity} GB) exceeds its maximum supported: (${motherboard.maxMemory} GB).`,
        components: [
          motherboard.name ?? 'Motherboard',
          rams.map((br) => br.ram?.name ?? 'RAM').join(', '),
        ],
      };
    }
    return null;
  }
}
