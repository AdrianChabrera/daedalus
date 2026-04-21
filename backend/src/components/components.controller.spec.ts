import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { ComponentsController } from './components.controller';
import { ComponentsService } from './components.service';
import {
  ParsedFilters,
  PaginatedResult,
} from './interfaces/pc-components.interfaces';
import { Component } from './entities/component.entity';

const mockComponentsService: jest.Mocked<ComponentsService> = {
  findAllFilterValues: jest.fn(),
  findAllComponents: jest.fn(),
  findComponentById: jest.fn(),
} as unknown as jest.Mocked<ComponentsService>;

const EMPTY_FILTERS: ParsedFilters = {
  ranges: {},
  multiStrings: {},
  booleans: {},
};

const EMPTY_PAGINATED: PaginatedResult<Component> = {
  data: [],
  total: 0,
  page: 1,
  limit: 16,
};

async function buildModule(): Promise<ComponentsController> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [ComponentsController],
    providers: [
      { provide: ComponentsService, useValue: mockComponentsService },
    ],
  }).compile();

  return module.get<ComponentsController>(ComponentsController);
}

/* eslint-disable @typescript-eslint/unbound-method */
describe('ComponentsController', () => {
  let controller: ComponentsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    controller = await buildModule();
  });

  describe('getAllComponentsFilterValues()', () => {
    it('delegates to findAllFilterValues with the given componentType', async () => {
      mockComponentsService.findAllFilterValues.mockResolvedValue({});

      await controller.getAllComponentsFilterValues('cpu');

      expect(mockComponentsService.findAllFilterValues).toHaveBeenCalledWith(
        'cpu',
      );
    });

    it('returns the value from the service', async () => {
      const filterValues = {
        coreCount: { type: 'range' as const, min: 4, max: 16 },
      };
      mockComponentsService.findAllFilterValues.mockResolvedValue(filterValues);

      const result = await controller.getAllComponentsFilterValues('cpu');

      expect(result).toEqual(filterValues);
    });
  });

  describe('getAllComponents()', () => {
    it('calls findAllComponents with parsed page and limit', async () => {
      mockComponentsService.findAllComponents.mockResolvedValue(
        EMPTY_PAGINATED,
      );

      await controller.getAllComponents('cpu', '2', '8', 'name-ASC', '', {});

      expect(mockComponentsService.findAllComponents).toHaveBeenCalledWith(
        'cpu',
        2,
        8,
        EMPTY_FILTERS,
        'name-ASC',
        '',
      );
    });

    it('passes the order and search params to the service', async () => {
      mockComponentsService.findAllComponents.mockResolvedValue(
        EMPTY_PAGINATED,
      );

      await controller.getAllComponents(
        'gpu',
        '1',
        '16',
        'memory-DESC',
        'RTX',
        {},
      );

      expect(mockComponentsService.findAllComponents).toHaveBeenCalledWith(
        'gpu',
        1,
        16,
        EMPTY_FILTERS,
        'memory-DESC',
        'RTX',
      );
    });

    it('returns the paginated result from the service', async () => {
      const fakeResult: PaginatedResult<Component> = {
        data: [],
        total: 5,
        page: 1,
        limit: 16,
      };
      mockComponentsService.findAllComponents.mockResolvedValue(fakeResult);

      const result = await controller.getAllComponents(
        'ram',
        '1',
        '16',
        'name-ASC',
        '',
        {},
      );

      expect(result).toEqual(fakeResult);
    });

    it('skips reserved query params (page, limit, order, search)', async () => {
      mockComponentsService.findAllComponents.mockResolvedValue(
        EMPTY_PAGINATED,
      );

      await controller.getAllComponents('cpu', '1', '16', 'name-ASC', '', {
        page: '1',
        limit: '16',
        order: 'name-ASC',
        search: '',
      });

      expect(mockComponentsService.findAllComponents).toHaveBeenCalledWith(
        'cpu',
        1,
        16,
        EMPTY_FILTERS,
        'name-ASC',
        '',
      );
    });

    it('parses a minX / maxX range filter pair', async () => {
      mockComponentsService.findAllComponents.mockResolvedValue(
        EMPTY_PAGINATED,
      );

      await controller.getAllComponents('cpu', '1', '16', 'name-ASC', '', {
        minCoreCount: '4',
        maxCoreCount: '16',
      });

      const expectedFilters: ParsedFilters = {
        ranges: { coreCount: { min: 4, max: 16 } },
        multiStrings: {},
        booleans: {},
      };

      expect(mockComponentsService.findAllComponents).toHaveBeenCalledWith(
        'cpu',
        1,
        16,
        expectedFilters,
        'name-ASC',
        '',
      );
    });

    it('parses a min-only range filter', async () => {
      mockComponentsService.findAllComponents.mockResolvedValue(
        EMPTY_PAGINATED,
      );

      await controller.getAllComponents('cpu', '1', '16', 'name-ASC', '', {
        minCoreCount: '8',
      });

      const expectedFilters: ParsedFilters = {
        ranges: { coreCount: { min: 8 } },
        multiStrings: {},
        booleans: {},
      };

      expect(mockComponentsService.findAllComponents).toHaveBeenCalledWith(
        'cpu',
        1,
        16,
        expectedFilters,
        'name-ASC',
        '',
      );
    });

    it('parses a max-only range filter', async () => {
      mockComponentsService.findAllComponents.mockResolvedValue(
        EMPTY_PAGINATED,
      );

      await controller.getAllComponents('cpu', '1', '16', 'name-ASC', '', {
        maxCoreCount: '32',
      });

      const expectedFilters: ParsedFilters = {
        ranges: { coreCount: { max: 32 } },
        multiStrings: {},
        booleans: {},
      };

      expect(mockComponentsService.findAllComponents).toHaveBeenCalledWith(
        'cpu',
        1,
        16,
        expectedFilters,
        'name-ASC',
        '',
      );
    });

    it('throws BadRequestException for a range param on a non-range field', () => {
      expect(() =>
        controller.getAllComponents('cpu', '1', '16', 'name-ASC', '', {
          minSocket: 'AM5',
        }),
      ).toThrow(BadRequestException);
    });

    it('throws BadRequestException when a range param value is not a number', () => {
      expect(() =>
        controller.getAllComponents('cpu', '1', '16', 'name-ASC', '', {
          minCoreCount: 'notanumber',
        }),
      ).toThrow(BadRequestException);
    });

    it('throws BadRequestException for a range param pointing to an unknown key', () => {
      expect(() =>
        controller.getAllComponents('cpu', '1', '16', 'name-ASC', '', {
          minUnknownField: '10',
        }),
      ).toThrow(BadRequestException);
    });

    it('parses a multi-string filter with pipe-separated values', async () => {
      mockComponentsService.findAllComponents.mockResolvedValue(
        EMPTY_PAGINATED,
      );

      await controller.getAllComponents('cpu', '1', '16', 'name-ASC', '', {
        socket: 'AM5|LGA1700',
      });

      const expectedFilters: ParsedFilters = {
        ranges: {},
        multiStrings: { socket: ['AM5', 'LGA1700'] },
        booleans: {},
      };

      expect(mockComponentsService.findAllComponents).toHaveBeenCalledWith(
        'cpu',
        1,
        16,
        expectedFilters,
        'name-ASC',
        '',
      );
    });

    it('trims whitespace around pipe-separated multi-string values', async () => {
      mockComponentsService.findAllComponents.mockResolvedValue(
        EMPTY_PAGINATED,
      );

      await controller.getAllComponents('cpu', '1', '16', 'name-ASC', '', {
        socket: ' AM5 | LGA1700 ',
      });

      const expectedFilters: ParsedFilters = {
        ranges: {},
        multiStrings: { socket: ['AM5', 'LGA1700'] },
        booleans: {},
      };

      expect(mockComponentsService.findAllComponents).toHaveBeenCalledWith(
        'cpu',
        1,
        16,
        expectedFilters,
        'name-ASC',
        '',
      );
    });

    it('parses a single-value multi-string filter', async () => {
      mockComponentsService.findAllComponents.mockResolvedValue(
        EMPTY_PAGINATED,
      );

      await controller.getAllComponents('cpu', '1', '16', 'name-ASC', '', {
        socket: 'AM5',
      });

      const expectedFilters: ParsedFilters = {
        ranges: {},
        multiStrings: { socket: ['AM5'] },
        booleans: {},
      };

      expect(mockComponentsService.findAllComponents).toHaveBeenCalledWith(
        'cpu',
        1,
        16,
        expectedFilters,
        'name-ASC',
        '',
      );
    });

    it('parses a boolean filter with value "true"', async () => {
      mockComponentsService.findAllComponents.mockResolvedValue(
        EMPTY_PAGINATED,
      );

      await controller.getAllComponents('cpu', '1', '16', 'name-ASC', '', {
        eccSupport: 'true',
      });

      const expectedFilters: ParsedFilters = {
        ranges: {},
        multiStrings: {},
        booleans: { eccSupport: true },
      };

      expect(mockComponentsService.findAllComponents).toHaveBeenCalledWith(
        'cpu',
        1,
        16,
        expectedFilters,
        'name-ASC',
        '',
      );
    });

    it('parses a boolean filter with value "false"', async () => {
      mockComponentsService.findAllComponents.mockResolvedValue(
        EMPTY_PAGINATED,
      );

      await controller.getAllComponents('cpu', '1', '16', 'name-ASC', '', {
        eccSupport: 'false',
      });

      const expectedFilters: ParsedFilters = {
        ranges: {},
        multiStrings: {},
        booleans: { eccSupport: false },
      };

      expect(mockComponentsService.findAllComponents).toHaveBeenCalledWith(
        'cpu',
        1,
        16,
        expectedFilters,
        'name-ASC',
        '',
      );
    });

    it('throws BadRequestException for a boolean filter with an invalid value', () => {
      expect(() =>
        controller.getAllComponents('cpu', '1', '16', 'name-ASC', '', {
          eccSupport: 'yes',
        }),
      ).toThrow(BadRequestException);
    });

    it('throws BadRequestException for an unknown filter param', () => {
      expect(() =>
        controller.getAllComponents('cpu', '1', '16', 'name-ASC', '', {
          unknownParam: 'value',
        }),
      ).toThrow(BadRequestException);
    });

    it('lowercases the componentType before looking up the schema', async () => {
      mockComponentsService.findAllComponents.mockResolvedValue(
        EMPTY_PAGINATED,
      );

      await expect(
        controller.getAllComponents('CPU', '1', '16', 'name-ASC', '', {
          socket: 'AM5',
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('getComponentById()', () => {
    const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    it('delegates to findComponentById with componentType and id', async () => {
      const fakeComponent = { buildcoresId: VALID_UUID, name: 'Ryzen 5 5600X' };
      mockComponentsService.findComponentById.mockResolvedValue(
        fakeComponent as unknown as Component,
      );

      await controller.getComponentById('cpu', VALID_UUID);

      expect(mockComponentsService.findComponentById).toHaveBeenCalledWith(
        'cpu',
        VALID_UUID,
      );
    });

    it('returns the component from the service', async () => {
      const fakeComponent = { buildcoresId: VALID_UUID, name: 'RTX 4090' };
      mockComponentsService.findComponentById.mockResolvedValue(
        fakeComponent as unknown as Component,
      );

      const result = await controller.getComponentById('gpu', VALID_UUID);

      expect(result).toEqual(fakeComponent);
    });
  });
});
