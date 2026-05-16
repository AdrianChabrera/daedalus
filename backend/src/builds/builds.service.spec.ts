import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SelectQueryBuilder } from 'typeorm';

import { BuildsService } from './builds.service';
import { Build } from './entities/build';
import { BuildFan } from './entities/build-fans.entity';
import { BuildRam } from './entities/build-rams.entity';
import { BuildMonitor } from './entities/build-monitors.entity';
import { BuildStorageDrive } from './entities/build-storage-drives.entity';
import { ComponentsService } from '../components/components.service';
import { UsersService } from '../users/users.service';
import { BuildCreationDto } from './dtos/BuildCreation.dto';
import { BuildComponentAssignmentDto } from './dtos/BuildComponentAssignment.dto';
import { SignInData } from '../auth/interfaces/auth.interfaces';
import { User } from '../users/user.entity';
import { Gpu } from '../components/entities/main-entities/gpu.entity';
import { Ram } from '../components/entities/main-entities/ram.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

function makeUser(overrides: Partial<User> = {}): User {
  return Object.assign(new User(), { id: 1, username: 'alice', ...overrides });
}

function makeBuild(overrides: Partial<Build> = {}): Build {
  const b = new Build();
  b.id = 1;
  b.name = 'Test Build';
  b.published = false;
  b.fans = [];
  b.rams = [];
  b.monitors = [];
  b.storageDrives = [];
  b.user = makeUser();
  return Object.assign(b, overrides);
}

function makeRam(overrides: Partial<Ram> = {}): Ram {
  return Object.assign(new Ram(), {
    buildcoresId: 'ram-uuid',
    name: 'Test RAM',
    ...overrides,
  });
}

function makeGpu(overrides: Partial<Gpu> = {}): Gpu {
  return Object.assign(new Gpu(), {
    buildcoresId: 'gpu-uuid',
    name: 'Test GPU',
    ...overrides,
  });
}

function makeQbMock(): jest.Mocked<SelectQueryBuilder<Build>> {
  return {
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    whereInIds: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getMany: jest.fn().mockResolvedValue([]),
    getRawMany: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<SelectQueryBuilder<Build>>;
}

function makeBuildRepoMock(qb = makeQbMock()) {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    metadata: {
      relations: [
        { propertyName: 'cpu' },
        { propertyName: 'gpu' },
        { propertyName: 'rams' },
        { propertyName: 'fans' },
        { propertyName: 'monitors' },
        { propertyName: 'storageDrives' },
      ],
    },
    _qb: qb,
  };
}

function makeJoinRepoMock() {
  return {
    remove: jest.fn(),
    save: jest.fn(),
  };
}

const mockComponentsService = {
  findComponentById: jest.fn(),
  findComponentsByIds: jest.fn(),
};

const mockUsersService = {
  findUserById: jest.fn(),
};

const mockCloudinaryService = {
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
};

const currentUser: SignInData = { userId: 1, username: 'alice' };

const buildCreationDto: BuildCreationDto = {
  name: 'My Build',
  description: 'desc',
  fanIds: [],
  monitorIds: [],
  ramIds: [],
  storageDriveIds: [],
};

async function buildModule(
  buildRepoOverride?: ReturnType<typeof makeBuildRepoMock>,
) {
  const buildRepo = buildRepoOverride ?? makeBuildRepoMock();
  const buildRamRepo = makeJoinRepoMock();
  const buildFanRepo = makeJoinRepoMock();
  const buildMonitorRepo = makeJoinRepoMock();
  const buildStorageDriveRepo = makeJoinRepoMock();

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      BuildsService,
      { provide: getRepositoryToken(Build), useValue: buildRepo },
      { provide: getRepositoryToken(BuildRam), useValue: buildRamRepo },
      { provide: getRepositoryToken(BuildFan), useValue: buildFanRepo },
      { provide: getRepositoryToken(BuildMonitor), useValue: buildMonitorRepo },
      {
        provide: getRepositoryToken(BuildStorageDrive),
        useValue: buildStorageDriveRepo,
      },
      { provide: ComponentsService, useValue: mockComponentsService },
      { provide: UsersService, useValue: mockUsersService },
      { provide: CloudinaryService, useValue: mockCloudinaryService },
    ],
  }).compile();

  return {
    service: module.get<BuildsService>(BuildsService),
    buildRepo,
    buildRamRepo,
    buildFanRepo,
    buildMonitorRepo,
    buildStorageDriveRepo,
  };
}

describe('BuildsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockComponentsService.findComponentById.mockResolvedValue(null);
    mockComponentsService.findComponentsByIds.mockResolvedValue([]);
    mockUsersService.findUserById.mockResolvedValue(makeUser());
  });

  describe('createBuild()', () => {
    it('saves a new build and returns a BuildResponseDto', async () => {
      const savedBuild = makeBuild();
      const buildRepo = makeBuildRepoMock();
      buildRepo.save.mockResolvedValue(savedBuild);

      const { service } = await buildModule(buildRepo);
      const result = await service.createBuild(buildCreationDto, currentUser);

      expect(buildRepo.save).toHaveBeenCalled();
      expect(result.name).toBe(savedBuild.name);
      expect(result.username).toBe(currentUser.username);
    });

    it('sets published to false on creation', async () => {
      let capturedBuild: Build | null = null;
      const buildRepo = makeBuildRepoMock();
      buildRepo.save.mockImplementation((b: Build) => {
        capturedBuild = b;
        return Promise.resolve({
          ...b,
          id: 1,
          fans: [],
          rams: [],
          monitors: [],
          storageDrives: [],
        });
      });

      const { service } = await buildModule(buildRepo);
      await service.createBuild(buildCreationDto, currentUser);

      expect(capturedBuild!.published).toBe(false);
    });

    it('propagates errors thrown by the repository', async () => {
      const buildRepo = makeBuildRepoMock();
      buildRepo.save.mockRejectedValue(new Error('DB error'));

      const { service } = await buildModule(buildRepo);

      await expect(
        service.createBuild(buildCreationDto, currentUser),
      ).rejects.toThrow('DB error');
    });
  });

  describe('updateBuild()', () => {
    it('throws ForbiddenException when the build does not belong to the current user', async () => {
      const build = makeBuild({ user: makeUser({ id: 99 }) });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);

      const { service } = await buildModule(buildRepo);

      await expect(
        service.updateBuild(buildCreationDto, currentUser, 1),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException when the build is already published', async () => {
      const build = makeBuild({ published: true });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);

      const { service } = await buildModule(buildRepo);

      await expect(
        service.updateBuild(buildCreationDto, currentUser, 1),
      ).rejects.toThrow(ConflictException);
    });

    it('saves and returns the updated build', async () => {
      const build = makeBuild();
      const updatedBuild = makeBuild({ name: 'Updated Build' });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);
      buildRepo.save.mockResolvedValue(updatedBuild);

      const { service } = await buildModule(buildRepo);
      const result = await service.updateBuild(
        { ...buildCreationDto, name: 'Updated Build' },
        currentUser,
        1,
      );

      expect(buildRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Build');
    });
  });

  describe('findBuildById()', () => {
    it('returns the build when found', async () => {
      const build = makeBuild();
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);

      const { service } = await buildModule(buildRepo);
      const result = await service.findBuildById(1);

      expect(result).toEqual(build);
    });

    it('throws NotFoundException when the build does not exist', async () => {
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(null);

      const { service } = await buildModule(buildRepo);

      await expect(service.findBuildById(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getBuildDetailsById()', () => {
    it('returns the build details when the user is the owner', async () => {
      const build = makeBuild();
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);

      const { service } = await buildModule(buildRepo);
      const result = await service.getBuildDetailsById(1, currentUser);

      expect(result.id).toBe(build.id);
    });

    it('returns the build details when it is published (even if not owner)', async () => {
      const build = makeBuild({
        published: true,
        user: makeUser({ id: 99, username: 'bob' }),
      });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);

      const { service } = await buildModule(buildRepo);
      const result = await service.getBuildDetailsById(1, currentUser);

      expect(result.id).toBe(build.id);
    });

    it('throws ForbiddenException when the build is unpublished and not owned by the user', async () => {
      const build = makeBuild({
        published: false,
        user: makeUser({ id: 99 }),
      });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);

      const { service } = await buildModule(buildRepo);

      await expect(service.getBuildDetailsById(1, currentUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAllBuilds()', () => {
    it('returns a paginated result', async () => {
      const builds = [makeBuild()];
      const buildRepo = makeBuildRepoMock();
      buildRepo._qb.getManyAndCount.mockResolvedValue([builds, 1]);

      const { service } = await buildModule(buildRepo);
      const result = await service.findAllBuilds(null, 1, 16, 'name-ASC', '');

      expect(result.data).toEqual(builds);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(16);
    });

    it('filters by user when currentUser is provided', async () => {
      const buildRepo = makeBuildRepoMock();
      buildRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);

      const { service } = await buildModule(buildRepo);
      await service.findAllBuilds(currentUser, 1, 16, 'name-ASC', '');

      expect(buildRepo._qb.andWhere as jest.Mock).toHaveBeenCalledWith(
        expect.stringContaining('userId'),
        expect.objectContaining({ userId: currentUser.userId }),
      );
    });

    it('filters published builds when currentUser is null', async () => {
      const buildRepo = makeBuildRepoMock();
      buildRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);

      const { service } = await buildModule(buildRepo);
      await service.findAllBuilds(null, 1, 16, 'name-ASC', '');

      expect(buildRepo._qb.andWhere).toHaveBeenCalledWith(
        'build.published = true',
      );
    });

    it('uses similarity search when a search term is provided', async () => {
      const buildRepo = makeBuildRepoMock();
      buildRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);

      const { service } = await buildModule(buildRepo);
      await service.findAllBuilds(null, 1, 16, 'name-ASC', 'gaming');

      expect(buildRepo._qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('similarity'),
        expect.objectContaining({ search: 'gaming', threshold: 0.1 }),
      );
    });

    it('throws BadRequestException for an invalid order field', async () => {
      const { service } = await buildModule();

      await expect(
        service.findAllBuilds(null, 1, 16, 'invalid-ASC', ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns empty result immediately when allowedIds is an empty array', async () => {
      const buildRepo = makeBuildRepoMock();
      const { service } = await buildModule(buildRepo);

      const result = await service.findAllBuilds(
        null,
        1,
        16,
        'name-ASC',
        '',
        [],
      );

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 16 });
      expect(buildRepo._qb.getManyAndCount).not.toHaveBeenCalled();
    });

    describe('order by rating', () => {
      it('uses getRawMany and then getMany when ordering by rating', async () => {
        const build = makeBuild({ id: 1 });
        const buildRepo = makeBuildRepoMock();
        buildRepo._qb.getRawMany.mockResolvedValue([
          { id: 1, avg_rating: '4.5' },
        ]);
        buildRepo._qb.getMany.mockResolvedValue([build]);

        const { service } = await buildModule(buildRepo);
        const result = await service.findAllBuilds(
          null,
          1,
          16,
          'rating-DESC',
          '',
        );

        expect(buildRepo._qb.getRawMany).toHaveBeenCalled();
        expect(buildRepo._qb.getMany).toHaveBeenCalled();
        expect(result.total).toBe(1);
        expect(result.data[0].id).toBe(1);
      });

      it('orders by avg_rating DESC when direction is DESC', async () => {
        const buildRepo = makeBuildRepoMock();
        buildRepo._qb.getRawMany.mockResolvedValue([]);

        const { service } = await buildModule(buildRepo);
        await service.findAllBuilds(null, 1, 16, 'rating-DESC', '');

        expect(buildRepo._qb.orderBy).toHaveBeenCalledWith(
          'avg_rating',
          'DESC',
          'NULLS LAST',
        );
      });

      it('orders by avg_rating ASC when direction is ASC', async () => {
        const buildRepo = makeBuildRepoMock();
        buildRepo._qb.getRawMany.mockResolvedValue([]);

        const { service } = await buildModule(buildRepo);
        await service.findAllBuilds(null, 1, 16, 'rating-ASC', '');

        expect(buildRepo._qb.orderBy).toHaveBeenCalledWith(
          'avg_rating',
          'ASC',
          'NULLS LAST',
        );
      });

      it('returns empty result when no builds match the rating query', async () => {
        const buildRepo = makeBuildRepoMock();
        buildRepo._qb.getRawMany.mockResolvedValue([]);

        const { service } = await buildModule(buildRepo);
        const result = await service.findAllBuilds(
          null,
          1,
          16,
          'rating-DESC',
          '',
        );

        expect(result).toEqual({ data: [], total: 0, page: 1, limit: 16 });
        expect(buildRepo._qb.getMany).not.toHaveBeenCalled();
      });

      it('applies published filter in the rating query when currentUser is null', async () => {
        const buildRepo = makeBuildRepoMock();
        buildRepo._qb.getRawMany.mockResolvedValue([]);

        const { service } = await buildModule(buildRepo);
        await service.findAllBuilds(null, 1, 16, 'rating-DESC', '');

        expect(buildRepo._qb.andWhere).toHaveBeenCalledWith(
          'build.published = true',
        );
      });

      it('applies userId filter in the rating query when currentUser is provided', async () => {
        const buildRepo = makeBuildRepoMock();
        buildRepo._qb.getRawMany.mockResolvedValue([]);

        const { service } = await buildModule(buildRepo);
        await service.findAllBuilds(currentUser, 1, 16, 'rating-DESC', '');

        expect(buildRepo._qb.andWhere).toHaveBeenCalledWith(
          expect.stringContaining('userId'),
          expect.objectContaining({ userId: currentUser.userId }),
        );
      });

      it('respects pagination slicing the ranked list', async () => {
        const builds = [makeBuild({ id: 3 }), makeBuild({ id: 4 })];
        const ranked = [
          { id: 1, avg_rating: '5' },
          { id: 2, avg_rating: '4' },
          { id: 3, avg_rating: '3' },
          { id: 4, avg_rating: '2' },
        ];
        const buildRepo = makeBuildRepoMock();
        buildRepo._qb.getRawMany.mockResolvedValue(ranked);
        buildRepo._qb.getMany.mockResolvedValue(builds);

        const { service } = await buildModule(buildRepo);
        const result = await service.findAllBuilds(
          null,
          2,
          2,
          'rating-DESC',
          '',
        );

        expect(result.total).toBe(4);
        expect(result.data).toHaveLength(2);
        expect(result.data.map((b) => b.id)).toEqual([3, 4]);
      });

      it('preserves the rating order in the returned data', async () => {
        const buildA = makeBuild({ id: 2 });
        const buildB = makeBuild({ id: 1 });
        const ranked = [
          { id: 2, avg_rating: '5' },
          { id: 1, avg_rating: '3' },
        ];
        const buildRepo = makeBuildRepoMock();
        buildRepo._qb.getRawMany.mockResolvedValue(ranked);
        buildRepo._qb.getMany.mockResolvedValue([buildB, buildA]);

        const { service } = await buildModule(buildRepo);
        const result = await service.findAllBuilds(
          null,
          1,
          16,
          'rating-DESC',
          '',
        );

        expect(result.data[0].id).toBe(2);
        expect(result.data[1].id).toBe(1);
      });

      it('returns empty result immediately when allowedIds is empty in rating path', async () => {
        const buildRepo = makeBuildRepoMock();
        const { service } = await buildModule(buildRepo);

        const result = await service.findAllBuilds(
          null,
          1,
          16,
          'rating-DESC',
          '',
          [],
        );

        expect(result).toEqual({ data: [], total: 0, page: 1, limit: 16 });
        expect(buildRepo._qb.getRawMany).not.toHaveBeenCalled();
      });
    });
  });

  describe('deleteBuild()', () => {
    it('deletes the build when the user is the owner', async () => {
      const build = makeBuild();
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);
      buildRepo.delete.mockResolvedValue({ affected: 1 });

      const { service } = await buildModule(buildRepo);
      await service.deleteBuild(currentUser, 1);

      expect(buildRepo.delete).toHaveBeenCalledWith(build.id);
    });

    it('throws ForbiddenException when the build does not belong to the user', async () => {
      const build = makeBuild({ user: makeUser({ id: 99 }) });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);

      const { service } = await buildModule(buildRepo);

      await expect(service.deleteBuild(currentUser, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when delete affects 0 rows', async () => {
      const build = makeBuild();
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);
      buildRepo.delete.mockResolvedValue({ affected: 0 });

      const { service } = await buildModule(buildRepo);

      await expect(service.deleteBuild(currentUser, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('assignComponent()', () => {
    const assignmentDto: BuildComponentAssignmentDto = {
      componentId: 'gpu-uuid',
      buildId: 1,
      componentType: 'gpu',
    };

    it('assigns a single component (gpu) to the build', async () => {
      const build = makeBuild();
      const gpu = makeGpu({ buildcoresId: 'gpu-uuid' });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);
      buildRepo.save.mockResolvedValue(build);
      mockComponentsService.findComponentById.mockResolvedValue(gpu);

      const { service } = await buildModule(buildRepo);
      await service.assignComponent(assignmentDto, currentUser);

      expect(buildRepo.save).toHaveBeenCalled();
    });

    it('throws ForbiddenException when the build does not belong to the user', async () => {
      const build = makeBuild({ user: makeUser({ id: 99 }) });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);
      mockComponentsService.findComponentById.mockResolvedValue(makeGpu());

      const { service } = await buildModule(buildRepo);

      await expect(
        service.assignComponent(assignmentDto, currentUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException when the build is published', async () => {
      const build = makeBuild({ published: true });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);
      mockComponentsService.findComponentById.mockResolvedValue(makeGpu());

      const { service } = await buildModule(buildRepo);

      await expect(
        service.assignComponent(assignmentDto, currentUser),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException for an unknown component type', async () => {
      const build = makeBuild();
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);
      mockComponentsService.findComponentById.mockResolvedValue({});

      const { service } = await buildModule(buildRepo);

      await expect(
        service.assignComponent(
          { ...assignmentDto, componentType: 'unknownType' },
          currentUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('increments quantity for a multi-component (ram) that already exists in the build', async () => {
      const ram = makeRam({ buildcoresId: 'ram-uuid' });
      const buildRam = new BuildRam();
      buildRam.ram = ram;
      buildRam.quantity = 1;
      const build = makeBuild({ rams: [buildRam] });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);
      buildRepo.save.mockResolvedValue(build);
      mockComponentsService.findComponentById.mockResolvedValue(ram);

      const { service } = await buildModule(buildRepo);
      await service.assignComponent(
        { componentId: 'ram-uuid', buildId: 1, componentType: 'ram' },
        currentUser,
      );

      expect(buildRam.quantity).toBe(2);
      expect(buildRepo.save).toHaveBeenCalled();
    });

    it('adds a new entry for a multi-component (ram) not yet in the build', async () => {
      const ram = makeRam({ buildcoresId: 'ram-uuid' });
      const build = makeBuild({ rams: [] });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);
      buildRepo.save.mockResolvedValue(build);
      mockComponentsService.findComponentById.mockResolvedValue(ram);

      const { service } = await buildModule(buildRepo);
      await service.assignComponent(
        { componentId: 'ram-uuid', buildId: 1, componentType: 'ram' },
        currentUser,
      );

      expect(build.rams).toHaveLength(1);
      expect(build.rams[0].quantity).toBe(1);
    });
  });

  describe('removeComponent()', () => {
    const assignmentDto: BuildComponentAssignmentDto = {
      componentId: 'gpu-uuid',
      buildId: 1,
      componentType: 'gpu',
    };

    it('sets a single component to null when removing it', async () => {
      const gpu = makeGpu({ buildcoresId: 'gpu-uuid' });
      const build = makeBuild({ gpu });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);
      buildRepo.save.mockResolvedValue(build);

      const { service } = await buildModule(buildRepo);
      await service.removeComponent(assignmentDto, currentUser);

      expect(build.gpu).toBeNull();
      expect(buildRepo.save).toHaveBeenCalled();
    });

    it('throws ForbiddenException when the build does not belong to the user', async () => {
      const build = makeBuild({ user: makeUser({ id: 99 }) });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);

      const { service } = await buildModule(buildRepo);

      await expect(
        service.removeComponent(assignmentDto, currentUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException when the build is published', async () => {
      const build = makeBuild({ published: true });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);

      const { service } = await buildModule(buildRepo);

      await expect(
        service.removeComponent(assignmentDto, currentUser),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when the multi-component is not in the build', async () => {
      const build = makeBuild({ rams: [] });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);

      const { service } = await buildModule(buildRepo);

      await expect(
        service.removeComponent(
          { componentId: 'ram-uuid', buildId: 1, componentType: 'ram' },
          currentUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('decrements quantity for a multi-component (ram) with quantity > 1', async () => {
      const ram = makeRam({ buildcoresId: 'ram-uuid' });
      const buildRam = new BuildRam();
      buildRam.ram = ram;
      buildRam.quantity = 3;
      const build = makeBuild({ rams: [buildRam] });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);
      buildRepo.save.mockResolvedValue(build);

      const { service } = await buildModule(buildRepo);
      await service.removeComponent(
        { componentId: 'ram-uuid', buildId: 1, componentType: 'ram' },
        currentUser,
      );

      expect(buildRam.quantity).toBe(2);
      expect(buildRepo.save).toHaveBeenCalled();
    });

    it('removes the BuildRam record when quantity reaches 1', async () => {
      const ram = makeRam({ buildcoresId: 'ram-uuid' });
      const buildRam = new BuildRam();
      buildRam.ram = ram;
      buildRam.quantity = 1;
      const build = makeBuild({ rams: [buildRam] });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);

      const { service, buildRamRepo } = await buildModule(buildRepo);
      buildRamRepo.remove.mockResolvedValue(buildRam);

      await service.removeComponent(
        { componentId: 'ram-uuid', buildId: 1, componentType: 'ram' },
        currentUser,
      );

      expect(buildRamRepo.remove).toHaveBeenCalledWith(buildRam);
    });
  });

  describe('findAllUnpublishedBuildsFromUser()', () => {
    it('returns builds with component count for the current user', async () => {
      const gpu = makeGpu({ buildcoresId: 'gpu-uuid' });
      const build = makeBuild({ gpu });
      const buildRepo = makeBuildRepoMock();
      buildRepo.find.mockResolvedValue([build]);

      const { service } = await buildModule(buildRepo);
      const result = await service.findAllUnpublishedBuildsFromUser(
        currentUser,
        'gpu-uuid',
        'gpu',
      );

      expect(result).toHaveLength(1);
      expect(result[0].build).toEqual(build);
      expect(result[0].quantity).toBe(1);
    });

    it('returns 0 quantity when the component is not in the build', async () => {
      const build = makeBuild();
      const buildRepo = makeBuildRepoMock();
      buildRepo.find.mockResolvedValue([build]);

      const { service } = await buildModule(buildRepo);
      const result = await service.findAllUnpublishedBuildsFromUser(
        currentUser,
        'nonexistent-uuid',
        'gpu',
      );

      expect(result[0].quantity).toBe(0);
    });

    it('throws BadRequestException for an unknown component type', async () => {
      const build = makeBuild();
      const buildRepo = makeBuildRepoMock();
      buildRepo.find.mockResolvedValue([build]);

      const { service } = await buildModule(buildRepo);

      await expect(
        service.findAllUnpublishedBuildsFromUser(
          currentUser,
          'some-uuid',
          'unknownType',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findComponentCountInBuild()', () => {
    it('returns 1 when a single-component (gpu) matches', async () => {
      const gpu = makeGpu({ buildcoresId: 'gpu-uuid' });
      const build = makeBuild({ gpu });

      const { service } = await buildModule();
      expect(service.findComponentCountInBuild(build, 'gpu-uuid', 'gpu')).toBe(
        1,
      );
    });

    it('returns 0 when a single-component (gpu) does not match', async () => {
      const build = makeBuild();
      const { service } = await buildModule();
      expect(service.findComponentCountInBuild(build, 'gpu-uuid', 'gpu')).toBe(
        0,
      );
    });

    it('returns the quantity for a multi-component (ram) that matches', async () => {
      const ram = makeRam({ buildcoresId: 'ram-uuid' });
      const buildRam = new BuildRam();
      buildRam.ram = ram;
      buildRam.quantity = 4;
      const build = makeBuild({ rams: [buildRam] });

      const { service } = await buildModule();
      expect(service.findComponentCountInBuild(build, 'ram-uuid', 'ram')).toBe(
        4,
      );
    });

    it('returns 0 for a multi-component (ram) with non-matching id', async () => {
      const ram = makeRam({ buildcoresId: 'ram-uuid' });
      const buildRam = new BuildRam();
      buildRam.ram = ram;
      buildRam.quantity = 2;
      const build = makeBuild({ rams: [buildRam] });

      const { service } = await buildModule();
      expect(
        service.findComponentCountInBuild(build, 'other-uuid', 'ram'),
      ).toBe(0);
    });

    it('throws BadRequestException for an unknown component type', async () => {
      const build = makeBuild();
      const { service } = await buildModule();
      expect(() =>
        service.findComponentCountInBuild(build, 'some-uuid', 'unknownType'),
      ).toThrow(BadRequestException);
    });
  });

  describe('setPublished()', () => {
    it('saves the build with the provided published value', async () => {
      const build = makeBuild({ published: false });
      const buildRepo = makeBuildRepoMock();
      buildRepo.save.mockResolvedValue({ ...build, published: true });

      const { service } = await buildModule(buildRepo);
      await service.setPublished(build, true);

      expect(build.published).toBe(true);
      expect(buildRepo.save).toHaveBeenCalledWith(build);
    });
  });

  describe('uploadBuildPhoto()', () => {
    const fakeFile = {
      buffer: Buffer.from('img'),
      mimetype: 'image/jpeg',
      size: 3,
    };
    const photoUrl =
      'https://res.cloudinary.com/demo/image/upload/v1/daedalus/builds/x.jpg';

    const mockCloudinaryService = {
      uploadImage: jest.fn(),
      deleteImage: jest.fn(),
    };

    async function buildModuleWithCloudinary(
      buildRepoOverride?: ReturnType<typeof makeBuildRepoMock>,
    ) {
      const buildRepo = buildRepoOverride ?? makeBuildRepoMock();
      const buildRamRepo = makeJoinRepoMock();
      const buildFanRepo = makeJoinRepoMock();
      const buildMonitorRepo = makeJoinRepoMock();
      const buildStorageDriveRepo = makeJoinRepoMock();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          BuildsService,
          { provide: getRepositoryToken(Build), useValue: buildRepo },
          { provide: getRepositoryToken(BuildRam), useValue: buildRamRepo },
          { provide: getRepositoryToken(BuildFan), useValue: buildFanRepo },
          {
            provide: getRepositoryToken(BuildMonitor),
            useValue: buildMonitorRepo,
          },
          {
            provide: getRepositoryToken(BuildStorageDrive),
            useValue: buildStorageDriveRepo,
          },
          { provide: ComponentsService, useValue: mockComponentsService },
          { provide: UsersService, useValue: mockUsersService },
          { provide: CloudinaryService, useValue: mockCloudinaryService },
        ],
      }).compile();

      return {
        service: module.get<BuildsService>(BuildsService),
        buildRepo,
      };
    }

    beforeEach(() => {
      mockCloudinaryService.uploadImage.mockResolvedValue(photoUrl);
      mockCloudinaryService.deleteImage.mockResolvedValue(undefined);
    });

    it('uploads the file and persists the returned URL', async () => {
      const build = makeBuild();
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);
      buildRepo.update = jest.fn().mockResolvedValue({ affected: 1 });

      const { service } = await buildModuleWithCloudinary(buildRepo);
      const result = await service.uploadBuildPhoto(1, currentUser, fakeFile);

      expect(mockCloudinaryService.uploadImage).toHaveBeenCalledWith(
        fakeFile.buffer,
      );
      expect(buildRepo.update).toHaveBeenCalledWith(1, { photoUrl });
      expect(result).toEqual({ photoUrl });
    });

    it('deletes the previous Cloudinary image when one already exists', async () => {
      const existingUrl =
        'https://res.cloudinary.com/demo/image/upload/v1/old.jpg';
      const build = makeBuild({ photoUrl: existingUrl });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);
      buildRepo.update = jest.fn().mockResolvedValue({ affected: 1 });

      const { service } = await buildModuleWithCloudinary(buildRepo);
      await service.uploadBuildPhoto(1, currentUser, fakeFile);

      expect(mockCloudinaryService.deleteImage).toHaveBeenCalledWith(
        existingUrl,
      );
    });

    it('does not call deleteImage when the build has no previous photo', async () => {
      const build = makeBuild();
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);
      buildRepo.update = jest.fn().mockResolvedValue({ affected: 1 });

      const { service } = await buildModuleWithCloudinary(buildRepo);
      await service.uploadBuildPhoto(1, currentUser, fakeFile);

      expect(mockCloudinaryService.deleteImage).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when the build belongs to another user', async () => {
      const build = makeBuild({ user: makeUser({ id: 99 }) });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);

      const { service } = await buildModuleWithCloudinary(buildRepo);

      await expect(
        service.uploadBuildPhoto(1, currentUser, fakeFile),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when the build does not exist', async () => {
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(null);

      const { service } = await buildModuleWithCloudinary(buildRepo);

      await expect(
        service.uploadBuildPhoto(999, currentUser, fakeFile),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when no file is provided', async () => {
      const build = makeBuild();
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);

      const { service } = await buildModuleWithCloudinary(buildRepo);

      await expect(
        service.uploadBuildPhoto(
          1,
          currentUser,
          null as unknown as typeof fakeFile,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteBuildPhoto()', () => {
    const photoUrl =
      'https://res.cloudinary.com/demo/image/upload/v1/daedalus/builds/x.jpg';

    const mockCloudinaryService = {
      uploadImage: jest.fn(),
      deleteImage: jest.fn(),
    };

    async function buildModuleWithCloudinary(
      buildRepoOverride?: ReturnType<typeof makeBuildRepoMock>,
    ) {
      const buildRepo = buildRepoOverride ?? makeBuildRepoMock();
      const buildRamRepo = makeJoinRepoMock();
      const buildFanRepo = makeJoinRepoMock();
      const buildMonitorRepo = makeJoinRepoMock();
      const buildStorageDriveRepo = makeJoinRepoMock();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          BuildsService,
          { provide: getRepositoryToken(Build), useValue: buildRepo },
          { provide: getRepositoryToken(BuildRam), useValue: buildRamRepo },
          { provide: getRepositoryToken(BuildFan), useValue: buildFanRepo },
          {
            provide: getRepositoryToken(BuildMonitor),
            useValue: buildMonitorRepo,
          },
          {
            provide: getRepositoryToken(BuildStorageDrive),
            useValue: buildStorageDriveRepo,
          },
          { provide: ComponentsService, useValue: mockComponentsService },
          { provide: UsersService, useValue: mockUsersService },
          { provide: CloudinaryService, useValue: mockCloudinaryService },
        ],
      }).compile();

      return {
        service: module.get<BuildsService>(BuildsService),
        buildRepo,
      };
    }

    beforeEach(() => {
      mockCloudinaryService.deleteImage.mockResolvedValue(undefined);
    });

    it('deletes the Cloudinary image and clears photoUrl in the database', async () => {
      const build = makeBuild({ photoUrl });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);
      buildRepo.update = jest.fn().mockResolvedValue({ affected: 1 });

      const { service } = await buildModuleWithCloudinary(buildRepo);
      await service.deleteBuildPhoto(1, currentUser);

      expect(mockCloudinaryService.deleteImage).toHaveBeenCalledWith(photoUrl);
      expect(buildRepo.update).toHaveBeenCalledWith(1, { photoUrl: null });
    });

    it('does not call deleteImage or update when the build has no photo', async () => {
      const build = makeBuild();
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);
      buildRepo.update = jest.fn();

      const { service } = await buildModuleWithCloudinary(buildRepo);
      await service.deleteBuildPhoto(1, currentUser);

      expect(mockCloudinaryService.deleteImage).not.toHaveBeenCalled();
      expect(buildRepo.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when the build belongs to another user', async () => {
      const build = makeBuild({ user: makeUser({ id: 99 }), photoUrl });
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(build);

      const { service } = await buildModuleWithCloudinary(buildRepo);

      await expect(service.deleteBuildPhoto(1, currentUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when the build does not exist', async () => {
      const buildRepo = makeBuildRepoMock();
      buildRepo.findOne.mockResolvedValue(null);

      const { service } = await buildModuleWithCloudinary(buildRepo);

      await expect(service.deleteBuildPhoto(999, currentUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findBuildsCount()', () => {
    it('returns the count of published builds', async () => {
      const buildRepo = makeBuildRepoMock();
      buildRepo.count = jest.fn().mockResolvedValue(7);

      const { service } = await buildModule(buildRepo);
      const result = await service.findBuildsCount();

      expect(buildRepo.count).toHaveBeenCalledWith({
        where: { published: true },
      });
      expect(result).toBe(7);
    });

    it('returns 0 when there are no published builds', async () => {
      const buildRepo = makeBuildRepoMock();
      buildRepo.count = jest.fn().mockResolvedValue(0);

      const { service } = await buildModule(buildRepo);
      const result = await service.findBuildsCount();

      expect(result).toBe(0);
    });
  });
});
