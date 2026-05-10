import { useCallback, useState } from 'react';
import { generateBuildPdf } from '../services/pdf/buildPdfExportService';
import { SLOT_TO_API } from '../consts/BuildDetailsConsts';
import { CREATE_BUILD_SLOTS } from '../consts/CreateBuildConsts';
import type { BuildDetail, BuildComponent, BuildMultiEntry } from '../types/BuildDetails.type';
import type { BuildState, MultiComponentEntry, MultiSlot, SelectedComponent, SingleSlot, UseBuildPdfFromStateResult } from '../types/CreateBuildTypes';

function buildStateToDetail(
  build: BuildState,
  populated: Record<string, SelectedComponent>,
  name: string,
  description: string,
  username?: string,
  photoUrl?: string,
): BuildDetail {
  const detail: Record<string, unknown> = {
    id: 0,
    name: name || 'Untitled Build',
    description: description || undefined,
    published: false,
    photoUrl: photoUrl || undefined,
    createdAt: new Date().toISOString(),
    username,
  };

  for (const slot of CREATE_BUILD_SLOTS) {
    const mapping = SLOT_TO_API[slot.key];
    if (!mapping) continue;

    if (mapping.single) {
      const componentId = build[slot.key as SingleSlot] as string | null;
      if (componentId && populated[componentId]) {
        const comp = populated[componentId];
        const buildComp: BuildComponent = {
          buildcoresId: comp.id,
          name: comp.name,
          ...comp.specs,
        };
        detail[mapping.single] = buildComp;
      }
    } else if (mapping.multi) {
      const entries = build[slot.key as MultiSlot] as MultiComponentEntry[];
      const multiEntries: BuildMultiEntry[] = entries
        .filter(e => populated[e.componentId])
        .map((e, idx) => {
          const comp = populated[e.componentId];
          const buildComp: BuildComponent = {
            buildcoresId: comp.id,
            name: comp.name,
            ...comp.specs,
          };
          return {
            id: idx,
            component: buildComp,
            quantity: e.quantity,
          };
        });
      detail[mapping.multi] = multiEntries;
    }
  }

  return detail as unknown as BuildDetail;
}

function hasAnyComponent(
  build: BuildState,
  populated: Record<string, SelectedComponent>,
): boolean {
  return CREATE_BUILD_SLOTS.some(slot => {
    const mapping = SLOT_TO_API[slot.key];
    if (!mapping) return false;
    if (mapping.single) {
      const id = build[slot.key as SingleSlot] as string | null;
      return !!id && !!populated[id];
    }
    if (mapping.multi) {
      const entries = build[slot.key as MultiSlot] as MultiComponentEntry[];
      return entries.some(e => !!populated[e.componentId]);
    }
    return false;
  });
}

export function useBuildPdfFromState(): UseBuildPdfFromStateResult {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportPdfFromState = useCallback(async (
    build: BuildState,
    populated: Record<string, SelectedComponent>,
    name: string,
    description: string,
    username?: string,
    photoUrl?: string,
  ) => {
    const hasComponents = hasAnyComponent(build, populated);

    if (!hasComponents) {
      setError('Add at least one component before exporting.');
      return;
    }

    setExporting(true);
    setError(null);
    try {
      const buildDetail = buildStateToDetail(build, populated, name, description, username, photoUrl);
      await generateBuildPdf(buildDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, []);

  return { exporting, error, exportPdfFromState };
}