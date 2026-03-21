import { Ram } from 'src/components/entities/main-entities/ram.entity';
import { str, num, bool, obj } from 'src/components/utils/utils';

export function mapRam(raw: Record<string, unknown>): Ram {
  const entity = new Ram();

  const meta = obj(raw.metadata);
  const modules = obj(raw.modules);

  entity.buildcoresId = raw.opendb_id as string;
  entity.name = str(meta.name) ?? '';
  entity.manufacturer = str(meta.manufacturer) ?? '';
  entity.series = str(meta.series) ?? str(raw.series) ?? '';
  entity.variant = str(meta.variant) ?? '';
  entity.releaseYear = num(meta.releaseYear) ?? 0;

  entity.quantity = num(modules.quantity);

  entity.capacity = num(raw.capacity) ?? null;
  entity.speed = num(raw.speed) ?? null;
  entity.formFactor = str(raw.form_factor) ?? '';
  entity.casLatency = num(raw.cas_latency) ?? null;
  entity.voltage = num(raw.voltage) ?? null;
  entity.ecc = bool(raw.ecc) ?? null;
  entity.heatSpreader = bool(raw.heat_spreader) ?? null;
  entity.rgb = bool(raw.rgb) ?? null;
  entity.type = str(raw.ram_type);

  return entity;
}
