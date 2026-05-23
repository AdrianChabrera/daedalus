import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request, { Response } from 'supertest';
import { createTestApp, closeTestApp } from '../test-app';
import { Cpu } from '../../src/components/entities/main-entities/cpu.entity';
import { Gpu } from '../../src/components/entities/main-entities/gpu.entity';
import { Ram } from '../../src/components/entities/main-entities/ram.entity';
import { Motherboard } from '../../src/components/entities/main-entities/motherboard.entity';
import { StorageDrive } from '../../src/components/entities/main-entities/storage-drive.entity';
import { PcCase } from '../../src/components/entities/main-entities/pc-case.entity';
import { CpuCooler } from '../../src/components/entities/main-entities/cpu-cooler.entity';
import { PowerSupply } from '../../src/components/entities/main-entities/power-supply.entity';
import { Fan } from '../../src/components/entities/main-entities/fan.entity';
import { Monitor } from '../../src/components/entities/main-entities/monitor.entity';
import { Keyboard } from '../../src/components/entities/main-entities/keyboard.entity';
import { Mouse } from '../../src/components/entities/main-entities/mouse.entity';
import { App } from 'supertest/types';

const IDS = {
  cpu1: '3f6c1e2a-4b5d-4a1e-8c2f-1a2b3c4d5e6f',
  cpu2: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  gpu1: 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5',
  gpu2: 'b2c3d4e5-f6a7-4b8c-9d0e-f1a2b3c4d5e6',
  ram1: 'e5f6a7b8-c9d0-4e1f-8a2b-3c4d5e6f7a8b',
  ram2: 'f6a7b8c9-d0e1-4f2a-9b3c-4d5e6f7a8b9c',
  motherboard: 'c3d4e5f6-a7b8-4c9d-ae0f-1a2b3c4d5e6f',
  storageDrive: 'd4e5f6a7-b8c9-4d0e-bf1a-2b3c4d5e6f7a',
  pcCase: '7a8b9c0d-1e2f-4a3b-9c4d-5e6f7a8b9c0d',
  cpuCooler: 'b8c9d0e1-f2a3-4b4c-9d5e-6f7a8b9c0d1e',
  powerSupply: 'c9d0e1f2-a3b4-4c5d-ae6f-7a8b9c0d1e2f',
  fan: 'd0e1f2a3-b4c5-4d6e-bf7a-8b9c0d1e2f3a',
  monitor: 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b',
  keyboard: 'f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c',
  mouse: 'a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d',
};

async function seedCpus(app: INestApplication): Promise<void> {
  const cpuRepo = app.get<Repository<Cpu>>(getRepositoryToken(Cpu));
  await cpuRepo.save([
    Object.assign(new Cpu(), {
      buildcoresId: IDS.cpu1,
      name: 'AMD Ryzen 9 5900X',
      manufacturer: 'AMD',
      socket: 'AM4',
      coreCount: 12,
      threadCount: 24,
      tdp: 105,
      includesCooler: false,
      integratedGraphics: 'None',
      eccSupport: false,
      supportedMemoryTypes: ['DDR4'],
    }),
    Object.assign(new Cpu(), {
      buildcoresId: IDS.cpu2,
      name: 'Intel Core i9-12900K',
      manufacturer: 'Intel',
      socket: 'LGA1700',
      coreCount: 16,
      threadCount: 24,
      tdp: 125,
      includesCooler: false,
      integratedGraphics: 'Intel UHD 770',
      eccSupport: false,
      supportedMemoryTypes: ['DDR5'],
    }),
  ]);
}

async function seedGpus(app: INestApplication): Promise<void> {
  const gpuRepo = app.get<Repository<Gpu>>(getRepositoryToken(Gpu));
  await gpuRepo.save([
    Object.assign(new Gpu(), {
      buildcoresId: IDS.gpu1,
      name: 'NVIDIA RTX 4090',
      manufacturer: 'NVIDIA',
      memory: 24,
      tdp: 450,
      length: 336,
    }),
    Object.assign(new Gpu(), {
      buildcoresId: IDS.gpu2,
      name: 'AMD RX 7900 XTX',
      manufacturer: 'AMD',
      memory: 24,
      tdp: 355,
      length: 287,
    }),
  ]);
}

async function seedRams(app: INestApplication): Promise<void> {
  const ramRepo = app.get<Repository<Ram>>(getRepositoryToken(Ram));
  await ramRepo.save([
    Object.assign(new Ram(), {
      buildcoresId: IDS.ram1,
      name: 'Corsair Vengeance DDR5 32GB',
      manufacturer: 'Corsair',
      capacity: 32,
      speed: 5600,
      memoryType: 'DDR5',
      formFactor: 'DIMM',
    }),
    Object.assign(new Ram(), {
      buildcoresId: IDS.ram2,
      name: 'Kingston Fury DDR4 16GB',
      manufacturer: 'Kingston',
      capacity: 16,
      speed: 3200,
      memoryType: 'DDR4',
      formFactor: 'DIMM',
    }),
  ]);
}

async function seedAllComponents(app: INestApplication): Promise<void> {
  await seedCpus(app);
  await seedGpus(app);
  await seedRams(app);

  const mbRepo = app.get<Repository<Motherboard>>(
    getRepositoryToken(Motherboard),
  );
  await mbRepo.save(
    Object.assign(new Motherboard(), {
      buildcoresId: IDS.motherboard,
      name: 'ASUS ROG Strix X570-E',
      manufacturer: 'ASUS',
      socket: 'AM4',
      ramType: 'DDR4',
      formFactor: 'ATX',
      memorySlots: 4,
      maxMemory: 128,
    }),
  );

  const storageRepo = app.get<Repository<StorageDrive>>(
    getRepositoryToken(StorageDrive),
  );
  await storageRepo.save(
    Object.assign(new StorageDrive(), {
      buildcoresId: IDS.storageDrive,
      name: 'Samsung 980 Pro 1TB',
      manufacturer: 'Samsung',
      capacity: 1000,
      formFactor: 'M.2 2280',
      storageInterface: 'M.2 PCIe 4.0 x4',
    }),
  );

  const caseRepo = app.get<Repository<PcCase>>(getRepositoryToken(PcCase));
  await caseRepo.save(
    Object.assign(new PcCase(), {
      buildcoresId: IDS.pcCase,
      name: 'Fractal Design Meshify 2',
      manufacturer: 'Fractal Design',
      formFactor: 'ATX',
      powerSupply: 'None',
    }),
  );

  const coolerRepo = app.get<Repository<CpuCooler>>(
    getRepositoryToken(CpuCooler),
  );
  await coolerRepo.save(
    Object.assign(new CpuCooler(), {
      buildcoresId: IDS.cpuCooler,
      name: 'Noctua NH-D15',
      manufacturer: 'Noctua',
      waterCooled: false,
      height: 165,
    }),
  );

  const psuRepo = app.get<Repository<PowerSupply>>(
    getRepositoryToken(PowerSupply),
  );
  await psuRepo.save(
    Object.assign(new PowerSupply(), {
      buildcoresId: IDS.powerSupply,
      name: 'Corsair RM850x',
      manufacturer: 'Corsair',
      wattage: 850,
    }),
  );

  const fanRepo = app.get<Repository<Fan>>(getRepositoryToken(Fan));
  await fanRepo.save(
    Object.assign(new Fan(), {
      buildcoresId: IDS.fan,
      name: 'Noctua NF-A12x25',
      manufacturer: 'Noctua',
      size: 120,
    }),
  );

  const monitorRepo = app.get<Repository<Monitor>>(getRepositoryToken(Monitor));
  await monitorRepo.save(
    Object.assign(new Monitor(), {
      buildcoresId: IDS.monitor,
      name: 'LG 27GP950-B',
      manufacturer: 'LG',
      screenSize: 27,
      refreshRate: 160,
    }),
  );

  const keyboardRepo = app.get<Repository<Keyboard>>(
    getRepositoryToken(Keyboard),
  );
  await keyboardRepo.save(
    Object.assign(new Keyboard(), {
      buildcoresId: IDS.keyboard,
      name: 'Logitech G915',
      manufacturer: 'Logitech',
    }),
  );

  const mouseRepo = app.get<Repository<Mouse>>(getRepositoryToken(Mouse));
  await mouseRepo.save(
    Object.assign(new Mouse(), {
      buildcoresId: IDS.mouse,
      name: 'Logitech G Pro X Superlight',
      manufacturer: 'Logitech',
    }),
  );
}

describe('Components (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await seedAllComponents(app);
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('GET /components/count', () => {
    it('returns a number with the total count of components across all types', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/count')
        .expect(200);

      const count = parseInt(String(res.text), 10);
      expect(Number.isFinite(count)).toBe(true);
      expect(count).toBeGreaterThanOrEqual(10);
    });
  });

  describe('GET /components/:componentType', () => {
    it('returns a paginated list of CPUs', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/cpu')
        .expect(200);

      const body = res.body as {
        data: unknown[];
        total: number;
        page: number;
        limit: number;
      };
      expect(body.data).toBeDefined();
      expect(body.total).toBeGreaterThanOrEqual(2);
      expect(body.page).toBe(1);
      expect(body.limit).toBe(16);
    });

    it('returns a paginated list of GPUs', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/gpu')
        .expect(200);

      const body = res.body as { data: unknown[]; total: number };
      expect(body.data).toBeDefined();
      expect(body.total).toBeGreaterThanOrEqual(2);
    });

    it('returns a paginated list of RAMs', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/ram')
        .expect(200);

      const body = res.body as { data: unknown[]; total: number };
      expect(body.total).toBeGreaterThanOrEqual(2);
    });

    it('respects the page query param', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/cpu?page=1&limit=1')
        .expect(200);

      const body = res.body as { data: unknown[]; page: number; limit: number };
      expect(body.data).toHaveLength(1);
      expect(body.page).toBe(1);
      expect(body.limit).toBe(1);
    });

    it('returns an empty data array when page exceeds total results', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/cpu?page=999&limit=16')
        .expect(200);

      const body = res.body as { data: unknown[] };
      expect(body.data).toHaveLength(0);
    });

    it('orders CPUs by name ASC by default', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/cpu?order=name-ASC')
        .expect(200);

      const body = res.body as { data: { name: string }[] };
      const names = body.data.map((c) => c.name);
      expect(names).toEqual([...names].sort());
    });

    it('orders CPUs by name DESC', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/cpu?order=name-DESC')
        .expect(200);

      const body = res.body as { data: { name: string }[] };
      const names = body.data.map((c) => c.name);
      expect(names).toEqual([...names].sort().reverse());
    });

    it('does not apply similarity when search term is blank (returns all CPUs)', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/cpu?search=')
        .expect(200);

      const body = res.body as { data: unknown[]; total: number };
      expect(body.total).toBeGreaterThanOrEqual(2);
    });

    it('filters CPUs by a range filter (minCoreCount)', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/cpu?minCoreCount=14')
        .expect(200);

      const body = res.body as { data: { coreCount: number }[] };
      body.data.forEach((cpu) => {
        expect(cpu.coreCount).toBeGreaterThanOrEqual(14);
      });
    });

    it('filters CPUs by a range filter (maxCoreCount)', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/cpu?maxCoreCount=12')
        .expect(200);

      const body = res.body as { data: { coreCount: number }[] };
      body.data.forEach((cpu) => {
        expect(cpu.coreCount).toBeLessThanOrEqual(12);
      });
    });

    it('filters CPUs by a min-max range filter (coreCount)', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/cpu?minCoreCount=12&maxCoreCount=14')
        .expect(200);

      const body = res.body as { data: { coreCount: number }[] };
      body.data.forEach((cpu) => {
        expect(cpu.coreCount).toBeGreaterThanOrEqual(12);
        expect(cpu.coreCount).toBeLessThanOrEqual(14);
      });
    });

    it('filters CPUs by a multi-string filter (socket)', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/cpu?socket=AM4')
        .expect(200);

      const body = res.body as { data: { socket: string }[] };
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      body.data.forEach((cpu) => {
        expect(cpu.socket).toBe('AM4');
      });
    });

    it('filters CPUs by multiple socket values (pipe-separated)', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/cpu?socket=AM4|LGA1700')
        .expect(200);

      const body = res.body as { data: { socket: string }[]; total: number };
      expect(body.total).toBeGreaterThanOrEqual(2);
      body.data.forEach((cpu) => {
        expect(['AM4', 'LGA1700']).toContain(cpu.socket);
      });
    });

    it('filters CPUs by a boolean filter (eccSupport)', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/cpu?eccSupport=false')
        .expect(200);

      const body = res.body as { data: { eccSupport: boolean }[] };
      body.data.forEach((cpu) => {
        expect(cpu.eccSupport).toBe(false);
      });
    });

    it('returns 400 for an unknown filter param', async () => {
      await request(app.getHttpServer() as App)
        .get('/components/cpu?unknownFilter=value')
        .expect(400);
    });

    it('returns 400 for a range filter on a non-range field', async () => {
      await request(app.getHttpServer() as App)
        .get('/components/cpu?minSocket=AM4')
        .expect(400);
    });

    it('returns 400 for a range filter value that is not a number', async () => {
      await request(app.getHttpServer() as App)
        .get('/components/cpu?minCoreCount=notanumber')
        .expect(400);
    });

    it('returns 400 for a boolean filter with an invalid value', async () => {
      await request(app.getHttpServer() as App)
        .get('/components/cpu?eccSupport=yes')
        .expect(400);
    });

    it('works for all supported component types', async () => {
      const types = [
        'cpu',
        'gpu',
        'ram',
        'motherboard',
        'storage-drive',
        'pc-case',
        'cpu-cooler',
        'power-supply',
        'fan',
        'monitor',
        'keyboard',
        'mouse',
      ];

      for (const type of types) {
        await request(app.getHttpServer() as App)
          .get(`/components/${type}`)
          .expect(200);
      }
    });

    it('is case-insensitive for the component type param (CPU vs cpu)', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/CPU')
        .expect(200);

      const body = res.body as { data: unknown[] };
      expect(body.data).toBeDefined();
    });

    it('orders GPUs by memory DESC', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/gpu?order=memory-DESC')
        .expect(200);

      const body = res.body as { data: { memory: number }[] };
      const memories = body.data.map((g) => g.memory);
      for (let i = 1; i < memories.length; i++) {
        expect(memories[i - 1]).toBeGreaterThanOrEqual(memories[i]);
      }
    });

    it('filters RAMs by memoryType multi-string', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/ram?memoryType=DDR5')
        .expect(200);

      const body = res.body as { data: { memoryType: string }[] };
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      body.data.forEach((ram) => {
        expect(ram.memoryType).toBe('DDR5');
      });
    });
  });

  describe('GET /components/:componentType/filters', () => {
    it('returns filter metadata for CPUs', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/cpu/filters')
        .expect(200);

      const body = res.body as Record<string, { type: string }>;
      expect(body.coreCount).toBeDefined();
      expect(body.coreCount.type).toBe('range');
      expect(body.socket).toBeDefined();
      expect(body.socket.type).toBe('multi-string');
      expect(body.eccSupport).toBeDefined();
      expect(body.eccSupport.type).toBe('boolean');
    });

    it('returns filter metadata for GPUs', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/gpu/filters')
        .expect(200);

      const body = res.body as Record<string, { type: string }>;
      expect(body.memory).toBeDefined();
      expect(body.memory.type).toBe('range');
      expect(body.manufacturer).toBeDefined();
      expect(body.manufacturer.type).toBe('multi-string');
    });

    it('returns min and max values for a range filter', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/cpu/filters')
        .expect(200);

      const body = res.body as Record<
        string,
        { type: string; min: number; max: number }
      >;
      expect(body.coreCount.min).toBe(12);
      expect(body.coreCount.max).toBe(16);
    });

    it('returns distinct values for a multi-string filter', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get('/components/cpu/filters')
        .expect(200);

      const body = res.body as Record<
        string,
        { type: string; values: string[] }
      >;
      expect(body.socket.values).toContain('AM4');
      expect(body.socket.values).toContain('LGA1700');
    });

    it('returns filter metadata for all supported component types', async () => {
      const types = [
        'cpu',
        'gpu',
        'ram',
        'motherboard',
        'storage-drive',
        'pc-case',
        'cpu-cooler',
        'power-supply',
        'fan',
        'monitor',
        'keyboard',
        'mouse',
      ];

      for (const type of types) {
        await request(app.getHttpServer() as App)
          .get(`/components/${type}/filters`)
          .expect(200);
      }
    });
  });

  describe('GET /components/:componentType/:id', () => {
    it('returns a CPU by its UUID', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get(`/components/cpu/${IDS.cpu1}`)
        .expect(200);

      const body = res.body as { buildcoresId: string; name: string };
      expect(body.buildcoresId).toBe(IDS.cpu1);
      expect(body.name).toBe('AMD Ryzen 9 5900X');
    });

    it('returns a GPU by its UUID', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get(`/components/gpu/${IDS.gpu1}`)
        .expect(200);

      const body = res.body as { buildcoresId: string; name: string };
      expect(body.buildcoresId).toBe(IDS.gpu1);
      expect(body.name).toBe('NVIDIA RTX 4090');
    });

    it('returns a RAM by its UUID', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get(`/components/ram/${IDS.ram1}`)
        .expect(200);

      const body = res.body as { buildcoresId: string; name: string };
      expect(body.buildcoresId).toBe(IDS.ram1);
      expect(body.name).toBe('Corsair Vengeance DDR5 32GB');
    });

    it('returns a Motherboard by its UUID', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get(`/components/motherboard/${IDS.motherboard}`)
        .expect(200);

      const body = res.body as { buildcoresId: string; name: string };
      expect(body.buildcoresId).toBe(IDS.motherboard);
    });

    it('returns a StorageDrive by its UUID', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get(`/components/storage-drive/${IDS.storageDrive}`)
        .expect(200);

      const body = res.body as { buildcoresId: string; name: string };
      expect(body.buildcoresId).toBe(IDS.storageDrive);
    });

    it('returns a PcCase by its UUID', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get(`/components/pc-case/${IDS.pcCase}`)
        .expect(200);

      const body = res.body as { buildcoresId: string };
      expect(body.buildcoresId).toBe(IDS.pcCase);
    });

    it('returns a CpuCooler by its UUID', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get(`/components/cpu-cooler/${IDS.cpuCooler}`)
        .expect(200);

      const body = res.body as { buildcoresId: string };
      expect(body.buildcoresId).toBe(IDS.cpuCooler);
    });

    it('returns a PowerSupply by its UUID', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get(`/components/power-supply/${IDS.powerSupply}`)
        .expect(200);

      const body = res.body as { buildcoresId: string };
      expect(body.buildcoresId).toBe(IDS.powerSupply);
    });

    it('returns a Fan by its UUID', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get(`/components/fan/${IDS.fan}`)
        .expect(200);

      const body = res.body as { buildcoresId: string };
      expect(body.buildcoresId).toBe(IDS.fan);
    });

    it('returns a Monitor by its UUID', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get(`/components/monitor/${IDS.monitor}`)
        .expect(200);

      const body = res.body as { buildcoresId: string };
      expect(body.buildcoresId).toBe(IDS.monitor);
    });

    it('returns a Keyboard by its UUID', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get(`/components/keyboard/${IDS.keyboard}`)
        .expect(200);

      const body = res.body as { buildcoresId: string };
      expect(body.buildcoresId).toBe(IDS.keyboard);
    });

    it('returns a Mouse by its UUID', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get(`/components/mouse/${IDS.mouse}`)
        .expect(200);

      const body = res.body as { buildcoresId: string };
      expect(body.buildcoresId).toBe(IDS.mouse);
    });

    it('returns 404 when the component does not exist', async () => {
      await request(app.getHttpServer() as App)
        .get('/components/cpu/00000000-0000-4000-8000-000000000000')
        .expect(404);
    });

    it('returns 400 when the UUID is invalid', async () => {
      await request(app.getHttpServer() as App)
        .get('/components/cpu/not-a-valid-uuid')
        .expect(400);
    });

    it('returns 404 when looking for a component under the wrong type', async () => {
      await request(app.getHttpServer() as App)
        .get(`/components/gpu/${IDS.cpu1}`)
        .expect(404);
    });

    it('includes m2Slots and pcieSlots relations for motherboards', async () => {
      const res: Response = await request(app.getHttpServer() as App)
        .get(`/components/motherboard/${IDS.motherboard}`)
        .expect(200);

      const body = res.body as { m2Slots: unknown[]; pcieSlots: unknown[] };
      expect(Array.isArray(body.m2Slots)).toBe(true);
      expect(Array.isArray(body.pcieSlots)).toBe(true);
    });
  });
});
