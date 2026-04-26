export interface BuildComponent {
  buildcoresId: string;
  name: string | null;
  manufacturer?: string | null;
  [key: string]: unknown;
}

export interface BuildMultiEntry {
  id: number;
  component: BuildComponent;
  quantity: number;
}

export interface BuildDetail {
  id: number;
  name: string;
  description?: string;
  published: boolean;
  photoUrl?: string;
  createdAt: string;
  username?: string;
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

export interface ComponentRowProps {
  icon: React.ReactNode;
  label: string;
  component: BuildComponent;
  specs: string[];
  endpoint: string;
  quantity?: number;
}