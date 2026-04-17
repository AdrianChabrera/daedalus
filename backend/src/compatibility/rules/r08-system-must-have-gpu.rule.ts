import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../consts/compatibilityMessages';

@Injectable()
export class R08SystemMustHaveGpuRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { gpu, cpu } = build;
    if (!cpu) return null;

    if (
      cpu.integratedGraphics === null ||
      cpu?.integratedGraphics === undefined
    ) {
      if (!gpu) {
        return {
          rule: 'SYSTEM_MUST_HAVE_GPU',
          severity: 'unverifiable',
          message:
            'We are sorry, but we cannot verify if the CPU has integrated graphics because the information is missing.' +
            FEEL_FREE_TO_CONTRIBUTE,
          components: [cpu.name ?? 'CPU'],
        };
      }
    }

    if (cpu.integratedGraphics === 'None' && !gpu) {
      return {
        rule: 'SYSTEM_MUST_HAVE_GPU',
        severity: 'error',
        message: `CPU doesn't have integrated graphics, so a compatible GPU must be included in the build.`,
        components: [cpu.name ?? 'CPU'],
      };
    }
    return null;
  }
}
