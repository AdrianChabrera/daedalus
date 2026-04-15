import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../consts/compatibilityMessages.dto';

@Injectable()
export class R06GpuFitsInCaseRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { gpu, pcCase } = build;
    if (!gpu || !pcCase) return null;

    if (!gpu.length || !pcCase.maxVideoCardLength) {
      return {
        rule: 'R06_GPU_FITS_IN_CASE',
        severity: 'unverifiable',
        message:
          'We are sorry, but we cannot verify if the GPU fits in the case because one of them has missing length information.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [gpu.name ?? 'GPU', pcCase.name ?? 'PC Case'],
      };
    }

    if (gpu.length > pcCase.maxVideoCardLength) {
      return {
        rule: 'R06_GPU_FITS_IN_CASE',
        severity: 'error',
        message: `GPU length (${gpu.length} mm) exceeds the maximum video card length (${pcCase.maxVideoCardLength} mm) for the case.`,
        components: [gpu.name ?? 'GPU', pcCase.name ?? 'PC Case'],
      };
    }
    return null;
  }
}
