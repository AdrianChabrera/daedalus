import { useState, useEffect } from 'react';
import { API_ROUTES } from '../config/api';
import type { PcComponent } from '../types/PcComponents.types';
import type { ActiveSort } from '../types/PcComponents.types';
import type { PaginatedResult } from '../types/PaginatedResult.type';

interface UsePcComponentsParams {
  endpoint: string;
  page: number;
  pageSize: number;
  activeSort: ActiveSort;
  buildOrderParam: (sort: ActiveSort) => string | undefined;
  buildQueryString: () => string;
  debouncedSearch: string;
}

export function usePcComponents({
  endpoint,
  page,
  pageSize,
  activeSort,
  buildOrderParam,
  buildQueryString,
  debouncedSearch,
}: UsePcComponentsParams) {
  const [result, setResult] = useState<PaginatedResult<PcComponent> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchComponents = async () => {
      setLoading(true);
      setError(null);
      try {
        const orderParam = buildOrderParam(activeSort);
        const filterQS = buildQueryString();
        const url =
          API_ROUTES.COMPONENTS(endpoint) +
          `?page=${page}&limit=${pageSize}` +
          (orderParam ? `&order=${orderParam}` : '') +
          filterQS +
          (debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '');

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data: PaginatedResult<PcComponent> = await res.json();
        if (!cancelled) setResult(data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Unexpected error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchComponents();
    return () => {
      cancelled = true;
    };
  }, [endpoint, page, activeSort, buildOrderParam, buildQueryString, debouncedSearch]);

  return { result, loading, error };
}