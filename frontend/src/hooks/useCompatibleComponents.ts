import { useState, useEffect } from 'react';
import { API_ROUTES } from '../config/api';
import type { PcComponent, ActiveSort } from '../types/PcComponents.types';
import type { PaginatedResult } from '../types/PaginatedResult.type';
import type { BuildState } from '../types/CreateBuildTypes';

interface UseCompatibleComponentsParams {
  build: BuildState;
  componentType: string;
  page: number;
  pageSize: number;
  activeSort: ActiveSort;
  buildOrderParam: (sort: ActiveSort) => string | undefined;
  buildQueryString: () => string;
  debouncedSearch: string;
}

function buildDtoFromState(build: BuildState) {
  return {
    pcCaseId: build.pcCaseId,
    cpuCoolerId: build.cpuCoolerId,
    cpuId: build.cpuId,
    gpuId: build.gpuId,
    keyboardId: build.keyboardId,
    motherboardId: build.motherboardId,
    mouseId: build.mouseId,
    powerSupplyId: build.powerSupplyId,
    fanIds: build.fanIds,
    monitorIds: build.monitorIds,
    ramIds: build.ramIds,
    storageDriveIds: build.storageDriveIds,
  };
}

export function useCompatibleComponents({
  build,
  componentType,
  page,
  pageSize,
  activeSort,
  buildOrderParam,
  buildQueryString,
  debouncedSearch,
}: UseCompatibleComponentsParams) {
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
          API_ROUTES.COMPATIBLE_COMPONENTS(componentType) +
          `?page=${page}&limit=${pageSize}` +
          (orderParam ? `&order=${orderParam}` : '') +
          filterQS +
          (debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '');

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildDtoFromState(build)),
        });

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
  }, [componentType, page, activeSort, buildOrderParam, buildQueryString, debouncedSearch, build]);

  return { result, loading, error };
}