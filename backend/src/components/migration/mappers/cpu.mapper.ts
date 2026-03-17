import { str, num, bool, obj } from 'src/components/utils/utils';
import { Cpu } from '../../entities/main-entities/cpu.entity';
import { Socket } from '../../entities/secondary-entities/socket.entity';
import { DataSource, Repository } from 'typeorm';

async function findOrCreateSocket(
  name: string,
  socketRepository: Repository<Socket>,
): Promise<Socket> {
  const existing = await socketRepository.findOneBy({ name });
  if (existing) return existing;
  return socketRepository.save(socketRepository.create({ name }));
}

export async function mapCpu(
  raw: Record<string, unknown>,
  dataSource: DataSource,
): Promise<Cpu> {
  const entity = new Cpu();

  const socketRepository = dataSource.getRepository(Socket);

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

  const socketName = str(raw.socket);
  entity.socket = socketName
    ? await findOrCreateSocket(socketName, socketRepository)
    : null;

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

  entity.specs = raw as object;

  return entity;
}
