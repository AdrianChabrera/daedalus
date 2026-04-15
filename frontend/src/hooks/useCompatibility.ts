import { useState, useEffect, useRef } from 'react';
import type { BuildState, CompatibilityIssue, MultiComponentEntry } from '../types/CreateBuildTypes';
import { API_ROUTES } from '../config/api';


function buildHasAnyComponent(build: BuildState): boolean {
  const singles: (keyof BuildState)[] = [
    'cpuId', 'gpuId', 'motherboardId', 'pcCaseId',
    'powerSupplyId', 'cpuCoolerId', 'keyboardId', 'mouseId',
  ];
  if (singles.some(k => build[k] !== null)) return true;

  const multis: (keyof BuildState)[] = ['ramIds', 'storageDriveIds', 'fanIds', 'monitorIds'];
  return multis.some(k => (build[k] as MultiComponentEntry[]).length > 0);
}

function buildToDto(build: BuildState) {
  return {
    pcCaseId:        build.pcCaseId        ?? undefined,
    cpuCoolerId:   build.cpuCoolerId   ?? undefined,
    cpuId:         build.cpuId         ?? undefined,
    gpuId:         build.gpuId         ?? undefined,
    keyboardId:    build.keyboardId    ?? undefined,
    motherboardId: build.motherboardId ?? undefined,
    mouseId:       build.mouseId       ?? undefined,
    powerSupplyId: build.powerSupplyId ?? undefined,
    fanIds:        build.fanIds.length        ? build.fanIds        : undefined,
    monitorIds:    build.monitorIds.length    ? build.monitorIds    : undefined,
    ramIds:        build.ramIds.length        ? build.ramIds        : undefined,
    storageDriveIds: build.storageDriveIds.length ? build.storageDriveIds : undefined,
  };
}

export function useCompatibility(build: BuildState, debounceMs = 600) {
  const [issues, setIssues]   = useState<CompatibilityIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const buildRef = useRef(build);
  buildRef.current = build;

  useEffect(() => {
    if (!buildHasAnyComponent(build)) {
      setIssues([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const id = setTimeout(async () => {
      try {
        const res = await fetch(API_ROUTES.CHECK_COMPATIBILITY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildToDto(buildRef.current)),
        });

        if (!res.ok) throw new Error(`Error ${res.status}`);

        const data: CompatibilityIssue[] = await res.json();
        setIssues(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Compatibility check failed');
        setIssues([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(id);
      setLoading(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    build.cpuId, build.gpuId, build.motherboardId, build.pcCaseId,
    build.powerSupplyId, build.cpuCoolerId, build.keyboardId, build.mouseId,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(build.ramIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(build.storageDriveIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(build.fanIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(build.monitorIds),
    debounceMs,
  ]);

  return { issues, loading, error };
}