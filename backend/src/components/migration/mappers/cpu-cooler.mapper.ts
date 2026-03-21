import { str, num, bool, obj, arr } from 'src/components/utils/utils';
import { CpuCooler } from 'src/components/entities/main-entities/cpu-cooler.entity';

export function mapCpuCooler(raw: Record<string, unknown>): CpuCooler {
  const entity = new CpuCooler();

  const meta = obj(raw.metadata);

  entity.buildcoresId = raw.opendb_id as string;
  entity.name = str(meta.name) ?? '';
  entity.manufacturer = str(meta.manufacturer) ?? '';
  entity.series = str(meta.series) ?? str(raw.series) ?? '';
  entity.variant = str(meta.variant) ?? '';
  entity.releaseYear = num(meta.releaseYear) ?? 0;

  entity.minFanRpm = num(raw.min_fan_rpm);
  entity.maxFanRpm = num(raw.max_fan_rpm);
  entity.fanSize = num(raw.fan_size);
  entity.fanQuantity = num(raw.fan_quantity);
  entity.minNoiseLevel = num(raw.min_noise_level);
  entity.maxNoiseLevel = num(raw.max_noise_level);
  entity.height = num(raw.height);
  entity.radiatorSize = num(raw.radiator_size);
  entity.waterCooled = bool(raw.water_cooled);
  entity.fanless = bool(raw.fanless);

  entity.supportedSockets = arr(raw.cpu_sockets) ?? [];

  return entity;
}
