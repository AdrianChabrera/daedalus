import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ROUTES } from '../config/api';
import { CREATE_BUILD_SLOTS, STORAGE_KEY } from '../consts/CreateBuildConsts';
import type { BuildState, MultiComponentEntry, MultiSlot, SelectedComponent, SingleSlot, SlotConfig } from '../types/CreateBuildTypes';

const INITIAL_BUILD: BuildState = {
  cpuId: null, gpuId: null, motherboardId: null, pcCaseId: null,
  powerSupplyId: null, cpuCoolerId: null, keyboardId: null, mouseId: null,
  ramIds: [], storageDriveIds: [], fanIds: [], monitorIds: [],
};

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearDraft() {
  localStorage.removeItem(STORAGE_KEY);
}

export function useCreateBuild() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const draft = loadDraft();

  const [build, setBuild] = useState<BuildState>(draft?.build ?? INITIAL_BUILD);
  const [name, setName] = useState<string>(draft?.name ?? '');
  const [description, setDescription] = useState<string>(draft?.description ?? '');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [populated, setPopulated] = useState<Record<string, SelectedComponent>>({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ build, name, description }));
  }, [build, name, description]);

  useEffect(() => {
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
                  if (!res.ok) throw new Error('Error fetching component');
                  return res.json();
                })
                .then(data => {
                  const { id: dataId, buildcoresId, name } = data;
                  const finalId = dataId || buildcoresId || id;

                  const sourceData = data.specs ? data.specs : data;

                  const filteredSpecs: Record<string, unknown> = {};
                  slot.specs.forEach(specKey => {
                    if (sourceData[specKey] !== undefined && sourceData[specKey] !== null) {
                      filteredSpecs[specKey] = sourceData[specKey];
                    }
                  });

                  const formattedComponent: SelectedComponent = {
                    id: finalId,
                    name: name || 'Unknown Component',
                    specs: filteredSpecs,
                  };

                  setPopulated(prev => ({ ...prev, [finalId]: formattedComponent }));
                })
                .catch(err => console.error(`Failed to fetch component ${id}`, err))
            );
          }
        });
      });

      if (promises.length > 0) {
        await Promise.all(promises);
      }
    };

    fetchMissingComponents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build]);

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
    if (!name.trim()) {
      setWarnings(['Build title is required.']);
      return;
    }
    if (!user) {
      setWarnings(['You must be logged in to save a build.']);
      return;
    }

    setSaving(true);
    setWarnings([]);

    const body = {
      name: name.trim(),
      description: description.trim() || undefined,
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

    try {
      const res = await fetch(API_ROUTES.CREATE_BUILD, {
        method: 'POST',
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

      clearDraft();
      navigate('/builds/my-builds');
    } catch {
      setWarnings(['Network error. Please try again.']);
    } finally {
      setSaving(false);
    }
  };

  return {
    build,
    populated,
    name, setName,
    description, setDescription,
    warnings,
    saving,
    handleSelect,
    removeSingle,
    removeMulti,
    changeQuantity,
    handleSave,
  };
}