const KNOWN_WIDTHS = [22, 25];

const KNOWN_LENGTHS = [30, 42, 60, 80, 110];

export function parseM2Sizes(raw: string | null | undefined): number[] {
  if (!raw) return [];

  const tokens = raw.split(/[\s/,-]+/).map((t) => t.trim());
  const sizes = new Set<number>();

  for (const token of tokens) {
    const match = token.match(/^(\d{2})(\d{2,3})$/);
    if (!match) continue;

    const width = parseInt(match[1], 10);
    const length = parseInt(match[2], 10);

    if (KNOWN_WIDTHS.includes(width) && KNOWN_LENGTHS.includes(length)) {
      sizes.add(width * 1000 + length);
    }
  }

  return [...sizes];
}

export function encodeM2Size(code: number | string): number {
  const n = typeof code === 'string' ? parseInt(code, 10) : code;
  return n;
}

export type M2Key = 'M' | 'B' | 'E' | 'B+M';

export function parseSlotKey(raw: string | null | undefined): M2Key | null {
  if (!raw) return null;
  const upper = raw.trim().toUpperCase();
  if (upper === 'M') return 'M';
  if (upper === 'B') return 'B';
  if (upper === 'E') return 'E';
  return null;
}

export function keysAreCompatible(
  driveKey: M2Key | null,
  slotKey: M2Key | null,
): boolean | null {
  if (!driveKey || !slotKey) return null;

  if (slotKey === 'E') return false;

  if (driveKey === 'M') return slotKey === 'M';
  if (driveKey === 'B') return slotKey === 'B';
  if (driveKey === 'B+M') return slotKey === 'B' || slotKey === 'M';

  return null;
}

export interface M2Interface {
  hasSata: boolean;
  maxPcieGen: number | null;
  maxPcieLanes: number | null;
  isWifi: boolean;
}

export function parseM2Interface(
  raw: string | null | undefined,
): M2Interface | null {
  if (!raw) return null;

  const upper = raw.toUpperCase();

  if (
    upper.includes('WIFI') ||
    upper.includes('WI-FI') ||
    upper.includes('CNVI') ||
    upper === 'WIFI MODULE' ||
    upper === 'PCIE WIFI MODULE'
  ) {
    return {
      hasSata: false,
      maxPcieGen: null,
      maxPcieLanes: null,
      isWifi: true,
    };
  }

  const hasSata =
    upper.includes('SATA') ||
    upper.includes('SATA3') ||
    upper.includes('SATA 3') ||
    upper.includes('SATA III') ||
    upper.includes('SATA 6');

  const genMatches = [
    ...upper.matchAll(/(?:PCIE|PCI-E|GEN)\s*(\d+(?:\.\d+)?)/g),
  ];

  let maxPcieGen: number | null = null;
  for (const m of genMatches) {
    const gen = parseFloat(m[1]);
    if (isFinite(gen) && gen >= 1 && gen <= 6) {
      const intGen = Math.floor(gen); // 3.0 → 3, 4.0 → 4
      if (maxPcieGen === null || intGen > maxPcieGen) maxPcieGen = intGen;
    }
  }

  if (maxPcieGen === null) {
    const bare = upper.match(/GEN\s*(\d)/);
    if (bare) maxPcieGen = parseInt(bare[1], 10);
  }

  if (upper.includes('UNSPECIFIED')) {
    maxPcieGen = null;
  }

  const laneMatches = [...upper.matchAll(/X\s*(\d+)/g)];
  let maxPcieLanes: number | null = null;
  for (const m of laneMatches) {
    const lanes = parseInt(m[1], 10);
    if ([1, 2, 4, 8, 16].includes(lanes)) {
      if (maxPcieLanes === null || lanes > maxPcieLanes) maxPcieLanes = lanes;
    }
  }

  return { hasSata, maxPcieGen, maxPcieLanes, isWifi: false };
}

export function parseDriveInterface(
  raw: string | null | undefined,
): M2Interface | null {
  return parseM2Interface(raw);
}

export function comparePcieGen(
  driveGen: number | null,
  slotGen: number | null,
): 'compatible' | 'downgraded' | 'unverifiable' {
  if (driveGen === null || slotGen === null) return 'unverifiable';
  return slotGen >= driveGen ? 'compatible' : 'downgraded';
}
