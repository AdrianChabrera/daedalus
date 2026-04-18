import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../../consts/compatibilityMessages';

@Injectable()
export class R20RadiatorFitsInCaseRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { cpuCooler, pcCase } = build;
    if (!cpuCooler || !pcCase) return null;

    if (!cpuCooler.waterCooled) return null;

    if (
      !cpuCooler.radiatorSize ||
      !pcCase.height ||
      !pcCase.width ||
      !pcCase.depth ||
      cpuCooler.waterCooled === null ||
      cpuCooler.waterCooled === undefined
    ) {
      return {
        rule: 'R20_RADIATOR_FITS_IN_CASE',
        severity: 'unverifiable',
        message:
          "We are sorry, but we cannot verify if the CPU cooler's radiator fits in the case because one of them has missing information." +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [cpuCooler.name ?? 'CPU Cooler', pcCase.name ?? 'PC Case'],
      };
    }

    const radiatorSize = Number(cpuCooler.radiatorSize) + 35;
    const caseHeight = Number(pcCase.height);
    const caseWidth = Number(pcCase.width);
    const caseDepth = Number(pcCase.depth);

    const usualPowerSupplyShroudHeight = 80;
    const usualFrontAndRearPanelDepth = 60;
    const minimalWidthForFansNotToInterfereWithRam = 210;

    const fitsFront = radiatorSize <= caseHeight - usualPowerSupplyShroudHeight;
    const fitsTop =
      radiatorSize <= caseDepth - usualFrontAndRearPanelDepth &&
      caseWidth >= minimalWidthForFansNotToInterfereWithRam;

    if (!(fitsFront || fitsTop) && cpuCooler.waterCooled === true) {
      return {
        rule: 'R20_RADIATOR_FITS_IN_CASE',
        severity: 'warning',
        message: `CPU Cooler radiator (${cpuCooler.radiatorSize} mm) may not fit in the front or top of the case. Be aware, though, that we made this calculation based on the case and cooler dimensions, so it's highly recommended to double check radiator compatibility with the manufacturer official specifications.`,
        components: [cpuCooler.name ?? 'CPU Cooler', pcCase.name ?? 'PC Case'],
      };
    }
    return null;
  }
}
