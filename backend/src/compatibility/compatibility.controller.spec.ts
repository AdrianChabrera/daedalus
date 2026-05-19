import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CompatibilityService } from './compatibility.service';
import { CompatibilityController } from './compatibility.controller';
import { CheckCompatibilityDto } from './dtos/CheckCompatibility.dto';
import { CompatibilityIssueDto } from './dtos/CompatibilityIssue.dto';
import { PaginatedResult } from '../components/interfaces/pc-components.interfaces';
import { Component } from '../components/entities/component.entity';

const mockCompatibilityService: jest.Mocked<
  Pick<
    CompatibilityService,
    'checkCompatibility' | 'findBuildCompatibleComponents'
  >
> = {
  checkCompatibility: jest.fn(),
  findBuildCompatibleComponents: jest.fn(),
};

async function buildModule(): Promise<CompatibilityController> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [CompatibilityController],
    providers: [
      { provide: CompatibilityService, useValue: mockCompatibilityService },
    ],
  }).compile();

  return module.get<CompatibilityController>(CompatibilityController);
}

describe('CompatibilityController', () => {
  let controller: CompatibilityController;

  beforeEach(async () => {
    jest.clearAllMocks();
    controller = await buildModule();
  });

  describe('getCompatibility()', () => {
    it('delegates to CompatibilityService.checkCompatibility with the received dto', async () => {
      mockCompatibilityService.checkCompatibility.mockResolvedValue([]);
      const dto: CheckCompatibilityDto = { cpuId: 'cpu-uuid' };

      await controller.getCompatibility(dto);

      expect(mockCompatibilityService.checkCompatibility).toHaveBeenCalledWith(
        dto,
      );
    });

    it('returns the issues array from the service', async () => {
      const issues: CompatibilityIssueDto[] = [
        {
          rule: 'R01_CPU_MOTHERBOARD_SOCKET',
          severity: 'error',
          message: 'Socket mismatch',
          components: ['CPU', 'Motherboard'],
        },
      ];
      mockCompatibilityService.checkCompatibility.mockResolvedValue(issues);

      const result = await controller.getCompatibility({});

      expect(result).toEqual(issues);
    });

    it('returns an empty array when the build has no issues', async () => {
      mockCompatibilityService.checkCompatibility.mockResolvedValue([]);

      const result = await controller.getCompatibility({});

      expect(result).toEqual([]);
    });

    it('propagates errors thrown by the service', async () => {
      mockCompatibilityService.checkCompatibility.mockRejectedValue(
        new Error('Service failure'),
      );

      await expect(controller.getCompatibility({})).rejects.toThrow(
        'Service failure',
      );
    });
  });

  describe('getCompatibleComponentsWithBuild()', () => {
    const emptyPage: PaginatedResult<Component> = {
      data: [],
      total: 0,
      page: 1,
      limit: 16,
    };

    it('delegates to CompatibilityService.findBuildCompatibleComponents with correct params', async () => {
      mockCompatibilityService.findBuildCompatibleComponents.mockResolvedValue(
        emptyPage,
      );
      const dto: CheckCompatibilityDto = { cpuId: 'cpu-uuid' };

      await controller.getCompatibleComponentsWithBuild(
        'cpu',
        '1',
        '16',
        'name-ASC',
        '',
        {},
        dto,
      );

      expect(
        mockCompatibilityService.findBuildCompatibleComponents,
      ).toHaveBeenCalledWith(
        dto,
        'cpu',
        1,
        16,
        expect.any(Object),
        'name-ASC',
        '',
      );
    });

    it('parses page and limit query params as integers', async () => {
      mockCompatibilityService.findBuildCompatibleComponents.mockResolvedValue(
        emptyPage,
      );

      await controller.getCompatibleComponentsWithBuild(
        'ram',
        '3',
        '8',
        'name-ASC',
        '',
        {},
        {},
      );

      expect(
        mockCompatibilityService.findBuildCompatibleComponents,
      ).toHaveBeenCalledWith(
        expect.anything(),
        'ram',
        3,
        8,
        expect.any(Object),
        'name-ASC',
        '',
      );
    });

    it('uses default values for page, limit, order and search when not provided', async () => {
      mockCompatibilityService.findBuildCompatibleComponents.mockResolvedValue(
        emptyPage,
      );

      await controller.getCompatibleComponentsWithBuild(
        'gpu',
        '1',
        '16',
        'name-ASC',
        '',
        {},
        {},
      );

      expect(
        mockCompatibilityService.findBuildCompatibleComponents,
      ).toHaveBeenCalledWith(
        {},
        'gpu',
        1,
        16,
        expect.any(Object),
        'name-ASC',
        '',
      );
    });

    it('returns the paginated result from the service', async () => {
      const paginatedResult: PaginatedResult<Component> = {
        data: [{ buildcoresId: 'comp-1' } as Component],
        total: 1,
        page: 1,
        limit: 16,
      };
      mockCompatibilityService.findBuildCompatibleComponents.mockResolvedValue(
        paginatedResult,
      );

      const result = await controller.getCompatibleComponentsWithBuild(
        'cpu',
        '1',
        '16',
        'name-ASC',
        '',
        {},
        {},
      );

      expect(result).toEqual(paginatedResult);
    });

    it('propagates errors thrown by the service', async () => {
      mockCompatibilityService.findBuildCompatibleComponents.mockRejectedValue(
        new BadRequestException('Compatibility errors present'),
      );

      await expect(
        controller.getCompatibleComponentsWithBuild(
          'cpu',
          '1',
          '16',
          'name-ASC',
          '',
          {},
          {},
        ),
      ).rejects.toThrow('Compatibility errors present');
    });

    it('forwards the search query param to the service', async () => {
      mockCompatibilityService.findBuildCompatibleComponents.mockResolvedValue(
        emptyPage,
      );

      await controller.getCompatibleComponentsWithBuild(
        'gpu',
        '1',
        '16',
        'name-ASC',
        'RTX',
        {},
        {},
      );

      expect(
        mockCompatibilityService.findBuildCompatibleComponents,
      ).toHaveBeenCalledWith(
        expect.anything(),
        'gpu',
        1,
        16,
        expect.any(Object),
        'name-ASC',
        'RTX',
      );
    });

    it('forwards the order query param to the service', async () => {
      mockCompatibilityService.findBuildCompatibleComponents.mockResolvedValue(
        emptyPage,
      );

      await controller.getCompatibleComponentsWithBuild(
        'gpu',
        '1',
        '16',
        'price-DESC',
        '',
        {},
        {},
      );

      expect(
        mockCompatibilityService.findBuildCompatibleComponents,
      ).toHaveBeenCalledWith(
        expect.anything(),
        'gpu',
        1,
        16,
        expect.any(Object),
        'price-DESC',
        '',
      );
    });
  });
});
