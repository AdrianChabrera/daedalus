import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../../consts/compatibilityMessages';

@Injectable()
export class R22MotherboardSataPortsRule implements CompatibilityRule {
  private detectBottleneck(
    sata15Gbs: number,
    sata6Gbs: number,
    ports6: number,
  ): string | null {
    const issues: string[] = [];

    if (sata15Gbs > 0) {
      issues.push(
        `${sata15Gbs} SATA 1.5 Gb/s drive(s) connected to faster ports`,
      );
    }

    const remaining6Ports = ports6 - sata6Gbs;

    if (remaining6Ports < 0) {
      const spillover6to3 = Math.abs(remaining6Ports);
      issues.push(
        `${spillover6to3} SATA 6 Gb/s drive(s) will work at 3 Gb/s because there aren't enough 6 Gb/s ports available`,
      );
    }

    return issues.length > 0 ? issues.join('. ') + '.' : null;
  }

  check(build: Build): CompatibilityIssueDto | null {
    const { motherboard, storageDrives } = build;
    if (!motherboard || !storageDrives || storageDrives.length === 0)
      return null;

    if (
      motherboard.sata3GbSPorts === null ||
      motherboard.sata3GbSPorts === undefined ||
      motherboard.sata6GbSPorts === null ||
      motherboard.sata6GbSPorts === undefined ||
      storageDrives.some((bs) => !bs.storageDrive.formFactor)
    ) {
      return {
        rule: 'R22_MOTHERBOARD_SATA_PORTS',
        severity: 'unverifiable',
        message:
          'We are sorry, but we cannot verify SATA connectivity because of lack of information.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [
          motherboard.name ?? 'Motherboard',
          storageDrives
            .map((bs) => bs.storageDrive.name ?? 'Storage Drive')
            .join(', '),
        ],
      };
    }

    const sata15Gbs = storageDrives
      .filter((bs) => bs.storageDrive.storageInterface === 'SATA 1.5 Gb/s')
      .map((bs) => bs.quantity)
      .reduce((a, b) => a + b, 0);
    const sata3Gbs = storageDrives
      .filter((bs) => bs.storageDrive.storageInterface === 'SATA 3.0 Gb/s')
      .map((bs) => bs.quantity)
      .reduce((a, b) => a + b, 0);
    const sata6Gbs = storageDrives
      .filter((bs) => bs.storageDrive.storageInterface === 'SATA 6.0 Gb/s')
      .map((bs) => bs.quantity)
      .reduce((a, b) => a + b, 0);

    if (sata15Gbs === 0 && sata3Gbs === 0 && sata6Gbs === 0) return null;

    const sata3GbsPorts = motherboard.sata3GbSPorts;
    const sata6GbsPorts = motherboard.sata6GbSPorts;

    const sataDevicesSum = sata15Gbs + sata3Gbs + sata6Gbs;
    const sataPortsSum = sata3GbsPorts + sata6GbsPorts;

    if (sataDevicesSum > sataPortsSum) {
      return {
        rule: 'R22_MOTHERBOARD_SATA_PORTS',
        severity: 'error',
        message: `The selected motherboard doesn't have enough SATA ports (${sataPortsSum}) for the number of SATA devices selected (${sataDevicesSum}).`,
        components: [
          motherboard.name ?? 'Motherboard',
          storageDrives
            .map((bs) => bs.storageDrive.name ?? 'Storage Drive')
            .join(', '),
        ],
      };
    }

    const bottleneckWarning = this.detectBottleneck(
      sata15Gbs,
      sata6Gbs,
      sata6GbsPorts,
    );

    if (bottleneckWarning) {
      return {
        rule: 'R22_MOTHERBOARD_SATA_PORTS',
        severity: 'warning',
        message: bottleneckWarning,
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
