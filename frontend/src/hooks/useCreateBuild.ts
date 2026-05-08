import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ROUTES } from '../config/api';
import { CREATE_BUILD_SLOTS, STORAGE_KEY } from '../consts/CreateBuildConsts';
import type {
  BuildState,
  MultiComponentEntry,
  MultiSlot,
  SelectedComponent,
  SingleSlot,
  SlotConfig,
} from '../types/CreateBuildTypes';

const PHOTO_STORAGE_KEY = 'daedalus_draft_build_photo';

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { build: BuildState; name: string; description: string };
  } catch {
    return null;
  }
}

function clearDraft() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PHOTO_STORAGE_KEY);
}

async function saveDraftPhoto(file: File): Promise<void> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = reader.result as string;
        localStorage.setItem(
          PHOTO_STORAGE_KEY,
          JSON.stringify({ dataUrl: result, name: file.name, type: file.type }),
        );
      } catch {
        // ignore
      }
      resolve();
    };
    reader.onerror = () => resolve();
    reader.readAsDataURL(file);
  });
}

interface StoredPhoto {
  dataUrl: string;
  name: string;
  type: string;
}

function loadDraftPhoto(): { file: File; previewUrl: string } | null {
  try {
    const raw = localStorage.getItem(PHOTO_STORAGE_KEY);
    if (!raw) return null;
    const { dataUrl, name, type } = JSON.parse(raw) as StoredPhoto;

    const byteString = atob(dataUrl.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type });
    const file = new File([blob], name, { type });
    return { file, previewUrl: dataUrl };
  } catch {
    return null;
  }
}

function clearDraftPhoto() {
  localStorage.removeItem(PHOTO_STORAGE_KEY);
}

async function uploadPhoto(
  buildId: number,
  file: File,
  accessToken: string,
): Promise<void> {
  const formData = new FormData();
  formData.append('photo', file);
  await fetch(API_ROUTES.BUILD_PHOTO(buildId), {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
}

const INITIAL_BUILD: BuildState = {
  cpuId: null, gpuId: null, motherboardId: null, pcCaseId: null,
  powerSupplyId: null, cpuCoolerId: null, keyboardId: null, mouseId: null,
  ramIds: [], storageDriveIds: [], fanIds: [], monitorIds: [],
};

export function useCreateBuild() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const draft = loadDraft();
  const draftPhoto = loadDraftPhoto();

  const [build, setBuild] = useState<BuildState>(draft?.build ?? INITIAL_BUILD);
  const [name, setName] = useState<string>(draft?.name ?? '');
  const [description, setDescription] = useState<string>(draft?.description ?? '');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [populated, setPopulated] = useState<Record<string, SelectedComponent>>({});

  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(
    draftPhoto?.file ?? null,
  );
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | undefined>(
    draftPhoto?.previewUrl ?? undefined,
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ build, name, description }));
  }, [build, name, description]);

  useEffect(() => {
    const fetchMissingComponents = async () => {
      const promises: Promise<void>[] = [];

      CREATE_BUILD_SLOTS.forEach((slot) => {
        const ids: string[] = slot.multi
          ? [
              ...new Set(
                (build[slot.key as MultiSlot] as MultiComponentEntry[]).map(
                  (e) => e.componentId,
                ),
              ),
            ]
          : (
              [build[slot.key as SingleSlot] as string | null].filter(
                Boolean,
              ) as string[]
            );

        ids.forEach((id) => {
          if (id && !populated[id]) {
            promises.push(
              fetch(API_ROUTES.COMPONENT(slot.endpoint, id))
                .then((res) => {
                  if (!res.ok) throw new Error('Error fetching component');
                  return res.json() as Promise<Record<string, unknown>>;
                })
                .then((data) => {
                  const finalId =
                    (data.id as string | undefined) ??
                    (data.buildcoresId as string | undefined) ??
                    id;
                  const sourceData = (
                    data.specs ? data.specs : data
                  ) as Record<string, unknown>;
                  const filteredSpecs: Record<string, unknown> = {};
                  slot.specs.forEach((specKey) => {
                    if (
                      sourceData[specKey] !== undefined &&
                      sourceData[specKey] !== null
                    ) {
                      filteredSpecs[specKey] = sourceData[specKey];
                    }
                  });
                  setPopulated((prev) => ({
                    ...prev,
                    [finalId]: {
                      id: finalId,
                      name: (data.name as string) || 'Unknown Component',
                      specs: filteredSpecs,
                    },
                  }));
                })
                .catch((err: unknown) =>
                  console.error(`Failed to fetch component ${id}`, err),
                ),
            );
          }
        });
      });

      if (promises.length > 0) {
        await Promise.all(promises);
      }
    };

    void fetchMissingComponents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build]);

  const handlePhotoSelect = useCallback((file: File) => {
    setPendingPhotoFile(file);
    setPendingPhotoPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    void saveDraftPhoto(file);
  }, []);

  const handlePhotoRemove = useCallback(() => {
    setPendingPhotoFile(null);
    setPendingPhotoPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return undefined;
    });
    clearDraftPhoto();
  }, []);

  const handleSelect = useCallback((slot: SlotConfig, comp: SelectedComponent) => {
    setPopulated((prev) => ({ ...prev, [comp.id]: comp }));
    setBuild((prev) => {
      if (slot.multi) {
        const multiKey = slot.key as MultiSlot;
        const existing = prev[multiKey] as MultiComponentEntry[];
        const idx = existing.findIndex((e) => e.componentId === comp.id);
        if (idx !== -1) {
          const updated = existing.map((e, i) =>
            i === idx ? { ...e, quantity: e.quantity + 1 } : e,
          );
          return { ...prev, [multiKey]: updated };
        }
        return { ...prev, [multiKey]: [...existing, { componentId: comp.id, quantity: 1 }] };
      }
      return { ...prev, [slot.key]: comp.id };
    });
  }, []);

  const removeSingle = useCallback((key: SingleSlot) => {
    setBuild((prev) => ({ ...prev, [key]: null }));
  }, []);

  const removeMulti = useCallback((key: MultiSlot, id: string) => {
    setBuild((prev) => ({
      ...prev,
      [key]: (prev[key] as MultiComponentEntry[]).filter((e) => e.componentId !== id),
    }));
  }, []);

  const changeQuantity = useCallback((key: MultiSlot, id: string, quantity: number) => {
    if (quantity < 1) return;
    setBuild((prev) => ({
      ...prev,
      [key]: (prev[key] as MultiComponentEntry[]).map((e) =>
        e.componentId === id ? { ...e, quantity } : e,
      ),
    }));
  }, []);

  function buildBody() {
    return {
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
  }

  const handleSave = async () => {
    if (!name.trim()) { setWarnings(['Build title is required.']); return; }
    if (!user) { setWarnings(['You must be logged in to save a build.']); return; }

    setSaving(true);
    setWarnings([]);

    try {
      const res = await fetch(API_ROUTES.CREATE_BUILD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify(buildBody()),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: unknown };
        const msgs: string[] = [];
        if (Array.isArray(err.message)) msgs.push(...(err.message as string[]));
        else if (typeof err.message === 'string') msgs.push(err.message);
        else msgs.push('An error occurred while saving the build.');
        setWarnings(msgs);
        return;
      }

      const savedBuild = (await res.json()) as { id: number };

      if (pendingPhotoFile) {
        await uploadPhoto(savedBuild.id, pendingPhotoFile, user.accessToken);
      }

      clearDraft();
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

    try {
      const res = await fetch(API_ROUTES.CREATE_AND_PUBLISH_BUILD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify(buildBody()),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: unknown };
        const msgs: string[] = [];
        if (typeof err.message === 'string') msgs.push(err.message);
        else msgs.push('Could not publish the build. Check compatibility errors.');
        setWarnings(msgs);
        return;
      }

      const savedBuild = (await res.json()) as { id: number };

      if (pendingPhotoFile) {
        await uploadPhoto(savedBuild.id, pendingPhotoFile, user.accessToken);
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
    pendingPhotoFile,
    pendingPhotoPreview,
    handlePhotoSelect,
    handlePhotoRemove,
    warnings,
    saving,
    handleSelect,
    removeSingle,
    removeMulti,
    changeQuantity,
    handleSave,
    handleSaveAndPublish,
  };
}