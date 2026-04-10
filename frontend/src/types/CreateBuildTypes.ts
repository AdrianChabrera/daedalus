export interface SelectedComponent {
  id: string;
  name: string;
  specs: Record<string, unknown>;
}

export interface BuildState {
  cpuId: SelectedComponent | null;
  gpuId: SelectedComponent | null;
  motherboardId: SelectedComponent | null;
  caseId: SelectedComponent | null;
  powerSupplyId: SelectedComponent | null;
  cpuCoolerId: SelectedComponent | null;
  keyboardId: SelectedComponent | null;
  mouseId: SelectedComponent | null;
  ramIds: SelectedComponent[];
  storageDriveIds: SelectedComponent[];
  fanIds: SelectedComponent[];
  monitorIds: SelectedComponent[];
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

export type SingleSlot = keyof Omit<BuildState, 'ramIds' | 'storageDriveIds' | 'fanIds' | 'monitorIds'>;
export type MultiSlot = 'ramIds' | 'storageDriveIds' | 'fanIds' | 'monitorIds';
export type SlotKey = SingleSlot | MultiSlot;



