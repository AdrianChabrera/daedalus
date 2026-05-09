import { BadRequestException } from '@nestjs/common';
import { ParsedFilters } from '../interfaces/pc-components.interfaces';
import { COMPONENT_FILTER_SCHEMAS } from './filter-schemas';

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

export function parseFilters(
  queryParams: Record<string, string>,
  schema: (typeof COMPONENT_FILTER_SCHEMAS)[string],
): ParsedFilters {
  const parsed: ParsedFilters = {
    ranges: {},
    multiStrings: {},
    booleans: {},
  };

  for (const [param, rawValue] of Object.entries(queryParams)) {
    const reserverdParams = new Set(['page', 'limit', 'order', 'search']);
    if (reserverdParams.has(param)) continue;

    const rangeMatch = param.match(/^(min|max)(.+)$/);
    if (rangeMatch) {
      const direction = rangeMatch[1] as 'min' | 'max';
      const key =
        rangeMatch[2].charAt(0).toLowerCase() + rangeMatch[2].slice(1);
      const def = schema[key];

      if (!def || def.type !== 'range') {
        throw new BadRequestException(
          `Unknown or non-range filter: "${param}"`,
        );
      }

      const value = parseFloat(rawValue);
      if (isNaN(value)) {
        throw new BadRequestException(
          `Filter "${param}" must be a number, got "${rawValue}"`,
        );
      }

      parsed.ranges[key] = { ...parsed.ranges[key], [direction]: value };
      continue;
    }

    const def = schema[param];
    if (!def) {
      throw new BadRequestException(`Unknown filter: "${param}"`);
    }

    if (def.type === 'multi-string') {
      parsed.multiStrings[param] = rawValue
        .split('|')
        .map((v) => v.trim())
        .filter(Boolean);
      continue;
    }

    if (def.type === 'boolean') {
      if (rawValue !== 'true' && rawValue !== 'false') {
        throw new BadRequestException(
          `Filter "${param}" must be "true" or "false"`,
        );
      }
      parsed.booleans[param] = rawValue === 'true';
      continue;
    }
  }

  return parsed;
}
