import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ROUTES } from '../config/api';
import type { BuildState, MultiSlot, SelectedComponent, SingleSlot, SlotConfig } from '../types/CreateBuildTypes';

const STORAGE_KEY = 'daedalus_draft_build';

const INITIAL_BUILD: BuildState = {
  cpuId: null, gpuId: null, motherboardId: null, caseId: null,
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ build, name, description }));
  }, [build, name, description]);

  const handleSelect = useCallback((slot: SlotConfig, comp: SelectedComponent) => {
    setBuild(prev => {
      if (slot.multi) {
        const multiKey = slot.key as MultiSlot;
        const existing = prev[multiKey] as SelectedComponent[];
        if (existing.find(c => c.id === comp.id)) return prev;
        return { ...prev, [multiKey]: [...existing, comp] };
      }
      return { ...prev, [slot.key]: comp };
    });
  }, []);

  const removeSingle = useCallback((key: SingleSlot) => {
    setBuild(prev => ({ ...prev, [key]: null }));
  }, []);

  const removeMulti = useCallback((key: MultiSlot, id: string) => {
    setBuild(prev => ({
      ...prev,
      [key]: (prev[key] as SelectedComponent[]).filter(c => c.id !== id),
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
      caseId: build.caseId?.id,
      cpuCoolerId: build.cpuCoolerId?.id,
      cpuId: build.cpuId?.id,
      fanIds: build.fanIds.map(c => c.id),
      gpuId: build.gpuId?.id,
      keyboardId: build.keyboardId?.id,
      monitorIds: build.monitorIds.map(c => c.id),
      motherboardId: build.motherboardId?.id,
      mouseId: build.mouseId?.id,
      powerSupplyId: build.powerSupplyId?.id,
      ramIds: build.ramIds.map(c => c.id),
      storageDriveIds: build.storageDriveIds.map(c => c.id),
    };

    try {
      const res = await fetch(API_ROUTES.CREATE_BUILD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.accessToken}`,
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
      navigate('/builds');
    } catch {
      setWarnings(['Network error. Please try again.']);
    } finally {
      setSaving(false);
    }
  };

  return {
    build,
    name, setName,
    description, setDescription,
    warnings,
    saving,
    handleSelect,
    removeSingle,
    removeMulti,
    handleSave,
  };
}