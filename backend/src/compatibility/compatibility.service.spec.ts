import { BuildsService } from 'src/builds/builds.service';
import { CompatibilityService } from './compatibility.service';
import { CheckCompatibilityDto } from './dtos/CheckCompatibility.dto';
import { CompatibilityIssueDto } from './dtos/CompatibilityIssue.dto';
import { CompatibilityRule } from './interfaces/compatibility-rule.interface';
import { makeBuild } from './utils/test-factories';
import { ComponentsService } from 'src/components/components.service';

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
  const mockComponentsService = {} as unknown as jest.Mocked<ComponentsService>;
  return new CompatibilityService(
    rules,
    mockComponentsService,
    mockBuildsService,
  );
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

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ruleA.check).toHaveBeenCalledWith(build);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(ruleB.check).toHaveBeenCalledWith(build);
    });

    it('calls assembleFromIds with the received dto', async () => {
      const dto: CheckCompatibilityDto = { cpuId: 'some-cpu-id' };
      const mockBuildsService = {
        assembleFromIds: jest.fn().mockResolvedValue(makeBuild()),
      } as unknown as jest.Mocked<BuildsService>;
      const service = new CompatibilityService(
        [],
        {} as unknown as ComponentsService,
        mockBuildsService,
      );

      await service.checkCompatibility(dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
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
});
