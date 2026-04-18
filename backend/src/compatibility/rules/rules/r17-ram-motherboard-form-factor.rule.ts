import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../../consts/compatibilityMessages';

@Injectable()
export class R17RamMotherboardFormFactorRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { rams, motherboard } = build;
    if (!rams || rams.length === 0 || !motherboard) return null;

    if (rams.some((br) => !br.ram?.formFactor) || !motherboard.formFactor) {
      return {
        rule: 'R17_RAM_MOTHERBOARD_FORM_FACTOR',
        severity: 'unverifiable',
        message:
          'We are sorry, but we cannot verify the compatibility between the RAM and the motherboard form factor because one of them has missing information.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [
          rams.map((br) => br.ram?.name ?? 'RAM').join(', '),
          motherboard.name ?? 'Motherboard',
        ],
      };
    }

    const ramFormFactors = rams.map((br) =>
      br.ram?.formFactor?.includes('SO-DIMM') ? 'SO-DIMM' : 'DIMM',
    );

    if (!ramFormFactors.every((rf) => rf === ramFormFactors[0])) {
      return {
        rule: 'R17_RAM_MOTHERBOARD_FORM_FACTOR',
        severity: 'error',
        message: `You are combining DIMM RAMSs with SO-DIMM RAMs. There isn't any motherboard that supports both form factor at the same time.`,
        components: [
          rams.map((br) => br.ram?.name ?? 'RAM').join(', '),
          motherboard.name ?? 'Motherboard',
        ],
      };
    }

    if (motherboard.formFactor === 'Mini-ITX') {
      return {
        rule: 'R17_RAM_MOTHERBOARD_FORM_FACTOR',
        severity: 'warning',
        message: `Some Mini-ITX motherboards support DIMM RAMs, and some others support SO-DIMM RAMs, to ensure compatibility, please check this exact model specifications at its official website.`,
        components: [
          rams.map((br) => br.ram?.name ?? 'RAM').join(', '),
          motherboard.name ?? 'Motherboard',
        ],
      };
    }

    if (
      (motherboard.formFactor === 'Thin Mini-ITX' &&
        ramFormFactors[0] === 'DIMM') ||
      (motherboard.formFactor !== 'Thin Mini-ITX' &&
        ramFormFactors[0] === 'SO-DIMM')
    ) {
      return {
        rule: 'R17_RAM_MOTHERBOARD_FORM_FACTOR',
        severity: 'error',
        message: `SO-DIMM RAMs can only be assigned to Thin Mini-ITX motherboards, and DIMM RAMs can be assigned to every other motherboard form factor except Thin Mini-ITX.`,
        components: [
          rams.map((br) => br.ram?.name ?? 'RAM').join(', '),
          motherboard.name ?? 'Motherboard',
        ],
      };
    }

    return null;
  }
}
