import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';

@Injectable()
export class W01MultipleRamModelsWarning implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { rams } = build;
    if (!rams || rams.length === 0) return null;

    if (rams.length > 1) {
      return {
        rule: 'W01_MULTIPLE_RAM_MODELS',
        severity: 'warning',
        message:
          'A PC can be built with different RAM models, but it is not recommended as it can cause unexpected behavior.',
        components: [rams.map((br) => br.ram?.name ?? 'RAM').join(', ')],
      };
    }
    return null;
  }
}
