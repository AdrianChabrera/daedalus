import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { PublishService } from './publish.service';
import { BuildsService } from '../builds/builds.service';
import { CompatibilityService } from '../compatibility/compatibility.service';
import { Build } from '../builds/entities/build';
import { BuildRam } from '../builds/entities/build-rams.entity';
import { BuildStorageDrive } from '../builds/entities/build-storage-drives.entity';
import { User } from '../users/user.entity';
import { Cpu } from '../components/entities/main-entities/cpu.entity';
import { CpuCooler } from '../components/entities/main-entities/cpu-cooler.entity';
import { Gpu } from '../components/entities/main-entities/gpu.entity';
import { Motherboard } from '../components/entities/main-entities/motherboard.entity';
import { PcCase } from '../components/entities/main-entities/pc-case.entity';
import { PowerSupply } from '../components/entities/main-entities/power-supply.entity';
import { BuildResponseDto } from '../builds/dtos/BuildResponse.dto';
import { CompatibilityIssueDto } from '../compatibility/dtos/CompatibilityIssue.dto';
import { SignInData } from '../auth/interfaces/auth.interfaces';
import { BuildCreationDto } from '../builds/dtos/BuildCreation.dto';

function makeUser(id = 1, username = 'alice'): User {
  const user = new User();
  user.id = id;
  user.username = username;
  user.password = 'hashed';
  user.builds = [];
  return user;
}

function makeCpu(overrides: Partial<Cpu> = {}): Cpu {
  const cpu = new Cpu();
  cpu.buildcoresId = 'cpu-uuid';
  cpu.name = 'Test CPU';
  cpu.includesCooler = false;
  cpu.integratedGraphics = null;
  return Object.assign(cpu, overrides);
}

function makeCpuCooler(): CpuCooler {
  const cooler = new CpuCooler();
  cooler.buildcoresId = 'cooler-uuid';
  cooler.name = 'Test Cooler';
  return cooler;
}

function makeGpu(): Gpu {
  const gpu = new Gpu();
  gpu.buildcoresId = 'gpu-uuid';
  gpu.name = 'Test GPU';
  return gpu;
}

function makeMotherboard(): Motherboard {
  const mb = new Motherboard();
  mb.buildcoresId = 'mb-uuid';
  mb.name = 'Test Motherboard';
  return mb;
}

function makePcCase(powerSupply: string | null = 'None'): PcCase {
  const pcCase = new PcCase();
  pcCase.buildcoresId = 'case-uuid';
  pcCase.name = 'Test Case';
  pcCase.powerSupply = powerSupply;
  return pcCase;
}

function makePsu(): PowerSupply {
  const psu = new PowerSupply();
  psu.buildcoresId = 'psu-uuid';
  psu.name = 'Test PSU';
  return psu;
}

function makeBuildRam(): BuildRam {
  const br = new BuildRam();
  br.id = 1;
  br.quantity = 1;
  return br;
}

function makeBuildStorageDrive(): BuildStorageDrive {
  const bs = new BuildStorageDrive();
  bs.id = 1;
  bs.quantity = 1;
  return bs;
}

function makeBuild(overrides: Partial<Build> = {}): Build {
  const build = new Build();
  build.id = 1;
  build.name = 'Test Build';
  build.published = false;
  build.user = makeUser();
  build.cpu = makeCpu();
  build.cpuCooler = makeCpuCooler();
  build.gpu = makeGpu();
  build.motherboard = makeMotherboard();
  build.pcCase = makePcCase('None');
  build.powerSupply = makePsu();
  build.rams = [makeBuildRam()];
  build.storageDrives = [makeBuildStorageDrive()];
  build.fans = [];
  build.monitors = [];
  return Object.assign(build, overrides);
}

function makeCurrentUser(userId = 1, username = 'alice'): SignInData {
  return { userId, username };
}

function makeCompatibilityIssue(
  severity: 'error' | 'warning' | 'unverifiable',
): CompatibilityIssueDto {
  const issue = new CompatibilityIssueDto();
  issue.rule = 'r00-test';
  issue.severity = severity;
  issue.message = `Test ${severity} message`;
  issue.components = [];
  return issue;
}

function makeBuildResponseDto(
  overrides: Partial<BuildResponseDto> = {},
): BuildResponseDto {
  const dto = new BuildResponseDto(makeBuild(), 'alice');
  return Object.assign(dto, overrides);
}

const BUILD_DTO: BuildCreationDto = { name: 'Test Build' } as BuildCreationDto;

const mockBuildsService: jest.Mocked<
  Pick<BuildsService, 'createBuild' | 'findBuildById' | 'setPublished'>
> = {
  createBuild: jest.fn(),
  findBuildById: jest.fn(),
  setPublished: jest.fn(),
};

const mockCompatibilityService: jest.Mocked<
  Pick<CompatibilityService, 'checkCompatibilityFromBuild'>
> = {
  checkCompatibilityFromBuild: jest.fn(),
};

function makeDataSourceMock() {
  return {
    transaction: jest
      .fn()
      .mockImplementation(
        async (cb: (manager: EntityManager) => Promise<BuildResponseDto>) =>
          cb({} as EntityManager),
      ),
  };
}

describe('PublishService', () => {
  let service: PublishService;
  let dataSource: ReturnType<typeof makeDataSourceMock>;

  beforeEach(async () => {
    dataSource = makeDataSourceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishService,
        { provide: BuildsService, useValue: mockBuildsService },
        { provide: CompatibilityService, useValue: mockCompatibilityService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<PublishService>(PublishService);
    jest.clearAllMocks();
  });

  describe('createAndPublishBuild', () => {
    it('should create, validate and publish a build successfully', async () => {
      const currentUser = makeCurrentUser();
      const build = makeBuild();
      const responseDto = makeBuildResponseDto();

      mockBuildsService.createBuild.mockResolvedValue(responseDto);
      mockBuildsService.findBuildById.mockResolvedValue(build);
      mockCompatibilityService.checkCompatibilityFromBuild.mockReturnValue([]);
      mockBuildsService.setPublished.mockResolvedValue(undefined);

      const result = await service.createAndPublishBuild(
        BUILD_DTO,
        currentUser,
      );

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(mockBuildsService.createBuild).toHaveBeenCalledWith(
        BUILD_DTO,
        currentUser,
        expect.anything(),
      );
      expect(mockBuildsService.findBuildById).toHaveBeenCalledWith(
        responseDto.id,
        expect.anything(),
      );
      expect(
        mockCompatibilityService.checkCompatibilityFromBuild,
      ).toHaveBeenCalledWith(build);
      expect(mockBuildsService.setPublished).toHaveBeenCalledWith(
        build,
        true,
        expect.anything(),
      );
      expect(result.published).toBe(true);
    });

    it('should throw ConflictException when there are compatibility errors', async () => {
      const currentUser = makeCurrentUser();
      const build = makeBuild();
      const responseDto = makeBuildResponseDto();

      mockBuildsService.createBuild.mockResolvedValue(responseDto);
      mockBuildsService.findBuildById.mockResolvedValue(build);
      mockCompatibilityService.checkCompatibilityFromBuild.mockReturnValue([
        makeCompatibilityIssue('error'),
      ]);

      await expect(
        service.createAndPublishBuild(BUILD_DTO, currentUser),
      ).rejects.toThrow(ConflictException);

      expect(mockBuildsService.setPublished).not.toHaveBeenCalled();
    });

    it('should publish when only warnings exist and no errors', async () => {
      const currentUser = makeCurrentUser();
      const build = makeBuild();
      const responseDto = makeBuildResponseDto();

      mockBuildsService.createBuild.mockResolvedValue(responseDto);
      mockBuildsService.findBuildById.mockResolvedValue(build);
      mockCompatibilityService.checkCompatibilityFromBuild.mockReturnValue([
        makeCompatibilityIssue('warning'),
      ]);
      mockBuildsService.setPublished.mockResolvedValue(undefined);

      const result = await service.createAndPublishBuild(
        BUILD_DTO,
        currentUser,
      );

      expect(mockBuildsService.setPublished).toHaveBeenCalledWith(
        build,
        true,
        expect.anything(),
      );
      expect(result.published).toBe(true);
    });

    it('should throw ConflictException when mandatory components are missing', async () => {
      const currentUser = makeCurrentUser();
      const build = makeBuild({
        cpu: undefined,
        cpuCooler: undefined,
        gpu: undefined,
      });
      const responseDto = makeBuildResponseDto();

      mockBuildsService.createBuild.mockResolvedValue(responseDto);
      mockBuildsService.findBuildById.mockResolvedValue(build);
      mockCompatibilityService.checkCompatibilityFromBuild.mockReturnValue([]);

      await expect(
        service.createAndPublishBuild(BUILD_DTO, currentUser),
      ).rejects.toThrow(ConflictException);

      expect(mockBuildsService.setPublished).not.toHaveBeenCalled();
    });

    it('should list all missing components in the error message', async () => {
      const currentUser = makeCurrentUser();
      const build = makeBuild({
        cpu: undefined,
        cpuCooler: undefined,
        gpu: undefined,
        motherboard: undefined as unknown as Motherboard,
        pcCase: undefined,
        powerSupply: undefined,
        rams: [],
        storageDrives: [],
      });
      const responseDto = makeBuildResponseDto();

      mockBuildsService.createBuild.mockResolvedValue(responseDto);
      mockBuildsService.findBuildById.mockResolvedValue(build);
      mockCompatibilityService.checkCompatibilityFromBuild.mockReturnValue([]);

      await expect(
        service.createAndPublishBuild(BUILD_DTO, currentUser),
      ).rejects.toThrow(
        /cpu.*cpu cooler.*gpu.*motherboard.*case.*power supply.*rams.*storage drives/i,
      );
    });
  });

  describe('publishBuild', () => {
    it('should publish a valid build owned by the current user', async () => {
      const currentUser = makeCurrentUser(1);
      const build = makeBuild({ user: makeUser(1) });

      mockBuildsService.findBuildById.mockResolvedValue(build);
      mockCompatibilityService.checkCompatibilityFromBuild.mockReturnValue([]);
      mockBuildsService.setPublished.mockResolvedValue(undefined);

      await service.publishBuild(currentUser, 1);

      expect(mockBuildsService.findBuildById).toHaveBeenCalledWith(1);
      expect(mockBuildsService.setPublished).toHaveBeenCalledWith(build, true);
    });

    it('should throw ForbiddenException when the user does not own the build', async () => {
      const currentUser = makeCurrentUser(1);
      const build = makeBuild({ user: makeUser(99, 'other') });

      mockBuildsService.findBuildById.mockResolvedValue(build);

      await expect(service.publishBuild(currentUser, 1)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockBuildsService.setPublished).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the build is already published', async () => {
      const currentUser = makeCurrentUser(1);
      const build = makeBuild({ published: true, user: makeUser(1) });

      mockBuildsService.findBuildById.mockResolvedValue(build);

      await expect(service.publishBuild(currentUser, 1)).rejects.toThrow(
        ConflictException,
      );
      expect(mockBuildsService.setPublished).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when there are compatibility errors', async () => {
      const currentUser = makeCurrentUser(1);
      const build = makeBuild({ user: makeUser(1) });

      mockBuildsService.findBuildById.mockResolvedValue(build);
      mockCompatibilityService.checkCompatibilityFromBuild.mockReturnValue([
        makeCompatibilityIssue('error'),
      ]);

      await expect(service.publishBuild(currentUser, 1)).rejects.toThrow(
        ConflictException,
      );
      expect(mockBuildsService.setPublished).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when mandatory components are missing', async () => {
      const currentUser = makeCurrentUser(1);
      const build = makeBuild({
        user: makeUser(1),
        cpu: undefined,
        cpuCooler: undefined,
      });

      mockBuildsService.findBuildById.mockResolvedValue(build);
      mockCompatibilityService.checkCompatibilityFromBuild.mockReturnValue([]);

      await expect(service.publishBuild(currentUser, 1)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should publish when only warnings exist and no errors', async () => {
      const currentUser = makeCurrentUser(1);
      const build = makeBuild({ user: makeUser(1) });

      mockBuildsService.findBuildById.mockResolvedValue(build);
      mockCompatibilityService.checkCompatibilityFromBuild.mockReturnValue([
        makeCompatibilityIssue('warning'),
      ]);
      mockBuildsService.setPublished.mockResolvedValue(undefined);

      await service.publishBuild(currentUser, 1);

      expect(mockBuildsService.setPublished).toHaveBeenCalledWith(build, true);
    });
  });

  describe('mandatory component edge cases', () => {
    const currentUser = makeCurrentUser(1);

    beforeEach(() => {
      mockCompatibilityService.checkCompatibilityFromBuild.mockReturnValue([]);
      mockBuildsService.setPublished.mockResolvedValue(undefined);
    });

    it('should accept a CPU with includesCooler=true even without a separate cooler', async () => {
      const build = makeBuild({
        user: makeUser(1),
        cpuCooler: undefined,
        cpu: makeCpu({ includesCooler: true }),
      });
      mockBuildsService.findBuildById.mockResolvedValue(build);

      await expect(
        service.publishBuild(currentUser, 1),
      ).resolves.toBeUndefined();
    });

    it('should require a cooler when includesCooler=false and no separate cooler is set', async () => {
      const build = makeBuild({
        user: makeUser(1),
        cpuCooler: undefined,
        cpu: makeCpu({ includesCooler: false }),
      });
      mockBuildsService.findBuildById.mockResolvedValue(build);

      await expect(service.publishBuild(currentUser, 1)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should accept a CPU with integratedGraphics set even without a discrete GPU', async () => {
      const build = makeBuild({
        user: makeUser(1),
        gpu: undefined,
        cpu: makeCpu({ integratedGraphics: 'Intel UHD 770' }),
      });
      mockBuildsService.findBuildById.mockResolvedValue(build);

      await expect(
        service.publishBuild(currentUser, 1),
      ).resolves.toBeUndefined();
    });

    it('should require a discrete GPU when integratedGraphics is null', async () => {
      const build = makeBuild({
        user: makeUser(1),
        gpu: undefined,
        cpu: makeCpu({ integratedGraphics: null }),
      });
      mockBuildsService.findBuildById.mockResolvedValue(build);

      await expect(service.publishBuild(currentUser, 1)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should accept a pcCase that includes a built-in power supply', async () => {
      const build = makeBuild({
        user: makeUser(1),
        powerSupply: undefined,
        pcCase: makePcCase('650W'),
      });
      mockBuildsService.findBuildById.mockResolvedValue(build);

      await expect(
        service.publishBuild(currentUser, 1),
      ).resolves.toBeUndefined();
    });

    it('should require a PSU when pcCase.powerSupply="None" and no separate PSU is set', async () => {
      const build = makeBuild({
        user: makeUser(1),
        powerSupply: undefined,
        pcCase: makePcCase('None'),
      });
      mockBuildsService.findBuildById.mockResolvedValue(build);

      await expect(service.publishBuild(currentUser, 1)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should require at least one RAM module', async () => {
      const build = makeBuild({ user: makeUser(1), rams: [] });
      mockBuildsService.findBuildById.mockResolvedValue(build);

      await expect(service.publishBuild(currentUser, 1)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should require at least one storage drive', async () => {
      const build = makeBuild({ user: makeUser(1), storageDrives: [] });
      mockBuildsService.findBuildById.mockResolvedValue(build);

      await expect(service.publishBuild(currentUser, 1)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
