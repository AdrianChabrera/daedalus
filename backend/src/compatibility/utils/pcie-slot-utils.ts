import { PcieSlot } from 'src/components/entities/secondary-entities/pcie-slot.entity';

export interface ParsedPcieInterface {
  gen: number | null;
  lanes: number | null;
}

export function parseGpuInterface(
  raw: string | null | undefined,
): ParsedPcieInterface | null {
  if (!raw) return null;

  const upper = raw.toUpperCase();

  const genMatch = upper.match(/(\d+(?:\.\d+)?)\s*X\d/);
  const genMatchAlt = upper.match(/PCIE\s+(\d+(?:\.\d+)?)/);
  const genRaw = genMatch?.[1] ?? genMatchAlt?.[1] ?? null;
  const gen = genRaw ? Math.floor(parseFloat(genRaw)) : null;

  const lanesMatch = upper.match(/X\s*(\d+)/);
  const lanes = lanesMatch ? parseInt(lanesMatch[1], 10) : null;

  if (gen === null && lanes === null) return null;

  return { gen, lanes };
}

export interface PhysicalPcieSlot {
  gen: number | null;
  lanes: number | null;
}

export function expandPcieSlots(slots: PcieSlot[]): PhysicalPcieSlot[] {
  const expanded: PhysicalPcieSlot[] = [];
  for (const slot of slots) {
    const gen = slot.gen ? Math.floor(parseFloat(slot.gen)) : null;
    const lanes = slot.lanes ?? null;
    const qty = slot.quantity ?? 1;
    for (let i = 0; i < qty; i++) {
      expanded.push({ gen, lanes });
    }
  }
  return expanded;
}

export function gpuFitsInSlot(
  gpu: ParsedPcieInterface,
  slot: PhysicalPcieSlot,
): boolean | null {
  if (gpu.lanes === null || slot.lanes === null) return null;

  return slot.lanes >= gpu.lanes;
}

export function parseNvmePcieInterface(
  raw: string | null | undefined,
): ParsedPcieInterface | null {
  return parseGpuInterface(raw);
}

export function nvmeFitsInSlot(
  drive: ParsedPcieInterface,
  slot: PhysicalPcieSlot,
): boolean | null {
  if (drive.lanes === null || slot.lanes === null) return null;
  return slot.lanes >= drive.lanes;
}

type TriBool = true | false | null;

function tryAugment(
  deviceIdx: number,
  adj: TriBool[][],
  matchSlot: number[],
  visited: boolean[],
): boolean {
  for (let j = 0; j < adj[deviceIdx].length; j++) {
    if (adj[deviceIdx][j] === false) continue;
    if (visited[j]) continue;
    visited[j] = true;

    if (
      matchSlot[j] === -1 ||
      tryAugment(matchSlot[j], adj, matchSlot, visited)
    ) {
      matchSlot[j] = deviceIdx;
      return true;
    }
  }
  return false;
}

export interface MatchingResult {
  matched: number;
  usedUnverifiable: boolean;
  matchSlot: number[];
}

export function maximumMatching(
  adj: TriBool[][],
  numDevices: number,
  numSlots: number,
): MatchingResult {
  const matchSlot = Array<number>(numSlots).fill(-1);
  let matched = 0;
  let usedUnverifiable = false;

  for (let i = 0; i < numDevices; i++) {
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

  return { matched, usedUnverifiable, matchSlot };
}
