import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../../consts/compatibilityMessages';
import {
  parseGpuInterface,
  parseNvmePcieInterface,
  expandPcieSlots,
  gpuFitsInSlot,
  nvmeFitsInSlot,
  maximumMatching,
  PhysicalPcieSlot,
  ParsedPcieInterface,
} from '../../utils/pcieSlotsUtils';
import { StorageDrive } from 'src/components/entities/main-entities/storage.entity';
import { isM2Drive } from '../../utils/m2SlotsUtils';

function needsFullSizePcieSlot(drive: StorageDrive): boolean {
  if (!drive.storageInterface) return false;
  const iface = drive.storageInterface.toUpperCase();

  const isPcie = iface.includes('PCIE') || iface.includes('PCI-E');
  if (!isPcie) return false;

  if (isM2Drive(drive)) return false;

  return true;
}

type TriBool = true | false | null;

@Injectable()
export class R07R11PcieSlotAssignmentRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { motherboard, gpu, storageDrives } = build;

    if (!motherboard) return null;

    const hasGpu = !!gpu;
    const pcieStorageEntries = (storageDrives ?? []).filter((bs) =>
      needsFullSizePcieSlot(bs.storageDrive),
    );
    const hasPcieStorage = pcieStorageEntries.length > 0;

    if (!hasGpu && !hasPcieStorage) return null;

    const physicalSlots: PhysicalPcieSlot[] = expandPcieSlots(
      motherboard.pcieSlots ?? [],
    );

    if (physicalSlots.length === 0) {
      const affectedComponents: string[] = [
        motherboard.name ?? 'Motherboard',
        ...(hasGpu ? [gpu.name ?? 'GPU'] : []),
        ...pcieStorageEntries.map(
          (bs) => bs.storageDrive.name ?? 'Storage Drive',
        ),
      ];
      return {
        rule: 'R07_R11_PCIE_SLOT_ASSIGNMENT',
        severity: 'unverifiable',
        message:
          'We are sorry, but we cannot verify PCIe slot compatibility because the motherboard has no PCIe slot information.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: affectedComponents,
      };
    }

    let gpuIface: ParsedPcieInterface | null = null;
    if (hasGpu) {
      gpuIface = parseGpuInterface(gpu.gpuInterface);
      if (!gpuIface && gpu.gpuInterface) {
        return {
          rule: 'R07_R11_PCIE_SLOT_ASSIGNMENT',
          severity: 'unverifiable',
          message:
            'We are sorry, but we cannot verify GPU PCIe slot compatibility because the GPU interface information is missing or unrecognized.' +
            FEEL_FREE_TO_CONTRIBUTE,
          components: [motherboard.name ?? 'Motherboard', gpu.name ?? 'GPU'],
        };
      }
    }

    interface NvmeDevice {
      name: string;
      iface: ParsedPcieInterface | null;
    }

    const nvmeDevices: NvmeDevice[] = pcieStorageEntries.flatMap((bs) => {
      const iface = parseNvmePcieInterface(bs.storageDrive.storageInterface);
      return Array.from({ length: bs.quantity }, () => ({
        name: bs.storageDrive.name ?? 'Storage Drive',
        iface,
      }));
    });

    type Consumer =
      | { kind: 'gpu'; iface: ParsedPcieInterface | null; name: string }
      | { kind: 'nvme'; iface: ParsedPcieInterface | null; name: string };

    const consumers: Consumer[] = [
      ...(hasGpu && gpuIface
        ? [{ kind: 'gpu' as const, iface: gpuIface, name: gpu.name ?? 'GPU' }]
        : []),
      ...nvmeDevices.map((d) => ({
        kind: 'nvme' as const,
        iface: d.iface,
        name: d.name,
      })),
    ];

    if (consumers.length === 0) return null;

    const adj: TriBool[][] = consumers.map((consumer) => {
      return physicalSlots.map((slot): TriBool => {
        if (!consumer.iface) return null;

        if (consumer.kind === 'gpu') {
          return gpuFitsInSlot(consumer.iface, slot);
        } else {
          return nvmeFitsInSlot(consumer.iface, slot);
        }
      });
    });

    const { matched, usedUnverifiable } = maximumMatching(
      adj,
      consumers.length,
      physicalSlots.length,
    );

    const affectedComponents = [
      motherboard.name ?? 'Motherboard',
      ...[...new Set(consumers.map((c) => c.name))],
    ];

    if (matched < consumers.length) {
      const unmatched = consumers.length - matched;

      const unmatchedGpu =
        hasGpu && gpuIface
          ? consumers.findIndex((c) => c.kind === 'gpu') !== -1 &&
            !isGpuMatched(adj, consumers, physicalSlots.length)
          : false;

      if (unmatchedGpu && unmatched === 1) {
        return {
          rule: 'R07_PCIE_GPU_SLOT',
          severity: 'error',
          message:
            `The GPU requires a PCIe slot with at least ${gpuIface!.lanes ?? '?'} physical lanes (x${gpuIface!.lanes ?? '?'}), ` +
            `but the motherboard has no compatible slot available. ` +
            `Make sure the motherboard has a PCIe x${gpuIface!.lanes ?? '?'} (or larger) slot.`,
          components: affectedComponents,
        };
      }

      return {
        rule: 'R07_R11_PCIE_SLOT_ASSIGNMENT',
        severity: 'error',
        message:
          `${unmatched} PCIe device(s) in this build cannot be assigned to a compatible slot on the motherboard. ` +
          `Check that the motherboard has enough PCIe slots with sufficient lanes for the GPU and all PCIe storage drives.`,
        components: affectedComponents,
      };
    }

    if (usedUnverifiable) {
      return {
        rule: 'R07_R11_PCIE_SLOT_ASSIGNMENT',
        severity: 'unverifiable',
        message:
          'We cannot fully verify PCIe slot compatibility because some slots or devices have missing lane or generation information.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: affectedComponents,
      };
    }

    return null;
  }
}

function isGpuMatched(
  adj: TriBool[][],
  consumers: Array<{ kind: string }>,
  numSlots: number,
): boolean {
  const gpuIdx = consumers.findIndex((c) => c.kind === 'gpu');
  if (gpuIdx === -1) return true;

  const gpuAdj = [adj[gpuIdx]];
  const { matched } = maximumMatching(gpuAdj, 1, numSlots);
  return matched === 1;
}
