import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';

@Injectable()
export class W03IncludedPowerSupplyWarning implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { pcCase, powerSupply } = build;
    if (!pcCase) return null;

    if (
      pcCase.powerSupply !== 'None' &&
      pcCase.powerSupply !== null &&
      !powerSupply
    ) {
      return {
        rule: 'W03_INCLUDED_POWER_SUPPLY',
        severity: 'warning',
        message:
          "The selected PC includes a power supply so it won't be necessary to include one in the build. However, be aware that Daedalus isn't able to verify all power-related compatibilty rules because integrated power supplies lack of necessary information. To be sure that the power supply is adequate for your system, we recommend using a independent power supply.",
        components: [pcCase.name ?? 'PC Case'],
      };
    }
    return null;
  }
}
