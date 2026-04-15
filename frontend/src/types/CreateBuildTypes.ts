export interface SelectedComponent {
  id: string;
  name: string;
  specs: Record<string, unknown>;
}

export interface MultiComponentEntry {
  componentId: string;
  quantity: number;
}

export interface BuildState {
  cpuId: string | null;
  gpuId: string | null;
  motherboardId: string | null;
  pcCaseId: string | null;
  powerSupplyId: string | null;
  cpuCoolerId: string | null;
  keyboardId: string | null;
  mouseId: string | null;
  ramIds: MultiComponentEntry[];
  storageDriveIds: MultiComponentEntry[];
  fanIds: MultiComponentEntry[];
  monitorIds: MultiComponentEntry[];
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
  multiEntries: MultiComponentEntry[];
  onAssign: () => void;
  onRemoveSingle: () => void;
  onRemoveMulti: (id: string) => void;
  onQuantityChange: (id: string, quantity: number) => void;
}

export interface BuildComponent {
  buildcoresId: string;
  name: string;
}
 
export interface BuildMultiEntry {
  id: number;
  ram?: BuildComponent;
  storageDrive?: BuildComponent;
  fan?: BuildComponent;
  monitor?: BuildComponent;
  quantity: number;
}
 
export interface UserBuild {
  id: number;
  name: string;
  cpu?: BuildComponent;
  gpu?: BuildComponent;
  motherboard?: BuildComponent;
  pcCase?: BuildComponent;
  powerSupply?: BuildComponent;
  cpuCooler?: BuildComponent;
  keyboard?: BuildComponent;
  mouse?: BuildComponent;
  rams?: BuildMultiEntry[];
  storageDrives?: BuildMultiEntry[];
  fans?: BuildMultiEntry[];
  monitors?: BuildMultiEntry[];
}

export interface UserBuildWithCount extends UserBuild {
  serverCount: number;
  localDelta: number;
  slotOccupiedBy?: BuildComponent;
  confirmingReplace?: boolean;
}

export interface CompatibilityIssue {
  rule: string;
  severity: 'error' | 'warning' | 'unverifiable';
  message: string;
  components: string[];
}

export interface Props {
  issues: CompatibilityIssue[];
  loading: boolean;
  error: string | null;
}

export type BuildOpStatus = 'idle' | 'loading' | 'error';
export type SingleSlot = keyof Omit<BuildState, 'ramIds' | 'storageDriveIds' | 'fanIds' | 'monitorIds'>;
export type MultiSlot = 'ramIds' | 'storageDriveIds' | 'fanIds' | 'monitorIds';
export type SlotKey = SingleSlot | MultiSlot;
export type AddToBuildStatus = 'idle' | 'in-build' | 'confirm-replace' | 'loading' | 'error';