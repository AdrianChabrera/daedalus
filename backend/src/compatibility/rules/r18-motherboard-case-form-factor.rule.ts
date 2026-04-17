import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../consts/compatibilityMessages';

@Injectable()
export class R18MotherboardCaseFormFactorRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { pcCase, motherboard } = build;
    if (!pcCase || !motherboard) return null;

    if (
      !motherboard.formFactor ||
      pcCase.supportedMotherboardFormFactors.length === 0
    ) {
      return {
        rule: 'R18_MOTHERBOARD_CASE_FORM_FACTOR',
        severity: 'unverifiable',
        message:
          'We are sorry, but we cannot verify if the motherboard form factor is supported by the PC case because one of them has missing information.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [
          motherboard.name ?? 'Motherboard',
          pcCase.name ?? 'PC Case',
        ],
      };
    }

    if (
      !pcCase.supportedMotherboardFormFactors.includes(motherboard.formFactor)
    ) {
      return {
        rule: 'R18_MOTHERBOARD_CASE_FORM_FACTOR',
        severity: 'error',
        message: `Motherboard form factor (${motherboard.formFactor}) is not supported by PC case. Case supported motherboard form factors: (${pcCase.supportedMotherboardFormFactors.join(', ')})`,
        components: [
          motherboard.name ?? 'Motherboard',
          pcCase.name ?? 'PC Case',
        ],
      };
    }
    return null;
  }
}
