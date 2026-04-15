import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_ROUTES } from '../config/api';
import type { AddToBuildStatus, BuildState, UserBuild, MultiComponentEntry, BuildComponent, UserBuildWithCount, BuildOpStatus } from '../types/CreateBuildTypes';
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

const backendTypeMap: Record<string, string> = {
  cpu: 'cpu',
  gpu: 'gpu',
  motherboard: 'motherboard',
  'pc-case': 'pcCase',
  'power-supply': 'powerSupply',
  'cpu-cooler': 'cpuCooler',
  keyboard: 'keyboard',
  mouse: 'mouse',
  ram: 'ram',
  'storage-drive': 'storageDrive',
  fan: 'fan',
  monitor: 'monitor',
};

const singleSlotBuildKey: Record<string, keyof UserBuild> = {
  cpu: 'cpu',
  gpu: 'gpu',
  motherboard: 'motherboard',
  'pc-case': 'pcCase',
  'power-supply': 'powerSupply',
  'cpu-cooler': 'cpuCooler',
  keyboard: 'keyboard',
  mouse: 'mouse',
};

export function useAddToBuild(componentType: string, componentId: string) {
  const { user } = useAuth();
  const isMulti = MULTI_COMPONENT_TYPES.has(componentType);

  const [localStatus, setLocalStatus] = useState<AddToBuildStatus>('idle');
  const [localCount, setLocalCount] = useState(0);
  const [localOccupied, setLocalOccupied] = useState(false);

  const [userBuilds, setUserBuilds] = useState<UserBuildWithCount[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingBuilds, setLoadingBuilds] = useState(false);

  const [buildOpStatus, setBuildOpStatus] = useState<Record<number, BuildOpStatus>>({});

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
      cpuId: null, gpuId: null, motherboardId: null, pcCaseId: null,
      powerSupplyId: null, cpuCoolerId: null, keyboardId: null, mouseId: null,
      ramIds: [], storageDriveIds: [], fanIds: [], monitorIds: [],
    } as BuildState;

    const key = TYPE_TO_BUILD_KEY[componentType] as keyof BuildState;
    if (!key) return;

    if (isMulti) {
      const existing = (build[key] as MultiComponentEntry[]) ?? [];
      const idx = existing.findIndex(e => e.componentId === componentId);
      if (idx !== -1) {
        const updated = [...existing];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        (build[key] as MultiComponentEntry[]) = updated;
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
      if (idx !== -1) {
        const updated = [...existing];
        if (updated[idx].quantity > 1) {
          updated[idx] = { ...updated[idx], quantity: updated[idx].quantity - 1 };
        } else {
          updated.splice(idx, 1);
        }
        (build[key] as MultiComponentEntry[]) = updated;
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
      if (localStatus === 'in-build') return;
      if (localOccupied) {
        setLocalStatus('confirm-replace');
      } else {
        addToLocalBuild();
      }
    }
  }, [isMulti, localStatus, localOccupied, addToLocalBuild]);

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
    setLoadingBuilds(true);

    const mappedType = backendTypeMap[componentType] ?? componentType;

    try {
      const res = await fetch(API_ROUTES.UNPUBLISHED_BUILDS(mappedType, componentId), {
        headers: { Authorization: `Bearer ${user!.accessToken}` },
      });
      if (!res.ok) throw new Error();
      const data: Array<{ build: UserBuild; quantity: number }> = await res.json();

      setUserBuilds(
        data.map(({ build, quantity }) => {
          let slotOccupiedBy: BuildComponent | undefined;

          if (!isMulti) {
            const buildKey = singleSlotBuildKey[componentType];
            const slot = buildKey ? (build[buildKey] as BuildComponent | undefined) : undefined;
            if (slot && slot.buildcoresId !== componentId) {
              slotOccupiedBy = slot;
            }
          }

          return {
            ...build,
            serverCount: quantity,
            localDelta: 0,
            slotOccupiedBy,
            confirmingReplace: false,
          };
        })
      );
    } catch {
      setUserBuilds([]);
    } finally {
      setLoadingBuilds(false);
    }
  }, [dropdownOpen, componentType, componentId, isMulti, user]);

  const applyDelta = useCallback((buildId: number, delta: number) => {
    setUserBuilds(prev =>
      prev.map(b =>
        b.id === buildId
          ? { ...b, localDelta: Math.max(-(b.serverCount), b.localDelta + delta) }
          : b
      )
    );
  }, []);

  const requestReplaceForBuild = useCallback((buildId: number) => {
    setUserBuilds(prev =>
      prev.map(b => b.id === buildId ? { ...b, confirmingReplace: true } : b)
    );
  }, []);

  const cancelReplaceForBuild = useCallback((buildId: number) => {
    setUserBuilds(prev =>
      prev.map(b => b.id === buildId ? { ...b, confirmingReplace: false } : b)
    );
  }, []);

  const addToExistingBuild = useCallback(async (buildId: number) => {
    applyDelta(buildId, 1);
    if (!isMulti) {
      setUserBuilds(prev =>
        prev.map(b =>
          b.id === buildId
            ? { ...b, localDelta: 1, slotOccupiedBy: undefined, confirmingReplace: false }
            : b
        )
      );
    }
    setBuildOpStatus(prev => ({ ...prev, [buildId]: 'loading' }));

    try {
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
        }),
      });
      if (!res.ok) throw new Error();

      setUserBuilds(prev =>
        prev.map(b =>
          b.id === buildId
            ? { ...b, serverCount: b.serverCount + 1, localDelta: 0 }
            : b
        )
      );
      setBuildOpStatus(prev => ({ ...prev, [buildId]: 'idle' }));
    } catch {
      applyDelta(buildId, -1);
      if (!isMulti) {
        setUserBuilds(prev =>
          prev.map(b =>
            b.id === buildId
              ? { ...b, confirmingReplace: false }
              : b
          )
        );
      }
      setBuildOpStatus(prev => ({ ...prev, [buildId]: 'error' }));
      setTimeout(() => setBuildOpStatus(prev => ({ ...prev, [buildId]: 'idle' })), 2000);
    }
  }, [componentId, componentType, isMulti, user, applyDelta]);

  const removeFromExistingBuild = useCallback(async (buildId: number) => {
    const build = userBuilds.find(b => b.id === buildId);
    if (!build || build.serverCount + build.localDelta <= 0) return;

    applyDelta(buildId, -1);
    setBuildOpStatus(prev => ({ ...prev, [buildId]: 'loading' }));

    try {
      const res = await fetch(API_ROUTES.REMOVE_COMPONENT, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user!.accessToken}`,
        },
        body: JSON.stringify({
          componentId,
          buildId,
          componentType: backendTypeMap[componentType] ?? componentType,
        }),
      });
      if (!res.ok) throw new Error();

      setUserBuilds(prev =>
        prev.map(b =>
          b.id === buildId
            ? { ...b, serverCount: Math.max(0, b.serverCount - 1), localDelta: 0 }
            : b
        )
      );
      setBuildOpStatus(prev => ({ ...prev, [buildId]: 'idle' }));
    } catch {
      applyDelta(buildId, 1);
      setBuildOpStatus(prev => ({ ...prev, [buildId]: 'error' }));
      setTimeout(() => setBuildOpStatus(prev => ({ ...prev, [buildId]: 'idle' })), 2000);
    }
  }, [userBuilds, componentId, componentType, user, applyDelta]);

  return {
    isMulti,
    isAuthenticated: !!user,
    localStatus,
    localCount,
    localOccupied,
    handleLocalAdd,
    handleLocalRemove: removeFromLocalBuild,
    handleConfirmReplace,
    handleCancelReplace,
    userBuilds,
    dropdownOpen,
    loadingBuilds,
    buildOpStatus,
    openBuildsDropdown,
    addToExistingBuild,
    removeFromExistingBuild,
    requestReplaceForBuild,
    cancelReplaceForBuild,
    closeDropdown: () => setDropdownOpen(false),
  };
}