export interface SelectedComponent {
  id: string;
  name: string;
  specs: Record<string, unknown>;
}

export interface BuildState {
  cpuId: string | null;
  gpuId: string | null;
  motherboardId: string | null;
  caseId: string | null;
  powerSupplyId: string | null;
  cpuCoolerId: string | null;
  keyboardId: string | null;
  mouseId: string | null;
  ramIds: string[];
  storageDriveIds: string[];
  fanIds: string[];
  monitorIds: string[];
}

export interface SlotConfig {
  key: SlotKey;
  label: string;
  endpoint: string;
  icon: React.ReactNode;
  multi: boolean;
  specs: string[];
}

export interface PickerResult {
  buildcoresId: string;
  name: string | null;
  [key: string]: unknown;
}

export interface ComponentPickerProps {
  slot: SlotConfig;
  onSelect: (c: SelectedComponent) => void;
  onClose: () => void;
}

export interface SlotRowProps {
  slot: SlotConfig;
  single: SelectedComponent | null;
  multi: SelectedComponent[];
  onAssign: () => void;
  onRemoveSingle: () => void;
  onRemoveMulti: (id: string) => void;
}

export interface UserBuild {
  id: number;
  name: string;
}

export type SingleSlot = keyof Omit<BuildState, 'ramIds' | 'storageDriveIds' | 'fanIds' | 'monitorIds'>;
export type MultiSlot = 'ramIds' | 'storageDriveIds' | 'fanIds' | 'monitorIds';
export type SlotKey = SingleSlot | MultiSlot;
export type AddToBuildStatus = 'idle' | 'in-build' | 'confirm-replace' | 'loading' | 'error';
