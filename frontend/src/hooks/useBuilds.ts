import { useState, useEffect } from 'react';
import type { PaginatedResult } from '../types/PaginatedResult.type';
import type { BuildSummary, UseBuildsParams } from '../types/BuildLists.type';

export function useBuilds({
  url,
  page,
  pageSize,
  order = 'name-ASC', 
  search,
  authToken,
}: UseBuildsParams) {
  const [result, setResult] = useState<PaginatedResult<BuildSummary> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchBuilds = async () => {
      setLoading(true);
      setError(null);
      try {
        const finalOrder = (order && order !== '-ASC' && !order.startsWith('undefined')) 
          ? order 
          : 'name-ASC';

        const qs = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
          order: finalOrder,
          ...(search.trim() ? { search: search.trim() } : {}),
        });

        const headers: Record<string, string> = {};
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const res = await fetch(`${url}?${qs.toString()}`, { headers });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        
        const data: PaginatedResult<BuildSummary> = await res.json();
        if (!cancelled) setResult(data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Unexpected error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBuilds();
    return () => { cancelled = true; };
  }, [url, page, pageSize, order, search, authToken]);

  return { result, loading, error };
}