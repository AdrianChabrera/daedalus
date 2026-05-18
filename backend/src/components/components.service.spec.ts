import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SelectQueryBuilder } from 'typeorm';

import { ComponentsService } from './components.service';
import { PcCase } from './entities/main-entities/pc-case.entity';
import { CpuCooler } from './entities/main-entities/cpu-cooler.entity';
import { Cpu } from './entities/main-entities/cpu.entity';
import { Fan } from './entities/main-entities/fan.entity';
import { Gpu } from './entities/main-entities/gpu.entity';
import { Keyboard } from './entities/main-entities/keyboard.entity';
import { Monitor } from './entities/main-entities/monitor.entity';
import { Motherboard } from './entities/main-entities/motherboard.entity';
import { Mouse } from './entities/main-entities/mouse.entity';
import { PowerSupply } from './entities/main-entities/power-supply.entity';
import { Ram } from './entities/main-entities/ram.entity';
import { StorageDrive } from './entities/main-entities/storage.entity';
import { ParsedFilters } from './interfaces/pc-components.interfaces';

const EMPTY_FILTERS: ParsedFilters = {
  ranges: {},
  multiStrings: {},
  booleans: {},
};

function makeQbMock(
  overrides: Partial<SelectQueryBuilder<any>> = {},
): jest.Mocked<SelectQueryBuilder<any>> {
  const qb = {
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getRawOne: jest.fn().mockResolvedValue({ min: null, max: null }),
    getRawMany: jest.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as jest.Mocked<SelectQueryBuilder<any>>;

  return qb;
}

function makeRepoMock(qbOverrides?: Partial<SelectQueryBuilder<any>>) {
  const qb = makeQbMock(qbOverrides);
  return {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    _qb: qb,
  };
}

const ALL_ENTITIES = [
  PcCase,
  CpuCooler,
  Cpu,
  Fan,
  Gpu,
  Keyboard,
  Monitor,
  Motherboard,
  Mouse,
  PowerSupply,
  Ram,
  StorageDrive,
];

async function buildModule(
  repoOverrides: Record<string, ReturnType<typeof makeRepoMock>> = {},
) {
  const defaultRepo = () => makeRepoMock();

  const providers = ALL_ENTITIES.map((Entity) => ({
    provide: getRepositoryToken(Entity),
    useValue: repoOverrides[Entity.name] ?? defaultRepo(),
  }));

  const module: TestingModule = await Test.createTestingModule({
    providers: [ComponentsService, ...providers],
  }).compile();

  return {
    service: module.get<ComponentsService>(ComponentsService),
    repos: Object.fromEntries(
      ALL_ENTITIES.map((E) => [E.name, module.get(getRepositoryToken(E))]),
    ),
  };
}

describe('ComponentsService', () => {
  describe('findComponentById()', () => {
    it('returns the component if it exists', async () => {
      const fakeCpu = { buildcoresId: 'uuid-1', name: 'Ryzen 5 5600X' };
      const cpuRepo = makeRepoMock();
      cpuRepo.findOne.mockResolvedValue(fakeCpu);

      const { service } = await buildModule({ Cpu: cpuRepo });
      const result = await service.findComponentById('cpu', 'uuid-1');

      expect(result).toEqual(fakeCpu);
      expect(cpuRepo.findOne).toHaveBeenCalledWith({
        where: { buildcoresId: 'uuid-1' },
        relations: [],
      });
    });

    it('loads m2Slots and pcieSlots relations for motherboard', async () => {
      const fakeMobo = { buildcoresId: 'uuid-mb' };
      const moboRepo = makeRepoMock();
      moboRepo.findOne.mockResolvedValue(fakeMobo);

      const { service } = await buildModule({ Motherboard: moboRepo });
      await service.findComponentById('motherboard', 'uuid-mb');

      expect(moboRepo.findOne).toHaveBeenCalledWith({
        where: { buildcoresId: 'uuid-mb' },
        relations: ['m2Slots', 'pcieSlots'],
      });
    });

    it('throws NotFoundException if the component does not exist', async () => {
      const cpuRepo = makeRepoMock();
      cpuRepo.findOne.mockResolvedValue(null);

      const { service } = await buildModule({ Cpu: cpuRepo });

      await expect(
        service.findComponentById('cpu', 'not-found'),
      ).rejects.toThrow(NotFoundException);
    });

    it('is case-insensitive for the component type', async () => {
      const fakeGpu = { buildcoresId: 'gpu-1' };
      const gpuRepo = makeRepoMock();
      gpuRepo.findOne.mockResolvedValue(fakeGpu);

      const { service } = await buildModule({ Gpu: gpuRepo });
      const result = await service.findComponentById('GPU', 'gpu-1');

      expect(result).toEqual(fakeGpu);
    });
  });

  describe('findAllComponents()', () => {
    it('returns the paginated result correctly', async () => {
      const fakeData = [{ buildcoresId: 'r-1' }, { buildcoresId: 'r-2' }];
      const ramRepo = makeRepoMock();
      ramRepo._qb.getManyAndCount.mockResolvedValue([fakeData, 2]);

      const { service } = await buildModule({ Ram: ramRepo });
      const result = await service.findAllComponents(
        'ram',
        1,
        16,
        EMPTY_FILTERS,
      );

      expect(result).toEqual({ data: fakeData, total: 2, page: 1, limit: 16 });
    });

    it('applies the correct skip based on the page number', async () => {
      const ramRepo = makeRepoMock();
      const { service } = await buildModule({ Ram: ramRepo });

      await service.findAllComponents('ram', 3, 16, EMPTY_FILTERS);

      expect(ramRepo._qb.skip).toHaveBeenCalledWith(32);
    });

    it('throws BadRequestException for an invalid component type', async () => {
      const { service } = await buildModule();

      await expect(
        service.findAllComponents('nonexistent', 1, 16, EMPTY_FILTERS),
      ).rejects.toThrow(BadRequestException);
    });

    it('sorts by the provided field and direction', async () => {
      const gpuRepo = makeRepoMock();
      const { service } = await buildModule({ Gpu: gpuRepo });

      await service.findAllComponents(
        'gpu',
        1,
        16,
        EMPTY_FILTERS,
        'memory-DESC',
      );

      expect(gpuRepo._qb.orderBy).toHaveBeenCalledWith(
        expect.stringContaining('memory'),
        'ASC',
      );

      expect(gpuRepo._qb.addOrderBy).toHaveBeenCalledWith(
        expect.stringContaining('memory'),
        'DESC',
      );
    });

    it('uses similarity when a search term is provided', async () => {
      const cpuRepo = makeRepoMock();
      const { service } = await buildModule({ Cpu: cpuRepo });

      await service.findAllComponents(
        'cpu',
        1,
        16,
        EMPTY_FILTERS,
        'name-ASC',
        'Ryzen',
      );

      expect(cpuRepo._qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('similarity'),
        expect.objectContaining({ search: 'Ryzen', threshold: 0.1 }),
      );
    });

    it('trims whitespace from the search term', async () => {
      const cpuRepo = makeRepoMock();
      const { service } = await buildModule({ Cpu: cpuRepo });

      await service.findAllComponents(
        'cpu',
        1,
        16,
        EMPTY_FILTERS,
        'name-ASC',
        '  Ryzen  ',
      );

      expect(cpuRepo._qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('similarity'),
        expect.objectContaining({ search: 'Ryzen' }),
      );
    });

    it('does not apply similarity if the search term is blank', async () => {
      const cpuRepo = makeRepoMock();
      const { service } = await buildModule({ Cpu: cpuRepo });

      await service.findAllComponents(
        'cpu',
        1,
        16,
        EMPTY_FILTERS,
        'name-ASC',
        '   ',
      );

      const similarityCall: unknown = (
        cpuRepo._qb.andWhere.mock.calls as unknown[]
      ).find(
        (c): c is unknown[] =>
          Array.isArray(c) &&
          typeof (c as unknown[])[0] === 'string' &&
          ((c as unknown[])[0] as string).includes('similarity'),
      );
      expect(similarityCall).toBeUndefined();
    });

    it('propagates BadRequestException if the QueryBuilder throws an error', async () => {
      const fanRepo = makeRepoMock();
      fanRepo._qb.getManyAndCount.mockRejectedValue(new Error('DB error'));

      const { service } = await buildModule({ Fan: fanRepo });

      await expect(
        service.findAllComponents('fan', 1, 16, EMPTY_FILTERS),
      ).rejects.toThrow(BadRequestException);
    });

    it('applies a range filter with min and max', async () => {
      const gpuRepo = makeRepoMock();
      const { service } = await buildModule({ Gpu: gpuRepo });

      const filters: ParsedFilters = {
        ranges: { memory: { min: 4, max: 16 } },
        multiStrings: {},
        booleans: {},
      };

      await service.findAllComponents('gpu', 1, 16, filters);

      const calls: any[][] = gpuRepo._qb.andWhere.mock.calls as any[][];
      const rangeCall = calls.find(
        (c: any[]) => typeof c[0] === 'string' && c[0].includes('BETWEEN'),
      );
      expect(rangeCall).toBeDefined();
      expect(rangeCall![1]).toMatchObject({ p0: 4, p1: 16 });
    });

    it('applies a range filter with min only', async () => {
      const gpuRepo = makeRepoMock();
      const { service } = await buildModule({ Gpu: gpuRepo });

      const filters: ParsedFilters = {
        ranges: { memory: { min: 8 } },
        multiStrings: {},
        booleans: {},
      };

      await service.findAllComponents('gpu', 1, 16, filters);

      const calls: any[][] = gpuRepo._qb.andWhere.mock.calls as any[][];
      const minCall = calls.find(
        (c: any[]) => typeof c[0] === 'string' && c[0].includes('>='),
      );
      expect(minCall).toBeDefined();
    });

    it('applies a range filter with max only', async () => {
      const gpuRepo = makeRepoMock();
      const { service } = await buildModule({ Gpu: gpuRepo });

      const filters: ParsedFilters = {
        ranges: { memory: { max: 16 } },
        multiStrings: {},
        booleans: {},
      };

      await service.findAllComponents('gpu', 1, 16, filters);

      const calls: any[][] = gpuRepo._qb.andWhere.mock.calls as any[][];
      const maxCall = calls.find(
        (c: any[]) => typeof c[0] === 'string' && c[0].includes('<='),
      );
      expect(maxCall).toBeDefined();
    });

    it('applies a multi-string filter with values', async () => {
      const cpuRepo = makeRepoMock();
      const { service } = await buildModule({ Cpu: cpuRepo });

      const filters: ParsedFilters = {
        ranges: {},
        multiStrings: { socket: ['AM5', 'LGA1700'] },
        booleans: {},
      };

      await service.findAllComponents('cpu', 1, 16, filters);

      const calls: any[][] = cpuRepo._qb.andWhere.mock.calls as any[][];
      const inCall = calls.find(
        (c: any[]) => typeof c[0] === 'string' && c[0].includes('IN'),
      );
      expect(inCall).toBeDefined();
      expect(
        Object.values((inCall as unknown[])[1] as Record<string, unknown>)[0],
      ).toEqual(['AM5', 'LGA1700']);
    });

    it('ignores a multi-string filter if the array is empty', async () => {
      const cpuRepo = makeRepoMock();
      const { service } = await buildModule({ Cpu: cpuRepo });

      const filters: ParsedFilters = {
        ranges: {},
        multiStrings: { socket: [] },
        booleans: {},
      };

      await service.findAllComponents('cpu', 1, 16, filters);

      const inCall: unknown = (
        cpuRepo._qb.andWhere.mock.calls as unknown[]
      ).find(
        (c): c is unknown[] =>
          Array.isArray(c) &&
          typeof (c as unknown[])[0] === 'string' &&
          ((c as unknown[])[0] as string).includes('IN'),
      );
      expect(inCall).toBeUndefined();
    });

    it('applies a boolean filter', async () => {
      const ramRepo = makeRepoMock();
      const { service } = await buildModule({ Ram: ramRepo });

      const filters: ParsedFilters = {
        ranges: {},
        multiStrings: {},
        booleans: { heatSpreader: true },
      };

      await service.findAllComponents('ram', 1, 16, filters);

      const calls: any[][] = ramRepo._qb.andWhere.mock.calls as any[][];
      const boolCall = calls.find(
        (c: any[]) =>
          typeof c[0] === 'string' && c[0].includes('heat_spreader'),
      );
      expect(boolCall).toBeDefined();
      expect(
        Object.values((boolCall as unknown[])[1] as Record<string, unknown>)[0],
      ).toBe(true);
    });

    it('ignores unknown filters not present in the schema', async () => {
      const cpuRepo = makeRepoMock();
      const { service } = await buildModule({ Cpu: cpuRepo });

      const filters: ParsedFilters = {
        ranges: { unknownField: { min: 1, max: 10 } },
        multiStrings: { anotherUnknown: ['x'] },
        booleans: { yetAnother: true },
      };

      await expect(
        service.findAllComponents('cpu', 1, 16, filters),
      ).resolves.toBeDefined();
    });

    describe('order by rating', () => {
      it('performs a leftJoin with the reviews subquery when ordering by rating', async () => {
        const gpuRepo = makeRepoMock();
        const { service } = await buildModule({ Gpu: gpuRepo });

        await service.findAllComponents(
          'gpu',
          1,
          16,
          EMPTY_FILTERS,
          'rating-DESC',
        );

        expect(gpuRepo._qb.leftJoin).toHaveBeenCalled();
      });

      it('adds avg_rating select when ordering by rating', async () => {
        const gpuRepo = makeRepoMock();
        const { service } = await buildModule({ Gpu: gpuRepo });

        await service.findAllComponents(
          'gpu',
          1,
          16,
          EMPTY_FILTERS,
          'rating-DESC',
        );

        expect(gpuRepo._qb.addSelect).toHaveBeenCalledWith(
          expect.stringContaining('avg_rating'),
          'avg_rating',
        );
      });

      it('orders by avg_rating DESC when direction is DESC', async () => {
        const gpuRepo = makeRepoMock();
        const { service } = await buildModule({ Gpu: gpuRepo });

        await service.findAllComponents(
          'gpu',
          1,
          16,
          EMPTY_FILTERS,
          'rating-DESC',
        );

        expect(gpuRepo._qb.orderBy).toHaveBeenCalledWith(
          'avg_rating',
          'DESC',
          'NULLS LAST',
        );
      });

      it('orders by avg_rating ASC with NULLS LAST when direction is ASC', async () => {
        const gpuRepo = makeRepoMock();
        const { service } = await buildModule({ Gpu: gpuRepo });

        await service.findAllComponents(
          'gpu',
          1,
          16,
          EMPTY_FILTERS,
          'rating-ASC',
        );

        expect(gpuRepo._qb.orderBy).toHaveBeenCalledWith(
          'avg_rating',
          'ASC',
          'NULLS LAST',
        );
      });

      it('does not use leftJoin for rating when a search term is provided', async () => {
        const gpuRepo = makeRepoMock();
        const { service } = await buildModule({ Gpu: gpuRepo });

        await service.findAllComponents(
          'gpu',
          1,
          16,
          EMPTY_FILTERS,
          'rating-DESC',
          'RTX',
        );

        expect(gpuRepo._qb.orderBy).not.toHaveBeenCalledWith(
          'avg_rating',
          expect.any(String),
          expect.any(String),
        );
      });
    });
  });

  describe('findAllFilterValues()', () => {
    it('throws BadRequestException for an invalid type', async () => {
      const { service } = await buildModule();

      await expect(
        service.findAllFilterValues('fake-component'),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns the manufacturer filter for keyboard (only multi-string field)', async () => {
      const keyboardRepo = makeRepoMock();
      keyboardRepo._qb.getRawMany.mockResolvedValue([{ value: 'Logitech' }]);

      const { service } = await buildModule({ Keyboard: keyboardRepo });
      const result = await service.findAllFilterValues('keyboard');

      expect(result).toHaveProperty('manufacturer');
      expect(result.manufacturer).toMatchObject({ type: 'multi-string' });
    });

    it('returns min/max for range fields', async () => {
      const gpuRepo = makeRepoMock();
      gpuRepo._qb.getRawOne.mockResolvedValue({ min: 4, max: 24 });
      gpuRepo._qb.getRawMany.mockResolvedValue([]);

      const { service } = await buildModule({ Gpu: gpuRepo });
      const result = await service.findAllFilterValues('gpu');

      expect(result.memory).toEqual({ type: 'range', min: 4, max: 24 });
    });

    it('returns null for min/max when there is no data', async () => {
      const ramRepo = makeRepoMock();
      ramRepo._qb.getRawOne.mockResolvedValue({ min: null, max: null });
      ramRepo._qb.getRawMany.mockResolvedValue([]);

      const { service } = await buildModule({ Ram: ramRepo });
      const result = await service.findAllFilterValues('ram');

      expect(result.capacity).toEqual({ type: 'range', min: null, max: null });
    });

    it('devuelve values para campos multi-string', async () => {
      const cpuRepo = makeRepoMock();
      cpuRepo._qb.getRawOne.mockResolvedValue({ min: null, max: null });
      cpuRepo._qb.getRawMany.mockImplementation(() =>
        Promise.resolve([{ value: 'AM5' }, { value: 'LGA1700' }]),
      );

      const { service } = await buildModule({ Cpu: cpuRepo });
      const result = await service.findAllFilterValues('cpu');

      expect(result.socket).toMatchObject({
        type: 'multi-string',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        values: expect.arrayContaining(['AM5', 'LGA1700']),
      });
    });

    it('devuelve { type: boolean } para campos boolean', async () => {
      const cpuRepo = makeRepoMock();
      cpuRepo._qb.getRawOne.mockResolvedValue({ min: null, max: null });
      cpuRepo._qb.getRawMany.mockResolvedValue([]);

      const { service } = await buildModule({ Cpu: cpuRepo });
      const result = await service.findAllFilterValues('cpu');

      expect(result.eccSupport).toEqual({ type: 'boolean' });
      expect(result.includesCooler).toEqual({ type: 'boolean' });
      expect(result.simultaneousMultithreading).toEqual({ type: 'boolean' });
    });

    it('funciona para todos los tipos de componente soportados', async () => {
      const { service } = await buildModule();

      const supportedTypes = [
        'pc-case',
        'cpu-cooler',
        'cpu',
        'fan',
        'gpu',
        'keyboard',
        'monitor',
        'motherboard',
        'mouse',
        'power-supply',
        'ram',
        'storage-drive',
      ];

      for (const type of supportedTypes) {
        await expect(service.findAllFilterValues(type)).resolves.toBeDefined();
      }
    });
  });

  describe('registro de repositorios', () => {
    it('tiene repositorio para los 12 tipos de componente', async () => {
      const { service } = await buildModule();
      const types = [
        'pc-case',
        'cpu-cooler',
        'cpu',
        'fan',
        'gpu',
        'keyboard',
        'monitor',
        'motherboard',
        'mouse',
        'power-supply',
        'ram',
        'storage-drive',
      ];

      for (const type of types) {
        await expect(
          service.findAllComponents(type, 1, 16, EMPTY_FILTERS),
        ).resolves.toBeDefined();
      }
    });
  });

  describe('findAllComponentsRaw()', () => {
    it('returns all components for a valid type', async () => {
      const fakeData = [{ buildcoresId: 'r-1' }, { buildcoresId: 'r-2' }];
      const ramRepo = makeRepoMock();
      ramRepo._qb.getMany = jest.fn().mockResolvedValue(fakeData);

      const { service } = await buildModule({ Ram: ramRepo });
      const result = await service.findAllComponentsRaw('ram');

      expect(result).toEqual(fakeData);
    });

    it('throws BadRequestException for an invalid component type', async () => {
      const { service } = await buildModule();

      await expect(service.findAllComponentsRaw('nonexistent')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('is case-insensitive for the component type', async () => {
      const fakeData = [{ buildcoresId: 'gpu-1' }];
      const gpuRepo = makeRepoMock();
      gpuRepo._qb.getMany = jest.fn().mockResolvedValue(fakeData);

      const { service } = await buildModule({ Gpu: gpuRepo });
      const result = await service.findAllComponentsRaw('GPU');

      expect(result).toEqual(fakeData);
    });

    it('returns an empty array when there are no components', async () => {
      const cpuRepo = makeRepoMock();
      cpuRepo._qb.getMany = jest.fn().mockResolvedValue([]);

      const { service } = await buildModule({ Cpu: cpuRepo });
      const result = await service.findAllComponentsRaw('cpu');

      expect(result).toEqual([]);
    });

    it('propagates BadRequestException if the QueryBuilder throws', async () => {
      const fanRepo = makeRepoMock();
      fanRepo._qb.getMany = jest.fn().mockRejectedValue(new Error('DB error'));

      const { service } = await buildModule({ Fan: fanRepo });

      await expect(service.findAllComponentsRaw('fan')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('calls createQueryBuilder with the normalized alias', async () => {
      const storageRepo = makeRepoMock();
      storageRepo._qb.getMany = jest.fn().mockResolvedValue([]);

      const { service } = await buildModule({ StorageDrive: storageRepo });
      await service.findAllComponentsRaw('storage-drive');

      expect(storageRepo.createQueryBuilder).toHaveBeenCalledWith(
        'storage_drive',
      );
    });
  });

  describe('findComponentsCount()', () => {
    it('returns the sum of all component counts across all repositories', async () => {
      const { service, repos } = await buildModule();

      for (const repo of Object.values(repos) as Record<string, any>[]) {
        repo.count = jest.fn().mockResolvedValue(10);
      }

      const result = await service.findComponentsCount();

      expect(result).toBe(120);
    });

    it('returns 0 when all repositories are empty', async () => {
      const { service, repos } = await buildModule();

      for (const repo of Object.values(repos) as Record<string, any>[]) {
        repo.count = jest.fn().mockResolvedValue(0);
      }

      const result = await service.findComponentsCount();

      expect(result).toBe(0);
    });

    it('sums correctly when repositories have different counts', async () => {
      const { service, repos } = await buildModule();

      const repoList = Object.values(repos) as Record<string, any>[];
      repoList.forEach((repo, i) => {
        repo.count = jest.fn().mockResolvedValue(i + 1);
      });

      const result = await service.findComponentsCount();

      expect(result).toBe(78);
    });
  });
});
