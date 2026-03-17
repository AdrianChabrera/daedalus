import { str, num, bool, obj } from 'src/components/utils/utils';
import { Storage } from '../../entities/main-entities/storage.entity';

export function mapStorage(raw: Record<string, unknown>): Storage {
  const entity = new Storage();

  const meta = obj(raw.metadata);

  entity.buildcoresId = raw.opendb_id as string;
  entity.name = str(meta.name) ?? '';
  entity.manufacturer = str(meta.manufacturer) ?? '';
  entity.series = str(meta.series) ?? str(raw.series) ?? '';
  entity.variant = str(meta.variant) ?? '';
  entity.releaseYear = num(meta.releaseYear) ?? 0;

  entity.capacity = num(raw.capacity);
  entity.type = str(raw.storage_type);
  entity.formFactor = str(raw.form_factor);
  entity.interface = str(raw.interface);
  entity.nvme = bool(raw.nvme);

  return entity;
}
