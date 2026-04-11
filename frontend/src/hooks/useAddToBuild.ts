import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_ROUTES } from '../config/api';
import type { AddToBuildStatus, BuildState, MultiComponentEntry, UserBuild } from '../types/CreateBuildTypes';
import { MULTI_COMPONENT_TYPES, STORAGE_KEY, TYPE_TO_BUILD_KEY } from '../consts/CreateBuildConsts';

function loadDraftBuild(): BuildState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw)?.build ?? null;
  } catch {
    return null;
  }
}

function saveToDraftBuild(updatedBuild: BuildState) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, build: updatedBuild }));
  } catch {
    // ignore
  }
}

function getMultiCountFromDraft(componentType: string, componentId: string): number {
  const build = loadDraftBuild();
  if (!build) return 0;
  const key = TYPE_TO_BUILD_KEY[componentType] as keyof BuildState;
  if (!key) return 0;
  const slot = build[key];
  if (!Array.isArray(slot)) return 0;
  const entry = (slot as MultiComponentEntry[]).find(e => e.componentId === componentId);
  return entry?.quantity ?? 0;
}

function isSingleInDraft(componentType: string, componentId: string): boolean {
  const build = loadDraftBuild();
  if (!build) return false;
  const key = TYPE_TO_BUILD_KEY[componentType] as keyof BuildState;
  if (!key) return false;
  const slot = build[key];
  if (!slot || Array.isArray(slot)) return false;
  return slot === componentId;
}

function isSingleSlotOccupied(componentType: string): boolean {
  const build = loadDraftBuild();
  if (!build) return false;
  const key = TYPE_TO_BUILD_KEY[componentType] as keyof BuildState;
  if (!key) return false;
  const slot = build[key];
  return !!slot && !Array.isArray(slot);
}

export function useAddToBuild(componentType: string, componentId: string) {
  const { user } = useAuth();
  const isMulti = MULTI_COMPONENT_TYPES.has(componentType);

  const [localStatus, setLocalStatus] = useState<AddToBuildStatus>('idle');
  const [localCount, setLocalCount] = useState(0);
  const [localOccupied, setLocalOccupied] = useState(false);

  const [userBuilds, setUserBuilds] = useState<UserBuild[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingBuilds, setLoadingBuilds] = useState(false);
  const [buildStatuses, setBuildStatuses] = useState<Record<number, 'idle' | 'loading' | 'done' | 'error'>>({});

  const refreshLocalState = useCallback(() => {
    if (isMulti) {
      const count = getMultiCountFromDraft(componentType, componentId);
      setLocalCount(count);
      setLocalStatus('idle');
    } else {
      const isInBuild = isSingleInDraft(componentType, componentId);
      if (isInBuild) {
        setLocalStatus('in-build');
      } else {
        setLocalOccupied(isSingleSlotOccupied(componentType));
        setLocalStatus('idle');
      }
    }
  }, [componentType, componentId, isMulti]);

  useEffect(() => {
    refreshLocalState();
  }, [refreshLocalState]);

  const addToLocalBuild = useCallback(() => {
    const build = loadDraftBuild() ?? {
      cpuId: null, gpuId: null, motherboardId: null, caseId: null,
      powerSupplyId: null, cpuCoolerId: null, keyboardId: null, mouseId: null,
      ramIds: [], storageDriveIds: [], fanIds: [], monitorIds: [],
    } as BuildState;

    const key = TYPE_TO_BUILD_KEY[componentType] as keyof BuildState;
    if (!key) return;

    if (isMulti) {
      const existing = (build[key] as MultiComponentEntry[]) ?? [];
      const idx = existing.findIndex(e => e.componentId === componentId);
      if (idx !== -1) {
        (build[key] as MultiComponentEntry[]) = existing.map((e, i) =>
          i === idx ? { ...e, quantity: e.quantity + 1 } : e
        );
      } else {
        (build[key] as MultiComponentEntry[]) = [...existing, { componentId, quantity: 1 }];
      }
    } else {
      (build[key] as string | null) = componentId;
    }

    saveToDraftBuild(build);
    refreshLocalState();
  }, [componentType, componentId, isMulti, refreshLocalState]);

  const removeFromLocalBuild = useCallback(() => {
    const build = loadDraftBuild();
    if (!build) return;

    const key = TYPE_TO_BUILD_KEY[componentType] as keyof BuildState;
    if (!key) return;

    if (isMulti) {
      const existing = (build[key] as MultiComponentEntry[]) ?? [];
      const idx = existing.findIndex(e => e.componentId === componentId);
      if (idx === -1) return;
      const current = existing[idx].quantity;
      if (current <= 1) {
        (build[key] as MultiComponentEntry[]) = existing.filter(e => e.componentId !== componentId);
      } else {
        (build[key] as MultiComponentEntry[]) = existing.map((e, i) =>
          i === idx ? { ...e, quantity: e.quantity - 1 } : e
        );
      }
    } else {
      (build[key] as string | null) = null;
    }

    saveToDraftBuild(build);
    refreshLocalState();
  }, [componentType, componentId, isMulti, refreshLocalState]);

  const handleLocalAdd = useCallback(() => {
    if (isMulti) {
      addToLocalBuild();
    } else {
      if (localStatus === 'in-build') {
        removeFromLocalBuild();
      } else if (localOccupied) {
        setLocalStatus('confirm-replace');
      } else {
        addToLocalBuild();
      }
    }
  }, [isMulti, localStatus, localOccupied, addToLocalBuild, removeFromLocalBuild]);

  const handleLocalRemove = useCallback(() => {
    removeFromLocalBuild();
  }, [removeFromLocalBuild]);

  const handleConfirmReplace = useCallback(() => {
    addToLocalBuild();
  }, [addToLocalBuild]);

  const handleCancelReplace = useCallback(() => {
    refreshLocalState();
  }, [refreshLocalState]);

  const openBuildsDropdown = useCallback(async () => {
    if (dropdownOpen) {
      setDropdownOpen(false);
      return;
    }
    setDropdownOpen(true);
    if (userBuilds.length > 0) return;
    setLoadingBuilds(true);
    try {
      const res = await fetch(API_ROUTES.UNPUBLISHED_BUILDS, {
        headers: { Authorization: `Bearer ${user!.accessToken}` },
      });
      if (!res.ok) throw new Error();
      const data: UserBuild[] = await res.json();
      setUserBuilds(data);
    } catch {
      setUserBuilds([]);
    } finally {
      setLoadingBuilds(false);
    }
  }, [dropdownOpen, userBuilds.length, user]);

  const assignToUserBuild = useCallback(async (buildId: number) => {
    setBuildStatuses(prev => ({ ...prev, [buildId]: 'loading' }));
    try {
      const backendTypeMap: Record<string, string> = {
        cpu: 'cpu', gpu: 'gpu', motherboard: 'motherboard', case: 'case',
        'power-supply': 'powerSupply', 'cpu-cooler': 'cpuCooler',
        keyboard: 'keyboard', mouse: 'mouse', ram: 'ram',
        'storage-drive': 'storageDrive', fan: 'fan', monitor: 'monitor',
      };

      const res = await fetch(API_ROUTES.ASSIGN_COMPONENT, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user!.accessToken}`,
        },
        body: JSON.stringify({
          componentId,
          buildId,
          componentType: backendTypeMap[componentType] ?? componentType,
          ...(isMulti && { quantity: Math.max(1, getMultiCountFromDraft(componentType, componentId)) }),
        }),
      });
      if (!res.ok) throw new Error();
      setBuildStatuses(prev => ({ ...prev, [buildId]: 'done' }));
    } catch {
      setBuildStatuses(prev => ({ ...prev, [buildId]: 'error' }));
    }
  }, [componentId, componentType, isMulti, user]);

  return {
    isMulti,
    isAuthenticated: !!user,
    localStatus,
    localCount,
    localOccupied,
    handleLocalAdd,
    handleLocalRemove,
    handleConfirmReplace,
    handleCancelReplace,
    userBuilds,
    dropdownOpen,
    loadingBuilds,
    buildStatuses,
    openBuildsDropdown,
    assignToUserBuild,
    closeDropdown: () => setDropdownOpen(false),
  };
}