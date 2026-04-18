import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../consts/compatibilityMessages';

@Injectable()
export class R23MotherbardU2PortsRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { motherboard, storageDrives } = build;
    if (!motherboard || !storageDrives || storageDrives.length === 0)
      return null;

    if (
      motherboard.u2Ports === null ||
      motherboard.u2Ports === undefined ||
      storageDrives.some((bs) => !bs.storageDrive.storageInterface)
    ) {
      return {
        rule: 'R23_MOTHERBOARD_U2_PORTS',
        severity: 'unverifiable',
        message:
          'We are sorry, but we cannot verify U.2 connectivity because of lack of information.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [
          motherboard.name ?? 'Motherboard',
          storageDrives
            .map((bs) => bs.storageDrive.name ?? 'Storage Drive')
            .join(', '),
        ],
      };
    }

    const u2 = storageDrives
      .filter((bs) => bs.storageDrive.storageInterface === 'U.2')
      .map((bs) => bs.quantity)
      .reduce((a, b) => a + b, 0);

    if (u2 === 0) return null;

    const motherboardU2Ports = motherboard.u2Ports;

    if (motherboardU2Ports < u2) {
      return {
        rule: 'R23_MOTHERBOARD_U2_PORTS',
        severity: 'error',
        message: `Not enough U.2 ports in the motherboard (${motherboardU2Ports}) for the selected U.2 storage drives (${u2})`,
        components: [
          motherboard.name ?? 'Motherboard',
          storageDrives
            .map((bs) => bs.storageDrive.name ?? 'Storage Drive')
            .join(', '),
        ],
      };
    }
    return null;
  }
}
