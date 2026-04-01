export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface FilterDefinition {
  field: string;
  type: FilterType;
}

export type FilterType = 'range' | 'multi-string' | 'boolean';

export interface ParsedFilters {
  ranges: Record<string, { min?: number; max?: number }>;
  multiStrings: Record<string, string[]>;
  booleans: Record<string, boolean>;
}

export type FilterOptions =
  | { type: 'range'; min: number | null; max: number | null }
  | { type: 'multi-string'; values: string[] }
  | { type: 'boolean' };
