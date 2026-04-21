import { Test, TestingModule } from '@nestjs/testing';
import { CompatibilityService } from './compatibility.service';
import { CompatibilityController } from './compatibility.controller';
import { CheckCompatibilityDto } from './dtos/CheckCompatibility.dto';
import { CompatibilityIssueDto } from './dtos/CompatibilityIssue.dto';

const mockCompatibilityService: jest.Mocked<
  Pick<CompatibilityService, 'checkCompatibility'>
> = {
  checkCompatibility: jest.fn(),
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
});
