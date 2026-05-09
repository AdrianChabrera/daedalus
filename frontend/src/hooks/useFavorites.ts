import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { PcComponent, UseFavComponentsParams } from '../types/PcComponents.types';
import type { PaginatedResult } from '../types/PaginatedResult.type';
import { API_ROUTES } from '../config/api';

export function useComponentFavorite(componentType: string, componentId: string) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !componentId || !componentType) return;
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(
          API_ROUTES.LIST_FAVORITE_COMPONENTS(componentType),
          { headers: { Authorization: `Bearer ${user.accessToken}` } },
        );
        if (!res.ok || cancelled) return;
        const data: { data: Array<{ buildcoresId: string }> } = await res.json();
        if (!cancelled) {
          setIsFavorite(data.data.some((c) => c.buildcoresId === componentId));
        }
      } catch {
        // ignore
      }
    };

    check();
    return () => { cancelled = true; };
  }, [user, componentId, componentType]);

  const toggle = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (isFavorite) {
        const res = await fetch(API_ROUTES.UNMARK_COMPONENT_AS_FAVORITE(componentId), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${user.accessToken}` },
        });
        if (res.ok) setIsFavorite(false);
      } else {
        const res = await fetch(
          API_ROUTES.MARK_COMPONENT_AS_FAVORITE(componentType, componentId),
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${user.accessToken}` },
          },
        );
        if (res.ok) setIsFavorite(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user, isFavorite, componentId, componentType]);

  return { isFavorite, loading, toggle };
}

export function useBuildFavorite(buildId: number) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !buildId) return;
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(API_ROUTES.LIST_FAVORITE_BUILDS, {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        });
        if (!res.ok || cancelled) return;
        const data: { data: Array<{ id: number }> } = await res.json();
        if (!cancelled) {
          setIsFavorite(data.data.some((b) => b.id === buildId));
        }
      } catch {
        // ignore
      }
    };

    check();
    return () => { cancelled = true; };
  }, [user, buildId]);

  const toggle = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (isFavorite) {
        const res = await fetch(API_ROUTES.MARK_AND_UNMARK_BUILD_AS_FAVORITE(buildId), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${user.accessToken}` },
        });
        if (res.ok) setIsFavorite(false);
      } else {
        const res = await fetch(API_ROUTES.MARK_AND_UNMARK_BUILD_AS_FAVORITE(buildId), {
          method: 'POST',
          headers: { Authorization: `Bearer ${user.accessToken}` },
        });
        if (res.ok) setIsFavorite(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user, isFavorite, buildId]);

  return { isFavorite, loading, toggle };
}

export function useFavoriteComponents({
  componentType,
  page,
  pageSize,
  activeSort,
  buildOrderParam,
  buildQueryString,
  debouncedSearch,
  authToken,
}: UseFavComponentsParams) {
  const [result, setResult] = useState<PaginatedResult<PcComponent> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const run = async () => {
      try {
        const orderParam = buildOrderParam(activeSort);
        const filterQS = buildQueryString();
        const url =
         API_ROUTES.LIST_FAVORITE_COMPONENTS(componentType) +
          `?page=${page}&limit=${pageSize}` +
          (orderParam ? `&order=${orderParam}` : '') +
          filterQS +
          (debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '');

        const headers: Record<string, string> = {};
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data: PaginatedResult<PcComponent> = await res.json();
        if (!cancelled) setResult(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unexpected error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [componentType, page, activeSort, buildOrderParam, buildQueryString, debouncedSearch, authToken]);

  return { result, loading, error };
}