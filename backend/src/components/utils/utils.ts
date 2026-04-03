export function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

export function num(v: unknown): number | null {
  let result: number | null = null;

  if (typeof v === 'number' && isFinite(v)) {
    result = v;
  } else if (typeof v === 'string') {
    const n = parseFloat(v);
    result = isFinite(n) ? n : null;
  }

  if (result === null) {
    return null;
  }

  return result < 0 ? 0 : result;
}

export function bool(v: unknown): boolean | null {
  return typeof v === 'boolean' ? v : null;
}

export function arr(v: unknown): string[] | null {
  return Array.isArray(v) && v.length > 0 ? (v as unknown[]).map(String) : null;
}

export function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}
