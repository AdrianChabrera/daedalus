import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../../consts/compatibilityMessages';
import {
  isM2Drive,
  isWifiSlot,
  getStorageSlots,
  parseM2Sizes,
  parseSlotKey,
  parseDriveInterface,
  M2Key,
} from '../../utils/m2-slot-utils';
import { M2Slot } from 'src/components/entities/secondary-entities/m2-slot.entity';
import { StorageDrive } from 'src/components/entities/main-entities/storage.entity';

function driveKey(drive: StorageDrive): M2Key | null {
  const iface = parseDriveInterface(drive.storageInterface);
  if (!iface || iface.isWifi) return null;
  if (iface.maxPcieGen !== null && !iface.hasSata) return 'M';
  if (iface.hasSata) return 'B+M';
  return null;
}

function driveSlotCompatible(
  drive: StorageDrive,
  slot: M2Slot,
): boolean | null {
  if (isWifiSlot(slot)) return false;

  const driveSizes = parseM2Sizes(drive.formFactor);
  const slotSizes = parseM2Sizes(slot.size);

  let sizeOk: boolean | null;
  if (driveSizes.length === 0 || slotSizes.length === 0) {
    sizeOk = null;
  } else {
    sizeOk = driveSizes.some((ds) => slotSizes.includes(ds));
  }

  if (sizeOk === false) return false;

  const dKey = driveKey(drive);
  const sKey = parseSlotKey(slot.key);

  let keyOk: boolean | null;
  if (!dKey || !sKey) {
    keyOk = null;
  } else if (sKey === 'E') {
    keyOk = false;
  } else if (dKey === 'M') {
    keyOk = sKey === 'M';
  } else if (dKey === 'B') {
    keyOk = sKey === 'B';
  } else {
    keyOk = sKey === 'B' || sKey === 'M';
  }

  if (keyOk === false) return false;
  if (sizeOk === null || keyOk === null) return null;

  return true;
}

type TriBool = true | false | null;

function buildAdjacency(drives: StorageDrive[], slots: M2Slot[]): TriBool[][] {
  return drives.map((drive) =>
    slots.map((slot) => driveSlotCompatible(drive, slot)),
  );
}

function tryAugment(
  driveIdx: number,
  adj: TriBool[][],
  matchSlot: number[],
  visited: boolean[],
): boolean {
  for (let j = 0; j < adj[driveIdx].length; j++) {
    if (adj[driveIdx][j] === false) continue;
    if (visited[j]) continue;
    visited[j] = true;

    if (
      matchSlot[j] === -1 ||
      tryAugment(matchSlot[j], adj, matchSlot, visited)
    ) {
      matchSlot[j] = driveIdx;
      return true;
    }
  }
  return false;
}

interface MatchingResult {
  matched: number;
  usedUnverifiable: boolean;
}

function maximumMatching(adj: TriBool[][], numSlots: number): MatchingResult {
  const matchSlot = Array<number>(numSlots).fill(-1);
  let matched = 0;
  let usedUnverifiable = false;

  for (let i = 0; i < adj.length; i++) {
    const visited = Array<boolean>(numSlots).fill(false);
    if (tryAugment(i, adj, matchSlot, visited)) {
      matched++;
    }
  }

  for (let j = 0; j < numSlots; j++) {
    const i = matchSlot[j];
    if (i !== -1 && adj[i][j] === null) {
      usedUnverifiable = true;
    }
  }

  return { matched, usedUnverifiable };
}

@Injectable()
export class R09R10M2SlotAssignmentRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { motherboard, storageDrives } = build;
    if (!motherboard || !storageDrives || storageDrives.length === 0)
      return null;

    const m2Drives = storageDrives.flatMap((bs) => {
      if (!isM2Drive(bs.storageDrive)) return [];
      return Array<StorageDrive>(bs.quantity).fill(bs.storageDrive);
    });

    if (m2Drives.length === 0) return null;

    const slots = getStorageSlots(motherboard.m2Slots ?? []);

    const driveNames = [...new Set(m2Drives.map((d) => d.name ?? 'M.2 Drive'))];
    const components = [motherboard.name ?? 'Motherboard', ...driveNames];

    if (slots.length === 0) {
      return {
        rule: 'R09_R10_M2_SLOT_ASSIGNMENT',
        severity: 'error',
        message: `The build includes ${m2Drives.length} M.2 storage drive(s), but the selected motherboard has no M.2 slots available for storage.`,
        components,
      };
    }

    const adj = buildAdjacency(m2Drives, slots);
    const { matched, usedUnverifiable } = maximumMatching(adj, slots.length);

    if (matched < m2Drives.length) {
      const unmatched = m2Drives.length - matched;
      return {
        rule: 'R09_R10_M2_SLOT_ASSIGNMENT',
        severity: 'error',
        message:
          `${unmatched} of the ${m2Drives.length} M.2 drive(s) in this build cannot be assigned to a compatible slot on the motherboard. ` +
          `Check that the motherboard has enough M.2 slots and that their size and key are compatible with the selected drives.`,
        components,
      };
    }

    if (usedUnverifiable) {
      return {
        rule: 'R09_R10_M2_SLOT_ASSIGNMENT',
        severity: 'unverifiable',
        message:
          'We cannot fully verify M.2 slot compatibility because some slots or drives have missing size, key, or interface information.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components,
      };
    }

    return null;
  }
}
