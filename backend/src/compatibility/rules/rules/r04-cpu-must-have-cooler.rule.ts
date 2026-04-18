import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../../consts/compatibilityMessages';

@Injectable()
export class R04CpuMustHaveCoolerRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { cpu, cpuCooler } = build;
    if (!cpu) return null;

    if (cpu.includesCooler === null || cpu.includesCooler === undefined) {
      if (!cpuCooler) {
        return {
          rule: 'CPU_MUST_HAVE_COOLER',
          severity: 'unverifiable',
          message:
            'We are sorry, but we cannot verify if the CPU includes a cooler because the information is missing.' +
            FEEL_FREE_TO_CONTRIBUTE,
          components: [cpu.name ?? 'CPU'],
        };
      }
    }

    if (!cpu.includesCooler && !cpuCooler) {
      return {
        rule: 'CPU_MUST_HAVE_COOLER',
        severity: 'error',
        message: `CPU doesn't include a cooler, so a compatible CPU cooler must be included in the build.`,
        components: [cpu.name ?? 'CPU'],
      };
    }
    return null;
  }
}
