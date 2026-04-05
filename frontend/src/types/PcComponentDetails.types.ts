
export interface AttrDef {
  key: string;
  label: string;
  format?: (v: unknown) => string;
  description?: string;
}

export interface M2SlotData {
  id: number;
  size: string | null;
  key: string | null;
  m2Interface: string | null;
}

export interface PcieSlotData {
  id: number;
  gen: string | null;
  quantity: number | null;
  lanes: number | null;
}