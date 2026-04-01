export interface PcComponent {
  buildcoresId: string;
  name: string | null;
  manufacturer: string | null;
  releaseYear: number | null;
  series: string | null;
  variant: string | null;
  [key: string]: unknown;
}

export interface PcComponentTypeConfig {
  label: string;
  endpoint: string;
  icon: React.ReactNode;
  subtitle: (c: PcComponent) => React.ReactNode;
  sortFields?: SortField[]; 
}

export type SortDirection = 'ASC' | 'DESC' | null;

export interface SortField {
  label: string;
  field: string;
}

export interface ActiveSort {
  field: string;
  direction: SortDirection;
}