import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../../consts/compatibilityMessages';

@Injectable()
export class R24R25SATAConnectorsRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { powerSupply, storageDrives, cpuCooler } = build;
    if (!powerSupply) return null;

    if (
      storageDrives.some((bs) => !bs.storageDrive.storageInterface) ||
      (cpuCooler && cpuCooler.waterCooled === null) ||
      (cpuCooler && cpuCooler.waterCooled === undefined)
    ) {
      return {
        rule: 'R24_R25_SATA_POWER_CONNECTORS',
        severity: 'unverifiable',
        message:
          'We are sorry, but we cannot verify if your storage drives or cpu cooler need a power connector from the power supply because of lack of information.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [
          powerSupply.name ?? 'Power Supply',
          ...(cpuCooler?.waterCooled ? [cpuCooler.name ?? 'Cpu Cooler'] : []),
          storageDrives
            .map((bs) => bs.storageDrive?.name ?? 'Storage drive')
            .join(', '),
        ],
      };
    }

    const sataStorageDrives = storageDrives.filter(
      (bs) =>
        bs.storageDrive.storageInterface?.includes('SATA') &&
        bs.storageDrive.storageInterface?.includes('Gb/s'),
    );

    if (powerSupply.sata === null || powerSupply.sata === undefined) {
      return {
        rule: 'R24_R25_SATA_POWER_CONNECTORS',
        severity: 'unverifiable',
        message:
          'We are sorry, but we cannot verify if the power supply has enough connectors for your SATA devices because of lack of information.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [
          powerSupply.name ?? 'Power Supply',
          ...(cpuCooler?.waterCooled ? [cpuCooler.name ?? 'Cpu Cooler'] : []),
          sataStorageDrives
            .map((bs) => bs.storageDrive?.name ?? 'Storage drive')
            .join(', '),
        ],
      };
    }

    const sataStorageDrivesCount = sataStorageDrives
      .map((bs) => bs.quantity)
      .reduce((a, b) => a + b, 0);
    const sataDemand =
      sataStorageDrivesCount + (cpuCooler && cpuCooler.waterCooled ? 1 : 0);
    const sataOffer = powerSupply.sata;

    if (sataDemand > sataOffer) {
      return {
        rule: 'R24_R25_SATA_POWER_CONNECTORS',
        severity: 'error',
        message:
          `Your system needs (${sataDemand}) SATA power connectors, but your power supply only offers (${sataOffer})` +
          (cpuCooler?.waterCooled
            ? ', your system has a water cooled cpu cooler, remember that this type of coolers also need a SATA power connector.'
            : '.'),
        components: [
          powerSupply.name ?? 'Power Supply',
          ...(cpuCooler?.waterCooled ? [cpuCooler.name ?? 'Cpu Cooler'] : []),
          sataStorageDrives
            .map((bs) => bs.storageDrive?.name ?? 'Storage drive')
            .join(', '),
        ],
      };
    }
    return null;
  }
}
