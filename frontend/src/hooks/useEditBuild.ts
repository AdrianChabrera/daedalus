import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ROUTES } from '../config/api';
import { CREATE_BUILD_SLOTS } from '../consts/CreateBuildConsts';
import type {
  BuildState,
  MultiComponentEntry,
  MultiSlot,
  SelectedComponent,
  SingleSlot,
  SlotConfig,
} from '../types/CreateBuildTypes';

const EMPTY_BUILD: BuildState = {
  cpuId: null, gpuId: null, motherboardId: null, pcCaseId: null,
  powerSupplyId: null, cpuCoolerId: null, keyboardId: null, mouseId: null,
  ramIds: [], storageDriveIds: [], fanIds: [], monitorIds: [],
};

function buildResponseToBuildState(data: Record<string, unknown>): BuildState {
  const single = (field: string) =>
    (data[field] as { buildcoresId: string } | null)?.buildcoresId ?? null;

  const multi = (field: string): MultiComponentEntry[] => {
    const arr = data[field] as Array<{ component: { buildcoresId: string }; quantity: number }> | undefined;
    if (!arr || !Array.isArray(arr)) return [];
    return arr.map(({ component, quantity }) => ({
      componentId: component.buildcoresId,
      quantity,
    }));
  };

  return {
    cpuId:         single('cpu'),
    gpuId:         single('gpu'),
    motherboardId: single('motherboard'),
    pcCaseId:      single('pcCase'),
    powerSupplyId: single('powerSupply'),
    cpuCoolerId:   single('cpuCooler'),
    keyboardId:    single('keyboard'),
    mouseId:       single('mouse'),
    ramIds:        multi('rams'),
    storageDriveIds: multi('storageDrives'),
    fanIds:        multi('fans'),
    monitorIds:    multi('monitors'),
  };
}

export function useEditBuild(buildId: number) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [build, setBuild] = useState<BuildState>(EMPTY_BUILD);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [populated, setPopulated] = useState<Record<string, SelectedComponent>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingBuild, setLoadingBuild] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetchBuild = async () => {
      setLoadingBuild(true);
      setLoadError(null);
      try {
        const res = await fetch(API_ROUTES.GET_BUILD(buildId), {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();

        if (!cancelled) {
          setName(data.name ?? '');
          setDescription(data.description ?? '');
          setBuild(buildResponseToBuildState(data));
        }
      } catch (err) {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : 'Could not load build');
      } finally {
        if (!cancelled) setLoadingBuild(false);
      }
    };

    fetchBuild();
    return () => { cancelled = true; };
  }, [buildId, user]);

  useEffect(() => {
    if (loadingBuild) return;

    const fetchMissingComponents = async () => {
      const promises: Promise<void>[] = [];

      CREATE_BUILD_SLOTS.forEach(slot => {
        const ids: string[] = slot.multi
          ? [...new Set((build[slot.key as MultiSlot] as MultiComponentEntry[]).map(e => e.componentId))]
          : [build[slot.key as SingleSlot] as string | null].filter(Boolean) as string[];

        ids.forEach(id => {
          if (id && !populated[id]) {
            promises.push(
              fetch(API_ROUTES.COMPONENT(slot.endpoint, id))
                .then(res => {
                  if (!res.ok) throw new Error();
                  return res.json();
                })
                .then((data: Record<string, unknown>) => {
                  const buildcoresId = data.buildcoresId as string ?? id;
                  const filteredSpecs: Record<string, unknown> = {};
                  const sourceData = (data.specs ?? data) as Record<string, unknown>;
                  slot.specs.forEach(specKey => {
                    if (sourceData[specKey] !== undefined && sourceData[specKey] !== null) {
                      filteredSpecs[specKey] = sourceData[specKey];
                    }
                  });
                  setPopulated(prev => ({
                    ...prev,
                    [buildcoresId]: {
                      id: buildcoresId,
                      name: (data.name as string) || 'Unknown Component',
                      specs: filteredSpecs,
                    },
                  }));
                })
                .catch(() => {})
            );
          }
        });
      });

      if (promises.length > 0) await Promise.all(promises);
    };

    fetchMissingComponents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build, loadingBuild]);

  const handleSelect = useCallback((slot: SlotConfig, comp: SelectedComponent) => {
    setPopulated(prev => ({ ...prev, [comp.id]: comp }));
    setBuild(prev => {
      if (slot.multi) {
        const multiKey = slot.key as MultiSlot;
        const existing = prev[multiKey] as MultiComponentEntry[];
        const idx = existing.findIndex(e => e.componentId === comp.id);
        if (idx !== -1) {
          const updated = existing.map((e, i) =>
            i === idx ? { ...e, quantity: e.quantity + 1 } : e
          );
          return { ...prev, [multiKey]: updated };
        }
        return { ...prev, [multiKey]: [...existing, { componentId: comp.id, quantity: 1 }] };
      }
      return { ...prev, [slot.key]: comp.id };
    });
  }, []);

  const removeSingle = useCallback((key: SingleSlot) => {
    setBuild(prev => ({ ...prev, [key]: null }));
  }, []);

  const removeMulti = useCallback((key: MultiSlot, id: string) => {
    setBuild(prev => ({
      ...prev,
      [key]: (prev[key] as MultiComponentEntry[]).filter(e => e.componentId !== id),
    }));
  }, []);

  const changeQuantity = useCallback((key: MultiSlot, id: string, quantity: number) => {
    if (quantity < 1) return;
    setBuild(prev => ({
      ...prev,
      [key]: (prev[key] as MultiComponentEntry[]).map(e =>
        e.componentId === id ? { ...e, quantity } : e
      ),
    }));
  }, []);

  const handleSave = async () => {
    if (!name.trim()) { setWarnings(['Build title is required.']); return; }
    if (!user) { setWarnings(['You must be logged in to save a build.']); return; }

    setSaving(true);
    setWarnings([]);

    const body = {
      name: name.trim(),
      description: description.trim() || undefined,
      pcCaseId:      build.pcCaseId,
      cpuCoolerId:   build.cpuCoolerId,
      cpuId:         build.cpuId,
      gpuId:         build.gpuId,
      keyboardId:    build.keyboardId,
      motherboardId: build.motherboardId,
      mouseId:       build.mouseId,
      powerSupplyId: build.powerSupplyId,
      fanIds:        build.fanIds,
      monitorIds:    build.monitorIds,
      ramIds:        build.ramIds,
      storageDriveIds: build.storageDriveIds,
    };

    try {
      const res = await fetch(API_ROUTES.GET_BUILD(buildId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msgs: string[] = [];
        if (Array.isArray(err.message)) msgs.push(...err.message);
        else if (typeof err.message === 'string') msgs.push(err.message);
        else msgs.push('An error occurred while saving the build.');
        setWarnings(msgs);
        return;
      }

      navigate('/builds/my-builds');
    } catch {
      setWarnings(['Network error. Please try again.']);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndPublish = async () => {
    if (!name.trim()) { setWarnings(['Build title is required.']); return; }
    if (!user) { setWarnings(['You must be logged in to publish a build.']); return; }

    setSaving(true);
    setWarnings([]);

    const body = {
      name: name.trim(),
      description: description.trim() || undefined,
      pcCaseId:      build.pcCaseId,
      cpuCoolerId:   build.cpuCoolerId,
      cpuId:         build.cpuId,
      gpuId:         build.gpuId,
      keyboardId:    build.keyboardId,
      motherboardId: build.motherboardId,
      mouseId:       build.mouseId,
      powerSupplyId: build.powerSupplyId,
      fanIds:        build.fanIds,
      monitorIds:    build.monitorIds,
      ramIds:        build.ramIds,
      storageDriveIds: build.storageDriveIds,
    };

    try {
      const updateRes = await fetch(API_ROUTES.GET_BUILD(buildId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!updateRes.ok) {
        const err = await updateRes.json().catch(() => ({}));
        setWarnings([typeof err.message === 'string' ? err.message : 'Could not update the build.']);
        return;
      }

      const publishRes = await fetch(`${API_ROUTES.PUBLISH_BUILD}/${buildId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });

      if (!publishRes.ok) {
        const err = await publishRes.json().catch(() => ({}));
        setWarnings([typeof err.message === 'string' ? err.message : 'Could not publish the build. Check compatibility errors.']);
        return;
      }

      navigate('/builds/my-builds');
    } catch {
      setWarnings(['Network error. Please try again.']);
    } finally {
      setSaving(false);
    }
  };

  return {
    build, populated, name, setName, description, setDescription,
    warnings, saving, loadingBuild, loadError,
    handleSelect, removeSingle, removeMulti, changeQuantity,
    handleSave, handleSaveAndPublish,
  };
}