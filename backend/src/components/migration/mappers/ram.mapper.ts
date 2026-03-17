import { Ram } from 'src/components/entities/main-entities/ram.entity';
import { RamType } from 'src/components/entities/secondary-entities/ram-type.entity';
import { str, num, bool, obj } from 'src/components/utils/utils';
import { DataSource, Repository } from 'typeorm';

async function findOrCreateRamType(
  name: string,
  ramTypeRepository: Repository<RamType>,
): Promise<RamType> {
  const existing = await ramTypeRepository.findOneBy({ name });
  if (existing) return existing;
  return ramTypeRepository.save(ramTypeRepository.create({ name }));
}

export async function mapRam(
  raw: Record<string, unknown>,
  dataSource: DataSource,
): Promise<Ram> {
  const entity = new Ram();

  const ramTypeRepository = dataSource.getRepository(RamType);

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

  const ramTypeName = str(raw.ram_type);
  entity.ramType = ramTypeName
    ? await findOrCreateRamType(ramTypeName, ramTypeRepository)
    : null;

  return entity;
}
