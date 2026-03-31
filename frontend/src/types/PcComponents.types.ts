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
}