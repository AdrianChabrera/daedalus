import { str, num, bool, obj } from 'src/components/utils/utils';
import { Cpu } from '../../entities/main-entities/cpu.entity';

export function mapCpu(raw: Record<string, unknown>): Cpu {
  const entity = new Cpu();

  const meta = obj(raw.metadata);
  const cores = obj(raw.cores);
  const clocks = obj(raw.clocks);
  const clocksPerformance = obj(clocks.performance);
  const cache = obj(raw.cache);
  const specs = obj(raw.specifications);
  const igpu = obj(specs.integratedGraphics);
  const memory = obj(specs.memory);

  entity.buildcoresId = raw.opendb_id as string;
  entity.name = str(meta.name) ?? '';
  entity.manufacturer = str(meta.manufacturer) ?? '';
  entity.series = str(meta.series) ?? str(raw.series) ?? '';
  entity.variant = str(meta.variant) ?? '';
  entity.releaseYear = num(meta.releaseYear) ?? 0;

  entity.microarchitecture = str(raw.microarchitecture);
  entity.coreFamily = str(raw.coreFamily);
  entity.socket = str(raw.socket);

  entity.coreCount = num(cores.total);
  entity.threadCount = num(cores.threads);

  entity.baseClock = num(clocksPerformance.base);
  entity.boostClock = num(clocksPerformance.boost);

  entity.cachel1 = str(cache.l1);
  entity.cachel2 = num(cache.l2);
  entity.cachel3 = num(cache.l3);

  entity.tdp = num(specs.tdp);
  entity.simultaneousMultithreading = bool(specs.simultaneousMultithreading);
  entity.eccSupport = bool(specs.eccSupport);
  entity.includesCooler = bool(specs.includesCooler);
  entity.integratedGraphics = str(igpu.model);

  entity.maxSupportedMemory = num(memory.maxSupport);
  //TODO: añadir supportedMemoryTypes cuando se añadan las RAMs

  return entity;
}
