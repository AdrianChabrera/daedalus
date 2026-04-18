import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { M2Slot } from 'src/components/entities/secondary-entities/m2-slot.entity';
import { StorageDrive } from 'src/components/entities/main-entities/storage.entity';
import {
  comparePcieGen,
  parseDriveInterface,
  parseM2Interface,
  parseM2Sizes,
  parseSlotKey,
} from '../utils/m2SlotsUtils';

function bestCompatibleSlotGen(
  drive: StorageDrive,
  slots: M2Slot[],
): number | null {
  const driveSizes = parseM2Sizes(drive.formFactor);

  let best: number | null = null;

  for (const slot of slots) {
    const slotIface = parseM2Interface(slot.m2Interface);
    if (!slotIface || slotIface.isWifi) continue;

    const slotSizes = parseM2Sizes(slot.size);
    if (driveSizes.length > 0 && slotSizes.length > 0) {
      const sizeOk = driveSizes.some((ds) => slotSizes.includes(ds));
      if (!sizeOk) continue;
    }

    const sKey = parseSlotKey(slot.key);
    if (sKey === 'E') continue;

    if (slotIface.maxPcieGen !== null) {
      if (best === null || slotIface.maxPcieGen > best) {
        best = slotIface.maxPcieGen;
      }
    }
  }

  return best;
}

@Injectable()
export class W04M2PcieGenDowngradeRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { motherboard, storageDrives } = build;
    if (!motherboard || !storageDrives || storageDrives.length === 0)
      return null;

    const availableSlots = motherboard.m2Slots ?? [];
    if (availableSlots.length === 0) return null;

    const downgradedDrives: Array<{
      name: string;
      driveGen: number;
      bestSlotGen: number;
    }> = [];

    for (const bs of storageDrives) {
      const drive = bs.storageDrive;

      const isM2 =
        drive?.formFactor?.toUpperCase().includes('M.2') ||
        drive?.formFactor?.toUpperCase().includes('M2');
      if (!isM2) continue;

      const driveIface = parseDriveInterface(drive.storageInterface);
      if (!driveIface || driveIface.hasSata || driveIface.isWifi) continue;

      const driveGen = driveIface.maxPcieGen;
      if (driveGen === null) continue;

      const bestSlotGen = bestCompatibleSlotGen(drive, availableSlots);
      if (bestSlotGen === null) continue;

      const verdict = comparePcieGen(driveGen, bestSlotGen);
      if (verdict === 'downgraded') {
        downgradedDrives.push({
          name: drive.name ?? 'M.2 Drive',
          driveGen,
          bestSlotGen,
        });
      }
    }

    if (downgradedDrives.length === 0) return null;

    return {
      rule: 'R11_M2_PCIE_GEN_DOWNGRADE',
      severity: 'warning',
      message: `Some NVMe drive(s) will operate at a reduced PCIe generation because all compatible M.2 slots on the motherboard have a lower PCIe version. There are no compatibility issues, but performance will be limited to the slot's maximum speed.`,
      components: [
        motherboard.name ?? 'Motherboard',
        ...downgradedDrives.map((d) => d.name),
      ],
    };
  }
}
