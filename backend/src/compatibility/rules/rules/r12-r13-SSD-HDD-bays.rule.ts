import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../../consts/compatibilityMessages';

@Injectable()
export class R12R13DrivesBaysRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { pcCase, storageDrives } = build;
    if (!pcCase || !storageDrives || storageDrives.length === 0) return null;

    if (
      pcCase.internal25bays === null ||
      pcCase.internal25bays === undefined ||
      pcCase.internal35bays === null ||
      pcCase.internal35bays === undefined ||
      storageDrives.some((bs) => !bs.storageDrive.formFactor)
    ) {
      return {
        rule: 'R12_R13_DRIVES_BAYS',
        severity: 'unverifiable',
        message:
          'We are sorry, but we cannot verify if the selected storage drives fit in the case because one of them has missing information.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [
          pcCase.name ?? 'PC Case',
          [
            ...new Set(
              storageDrives.map(
                (bs) => bs.storageDrive.name ?? 'Storage Drive',
              ),
            ),
          ].join(', '),
        ],
      };
    }

    const sd25 = storageDrives
      .filter((bs) => bs.storageDrive.formFactor === '2.5"')
      .map((bs) => bs.quantity)
      .reduce((a, b) => a + b, 0);
    const sd35 = storageDrives
      .filter((bs) => bs.storageDrive.formFactor === '3.5"')
      .map((bs) => bs.quantity)
      .reduce((a, b) => a + b, 0);

    if (sd25 === 0 && sd35 === 0) return null;

    let bays35 = pcCase.internal35bays ?? 0;

    bays35 -= sd35;
    if (bays35 < 0) {
      return {
        rule: 'R12_R13_DRIVES_BAYS',
        severity: 'error',
        message: `Not enough 3.5" bays in the case for the selected storage drives. Selected case has (${pcCase.internal35bays}) 3.5" bays, but (${sd35}) 3.5" storage drives were selected.`,
        components: [
          pcCase.name ?? 'PC Case',
          [
            ...new Set(
              storageDrives.map(
                (bs) => bs.storageDrive.name ?? 'Storage Drive',
              ),
            ),
          ].join(', '),
        ],
      };
    }

    let bays25And35 = bays35 + (pcCase.internal25bays ?? 0);
    bays25And35 -= sd25;
    if (bays25And35 < 0) {
      return {
        rule: 'R12_R13_DRIVES_BAYS',
        severity: 'error',
        message: `Not enough bays for 2.5" drives. After fitting (${sd35}) HDDs in 3.5" bays, only (${bays25And35 + sd25}) bays remain for 2.5" drives, but (${sd25}) were selected.`,
        components: [
          pcCase.name ?? 'PC Case',
          [
            ...new Set(
              storageDrives.map(
                (bs) => bs.storageDrive.name ?? 'Storage Drive',
              ),
            ),
          ].join(', '),
        ],
      };
    }
    return null;
  }
}
