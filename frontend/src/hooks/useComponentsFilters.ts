import { useState, useEffect, useCallback } from 'react';
import { API_ROUTES } from '../config/api';

export type FilterOptionRaw =
  | { type: 'range'; min: number | null; max: number | null }
  | { type: 'multi-string'; values: string[] }
  | { type: 'boolean' };

export type FilterSchema = Record<string, FilterOptionRaw>;

export interface ActiveFilters {
  ranges: Record<string, { min?: number; max?: number }>;
  multiStrings: Record<string, string[]>;
  booleans: Record<string, boolean>;
}

export function useComponentFilters(componentType: string) {
  const [schema, setSchema] = useState<FilterSchema>({});
  const [loadingSchema, setLoadingSchema] = useState(false);

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    ranges: {},
    multiStrings: {},
    booleans: {},
  });

  useEffect(() => {
    let cancelled = false;
    setActiveFilters({ ranges: {}, multiStrings: {}, booleans: {} });
    setSchema({});

    const fetchSchema = async () => {
      setLoadingSchema(true);
      try {
        const res = await fetch(`${API_ROUTES.COMPONENTS(componentType)}/filters`);
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data: FilterSchema = await res.json();
        if (!cancelled) setSchema(data);
      } catch {
        if (!cancelled) setSchema({});
      } finally {
        if (!cancelled) setLoadingSchema(false);
      }
    };

    fetchSchema();
    return () => { cancelled = true; };
  }, [componentType]);

  const buildQueryString = useCallback((): string => {
    const parts: string[] = [];

    for (const [key, { min, max }] of Object.entries(activeFilters.ranges)) {
      const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
      if (min !== undefined) parts.push(`min${capitalized}=${min}`);
      if (max !== undefined) parts.push(`max${capitalized}=${max}`);
    }

    for (const [key, values] of Object.entries(activeFilters.multiStrings)) {
      if (values.length > 0) parts.push(`${key}=${values.map(encodeURIComponent).join('|')}`);
    }

    for (const [key, value] of Object.entries(activeFilters.booleans)) {
      parts.push(`${key}=${value}`);
    }

    return parts.length > 0 ? `&${parts.join('&')}` : '';
  }, [activeFilters]);

  const setRangeFilter = useCallback(
    (key: string, bound: 'min' | 'max', value: number | undefined) => {
      setActiveFilters(prev => {
        const current = prev.ranges[key] ?? {};
        const updated = { ...current, [bound]: value };
        if (value === undefined) delete updated[bound];
        return { ...prev, ranges: { ...prev.ranges, [key]: updated } };
      });
    },
    [],
  );

  const toggleMultiString = useCallback((key: string, value: string) => {
    setActiveFilters(prev => {
      const current = prev.multiStrings[key] ?? [];
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, multiStrings: { ...prev.multiStrings, [key]: next } };
    });
  }, []);

  const setBooleanFilter = useCallback((key: string, value: boolean | undefined) => {
    setActiveFilters(prev => {
      const updated = { ...prev.booleans };
      if (value === undefined) {
        delete updated[key];
      } else {
        updated[key] = value;
      }
      return { ...prev, booleans: updated };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters({ ranges: {}, multiStrings: {}, booleans: {} });
  }, []);

  const hasActiveFilters =
    Object.values(activeFilters.ranges).some(r => r.min !== undefined || r.max !== undefined) ||
    Object.values(activeFilters.multiStrings).some(v => v.length > 0) ||
    Object.keys(activeFilters.booleans).length > 0;

  return {
    schema,
    loadingSchema,
    activeFilters,
    setRangeFilter,
    toggleMultiString,
    setBooleanFilter,
    clearFilters,
    hasActiveFilters,
    buildQueryString,
  };
}