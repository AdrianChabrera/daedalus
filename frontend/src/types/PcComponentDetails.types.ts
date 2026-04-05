
export interface AttrDef {
  key: string;
  label: string;
  format?: (v: unknown) => string;
}