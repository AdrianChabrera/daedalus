import { BadRequestException } from '@nestjs/common';
import { BuildsService } from '../builds/builds.service';
import { ComponentsService } from '../components/components.service';
import {
  PaginatedResult,
  ParsedFilters,
} from '../components/interfaces/pc-components.interfaces';
import { Component } from '../components/entities/component.entity';
import { Build } from '../builds/entities/build';
import { CompatibilityService } from './compatibility.service';
import { CheckCompatibilityDto } from './dtos/CheckCompatibility.dto';
import { CompatibilityIssueDto } from './dtos/CompatibilityIssue.dto';
import { CompatibilityRule } from './interfaces/compatibility-rule.interface';
import { makeBuild } from './utils/test-factories';

function makeRule(
  result: CompatibilityIssueDto | null,
): jest.Mocked<CompatibilityRule> {
  return { check: jest.fn().mockReturnValue(result) };
}

function makeIssue(
  rule = 'TEST',
  severity: CompatibilityIssueDto['severity'] = 'error',
): CompatibilityIssueDto {
  return { rule, severity, message: `${rule} message`, components: [] };
}

function buildService(
  rules: CompatibilityRule[],
  build = makeBuild(),
): CompatibilityService {
  const mockBuildsService = {
    assembleFromIds: jest.fn().mockResolvedValue(build),
  } as unknown as jest.Mocked<BuildsService>;

  const mockComponentsService = {
    findAllComponentsRaw: jest.fn().mockResolvedValue([]),
    findAllComponents: jest
      .fn()
      .mockResolvedValue({ data: [], total: 0, page: 1, limit: 16 }),
  } as unknown as jest.Mocked<ComponentsService>;

  return new CompatibilityService(
    rules,
    mockBuildsService,
    mockComponentsService,
  );
}

interface ServiceWithSpies {
  service: CompatibilityService;
  mockBuildsService: jest.Mocked<Pick<BuildsService, 'assembleFromIds'>>;
  mockComponentsService: jest.Mocked<
    Pick<ComponentsService, 'findAllComponentsRaw' | 'findAllComponents'>
  >;
}

function buildServiceWithComponents(
  rules: CompatibilityRule[],
  build: Build = makeBuild(),
  allComponents: Component[] = [],
  paginatedResult: PaginatedResult<Component> = {
    data: [],
    total: 0,
    page: 1,
    limit: 16,
  },
): CompatibilityService {
  const mockBuildsService = {
    assembleFromIds: jest.fn().mockResolvedValue(build),
  } as unknown as jest.Mocked<BuildsService>;

  const mockComponentsService = {
    findAllComponentsRaw: jest.fn().mockResolvedValue(allComponents),
    findAllComponents: jest.fn().mockResolvedValue(paginatedResult),
  } as unknown as jest.Mocked<ComponentsService>;

  return new CompatibilityService(
    rules,
    mockBuildsService,
    mockComponentsService,
  );
}

function buildServiceWithComponentsAndSpies(
  rules: CompatibilityRule[],
  build: Build = makeBuild(),
  allComponents: Component[] = [],
  paginatedResult: PaginatedResult<Component> = {
    data: [],
    total: 0,
    page: 1,
    limit: 16,
  },
): ServiceWithSpies {
  const mockBuildsService = {
    assembleFromIds: jest.fn().mockResolvedValue(build),
  } as unknown as jest.Mocked<Pick<BuildsService, 'assembleFromIds'>>;

  const mockComponentsService = {
    findAllComponentsRaw: jest.fn().mockResolvedValue(allComponents),
    findAllComponents: jest.fn().mockResolvedValue(paginatedResult),
  } as unknown as jest.Mocked<
    Pick<ComponentsService, 'findAllComponentsRaw' | 'findAllComponents'>
  >;

  const service = new CompatibilityService(
    rules,
    mockBuildsService as unknown as BuildsService,
    mockComponentsService as unknown as ComponentsService,
  );

  return { service, mockBuildsService, mockComponentsService };
}

describe('CompatibilityService', () => {
  describe('checkCompatibility()', () => {
    it('returns an empty array when all rules pass', async () => {
      const service = buildService([makeRule(null), makeRule(null)]);

      const result = await service.checkCompatibility(
        {} as CheckCompatibilityDto,
      );

      expect(result).toEqual([]);
    });

    it('returns only non-null issues', async () => {
      const issue = makeIssue('R01');
      const service = buildService([
        makeRule(null),
        makeRule(issue),
        makeRule(null),
      ]);

      const result = await service.checkCompatibility(
        {} as CheckCompatibilityDto,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(issue);
    });

    it('returns issues from all rules that fire', async () => {
      const issueA = makeIssue('R01', 'error');
      const issueB = makeIssue('W01', 'warning');
      const service = buildService([makeRule(issueA), makeRule(issueB)]);

      const result = await service.checkCompatibility(
        {} as CheckCompatibilityDto,
      );

      expect(result).toHaveLength(2);
      expect(result).toContain(issueA);
      expect(result).toContain(issueB);
    });

    it('passes the assembled build to every rule', async () => {
      const build = makeBuild();
      const ruleA = makeRule(null);
      const ruleB = makeRule(null);
      const service = buildService([ruleA, ruleB], build);

      await service.checkCompatibility({} as CheckCompatibilityDto);

      expect(ruleA.check).toHaveBeenCalledWith(build);
      expect(ruleB.check).toHaveBeenCalledWith(build);
    });

    it('calls assembleFromIds with the received dto', async () => {
      const dto: CheckCompatibilityDto = { cpuId: 'some-cpu-id' };
      const { mockBuildsService, service } = buildServiceWithComponentsAndSpies(
        [],
      );

      await service.checkCompatibility(dto);

      expect(mockBuildsService.assembleFromIds).toHaveBeenCalledWith(dto);
    });

    it('handles an empty rules list and returns an empty array', async () => {
      const service = buildService([]);

      const result = await service.checkCompatibility(
        {} as CheckCompatibilityDto,
      );

      expect(result).toEqual([]);
    });

    it('preserves the order of issues as returned by the rules', async () => {
      const issueA = makeIssue('FIRST');
      const issueB = makeIssue('SECOND');
      const issueC = makeIssue('THIRD');
      const service = buildService([
        makeRule(issueA),
        makeRule(issueB),
        makeRule(issueC),
      ]);

      const result = await service.checkCompatibility(
        {} as CheckCompatibilityDto,
      );

      expect(result.map((i) => i.rule)).toEqual(['FIRST', 'SECOND', 'THIRD']);
    });
  });

  describe('findBuildCompatibleComponents()', () => {
    it('throws BadRequestException when the base build has compatibility errors', async () => {
      const errorIssue = makeIssue('R01', 'error');
      const service = buildServiceWithComponents([makeRule(errorIssue)]);

      await expect(
        service.findBuildCompatibleComponents(
          {} as CheckCompatibilityDto,
          'cpu',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('does not throw when the base build only has warnings', async () => {
      const warningIssue = makeIssue('W01', 'warning');
      const service = buildServiceWithComponents([makeRule(warningIssue)]);

      await expect(
        service.findBuildCompatibleComponents(
          {} as CheckCompatibilityDto,
          'cpu',
        ),
      ).resolves.not.toThrow();
    });

    it('throws BadRequestException for an invalid componentType', async () => {
      const service = buildServiceWithComponents([]);

      await expect(
        service.findBuildCompatibleComponents(
          {} as CheckCompatibilityDto,
          'invalid-type',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns only compatible component ids when some cause errors', async () => {
      const compatibleComponent = { buildcoresId: 'comp-ok' } as Component;
      const incompatibleComponent = { buildcoresId: 'comp-bad' } as Component;

      const conditionalRule: CompatibilityRule = {
        check: jest.fn().mockImplementation((build: Build) => {
          const hasIncompatible = JSON.stringify(build).includes('comp-bad');
          return hasIncompatible ? makeIssue('R01', 'error') : null;
        }),
      };

      const paginatedResult = {
        data: [compatibleComponent],
        total: 1,
        page: 1,
        limit: 16,
      };

      const { service, mockComponentsService } =
        buildServiceWithComponentsAndSpies(
          [conditionalRule],
          makeBuild(),
          [compatibleComponent, incompatibleComponent],
          paginatedResult,
        );

      const result = await service.findBuildCompatibleComponents(
        {} as CheckCompatibilityDto,
        'cpu',
      );

      expect(mockComponentsService.findAllComponents).toHaveBeenCalledWith(
        'cpu',
        expect.any(Number),
        expect.any(Number),
        expect.any(Object),
        expect.any(String),
        expect.any(String),
        ['comp-ok'],
      );
      expect(result).toEqual(paginatedResult);
    });

    it('returns all component ids when none cause errors', async () => {
      const compA = { buildcoresId: 'comp-a' } as Component;
      const compB = { buildcoresId: 'comp-b' } as Component;

      const { service, mockComponentsService } =
        buildServiceWithComponentsAndSpies([makeRule(null)], makeBuild(), [
          compA,
          compB,
        ]);

      await service.findBuildCompatibleComponents(
        {} as CheckCompatibilityDto,
        'cpu',
      );

      expect(mockComponentsService.findAllComponents).toHaveBeenCalledWith(
        'cpu',
        expect.any(Number),
        expect.any(Number),
        expect.any(Object),
        expect.any(String),
        expect.any(String),
        ['comp-a', 'comp-b'],
      );
    });

    it('returns an empty compatible list when all components cause errors', async () => {
      const comp = { buildcoresId: 'comp-bad' } as Component;
      const failsOnlyWithComponent: CompatibilityRule = {
        check: jest
          .fn()
          .mockImplementation((build: Build) =>
            JSON.stringify(build).includes('comp-bad')
              ? makeIssue('R01', 'error')
              : null,
          ),
      };

      const { service, mockComponentsService } =
        buildServiceWithComponentsAndSpies(
          [failsOnlyWithComponent],
          makeBuild(),
          [comp],
        );

      await service.findBuildCompatibleComponents(
        {} as CheckCompatibilityDto,
        'cpu',
      );

      expect(mockComponentsService.findAllComponents).toHaveBeenCalledWith(
        'cpu',
        expect.any(Number),
        expect.any(Number),
        expect.any(Object),
        expect.any(String),
        expect.any(String),
        [],
      );
    });

    it('forwards page, limit, filters, order and search to findAllComponents', async () => {
      const filters: ParsedFilters = {
        ranges: { price: { min: 100, max: 500 } },
        multiStrings: {},
        booleans: {},
      };

      const { service, mockComponentsService } =
        buildServiceWithComponentsAndSpies([makeRule(null)], makeBuild(), []);

      await service.findBuildCompatibleComponents(
        {} as CheckCompatibilityDto,
        'gpu',
        2,
        8,
        filters,
        'price-ASC',
        'RTX',
      );

      expect(mockComponentsService.findAllComponents).toHaveBeenCalledWith(
        'gpu',
        2,
        8,
        filters,
        'price-ASC',
        'RTX',
        [],
      );
    });

    it('calls assembleFromIds with the provided dto', async () => {
      const dto: CheckCompatibilityDto = { cpuId: 'some-id' };
      const { service, mockBuildsService } = buildServiceWithComponentsAndSpies(
        [makeRule(null)],
      );

      await service.findBuildCompatibleComponents(dto, 'cpu');

      expect(mockBuildsService.assembleFromIds).toHaveBeenCalledWith(dto);
    });

    it('calls findAllComponentsRaw with the correct componentType', async () => {
      const { service, mockComponentsService } =
        buildServiceWithComponentsAndSpies([makeRule(null)]);

      await service.findBuildCompatibleComponents(
        {} as CheckCompatibilityDto,
        'gpu',
      );

      expect(mockComponentsService.findAllComponentsRaw).toHaveBeenCalledWith(
        'gpu',
      );
    });

    it.each([
      ['pc-case'],
      ['cpu-cooler'],
      ['cpu'],
      ['gpu'],
      ['keyboard'],
      ['motherboard'],
      ['mouse'],
      ['power-supply'],
    ])(
      'maps componentType "%s" to its buildKey without throwing',
      async (componentType) => {
        const service = buildServiceWithComponents(
          [makeRule(null)],
          makeBuild(),
          [],
        );

        await expect(
          service.findBuildCompatibleComponents(
            {} as CheckCompatibilityDto,
            componentType,
          ),
        ).resolves.not.toThrow();
      },
    );
  });

  describe('injectComponent – multi-value wrappers', () => {
    it.each([
      ['ram', 'rams'],
      ['fan', 'fans'],
      ['monitor', 'monitors'],
      ['storage-drive', 'storageDrives'],
    ])(
      'componentType "%s" appends to the existing array instead of replacing it',
      async (componentType, buildKey) => {
        const existingBuild = makeBuild();
        existingBuild[buildKey] = [{}] as never;

        const newComp = { buildcoresId: 'new-comp' } as Component;

        let capturedBuild: Build | null = null;
        const capturingRule: CompatibilityRule = {
          check: jest.fn().mockImplementation((b: Build) => {
            if (JSON.stringify(b).includes('new-comp')) capturedBuild = b;
            return null;
          }),
        };

        const service = buildServiceWithComponents(
          [capturingRule],
          existingBuild,
          [newComp],
        );

        await service.findBuildCompatibleComponents(
          {} as CheckCompatibilityDto,
          componentType,
        );

        expect(capturedBuild).not.toBeNull();
        expect(capturedBuild![buildKey]).toHaveLength(2);
      },
    );
  });
});
