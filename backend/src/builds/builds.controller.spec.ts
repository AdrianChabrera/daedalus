import { Test, TestingModule } from '@nestjs/testing';
import { BuildsController } from './builds.controller';
import { BuildsService } from './builds.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { BuildCreationDto } from './dtos/BuildCreation.dto';
import { BuildComponentAssignmentDto } from './dtos/BuildComponentAssignment.dto';
import { BuildResponseDto } from './dtos/BuildResponse.dto';
import { BuildWithComponentCountDto } from './dtos/BuildWithComponentCountDto';
import { SignInData } from '../auth/interfaces/auth.interfaces';
import { OptionalAuthGuard } from '../auth/guards/optionalAuth.guard';

const mockBuildsService: jest.Mocked<
  Pick<
    BuildsService,
    | 'createBuild'
    | 'findAllBuilds'
    | 'updateBuild'
    | 'getBuildDetailsById'
    | 'assignComponent'
    | 'removeComponent'
    | 'findAllUnpublishedBuildsFromUser'
    | 'deleteBuild'
    | 'uploadBuildPhoto'
    | 'deleteBuildPhoto'
    | 'findBuildsCount'
  >
> = {
  createBuild: jest.fn(),
  findAllBuilds: jest.fn(),
  updateBuild: jest.fn(),
  getBuildDetailsById: jest.fn(),
  assignComponent: jest.fn(),
  removeComponent: jest.fn(),
  findAllUnpublishedBuildsFromUser: jest.fn(),
  deleteBuild: jest.fn(),
  uploadBuildPhoto: jest.fn(),
  deleteBuildPhoto: jest.fn(),
  findBuildsCount: jest.fn(),
};

const mockAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };

const currentUser: SignInData = { userId: 1, username: 'alice' };

const buildDto: BuildCreationDto = {
  name: 'My Build',
  description: 'A test build',
  fanIds: [],
  monitorIds: [],
  ramIds: [],
  storageDriveIds: [],
};

const buildResponse = {
  id: 1,
  name: 'My Build',
  username: 'alice',
  published: false,
  fans: [],
  rams: [],
  monitors: [],
  storageDrives: [],
} as unknown as BuildResponseDto;

async function buildModule(): Promise<BuildsController> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [BuildsController],
    providers: [{ provide: BuildsService, useValue: mockBuildsService }],
  })
    .overrideGuard(AuthGuard)
    .useValue(mockAuthGuard)
    .overrideGuard(OptionalAuthGuard)
    .useValue(mockAuthGuard)
    .compile();

  return module.get<BuildsController>(BuildsController);
}

describe('BuildsController', () => {
  let controller: BuildsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    controller = await buildModule();
  });

  describe('createBuild()', () => {
    it('delegates to BuildsService.createBuild with the dto and current user', async () => {
      mockBuildsService.createBuild.mockResolvedValue(buildResponse);

      await controller.createBuild(buildDto, currentUser);

      expect(mockBuildsService.createBuild).toHaveBeenCalledWith(
        buildDto,
        currentUser,
      );
    });

    it('returns the BuildResponseDto from the service', async () => {
      mockBuildsService.createBuild.mockResolvedValue(buildResponse);

      const result = await controller.createBuild(buildDto, currentUser);

      expect(result).toEqual(buildResponse);
    });

    it('propagates errors thrown by the service', async () => {
      mockBuildsService.createBuild.mockRejectedValue(new Error('DB error'));

      await expect(
        controller.createBuild(buildDto, currentUser),
      ).rejects.toThrow('DB error');
    });
  });

  describe('getAllPublicBuilds()', () => {
    const paginatedResult = { data: [], total: 0, page: 1, limit: 16 };

    it('calls findAllBuilds with null user and parsed pagination params', async () => {
      mockBuildsService.findAllBuilds.mockResolvedValue(paginatedResult);

      await controller.getAllPublicBuilds('2', '8', 'name-ASC', 'rtx');

      expect(mockBuildsService.findAllBuilds).toHaveBeenCalledWith(
        null,
        2,
        8,
        'name-ASC',
        'rtx',
      );
    });

    it('uses default values when query params are omitted', async () => {
      mockBuildsService.findAllBuilds.mockResolvedValue(paginatedResult);

      await controller.getAllPublicBuilds();

      expect(mockBuildsService.findAllBuilds).toHaveBeenCalledWith(
        null,
        1,
        16,
        'name-ASC',
        '',
      );
    });

    it('returns the paginated result from the service', async () => {
      mockBuildsService.findAllBuilds.mockResolvedValue(paginatedResult);

      const result = await controller.getAllPublicBuilds();

      expect(result).toEqual(paginatedResult);
    });
  });

  describe('getMyBuilds()', () => {
    const paginatedResult = { data: [], total: 0, page: 1, limit: 16 };

    it('calls findAllBuilds with the current user and parsed params', async () => {
      mockBuildsService.findAllBuilds.mockResolvedValue(paginatedResult);

      await controller.getMyBuilds(
        '3',
        '10',
        'createdAt-DESC',
        'intel',
        currentUser,
      );

      expect(mockBuildsService.findAllBuilds).toHaveBeenCalledWith(
        currentUser,
        3,
        10,
        'createdAt-DESC',
        'intel',
      );
    });

    it('uses default values when query params are omitted', async () => {
      mockBuildsService.findAllBuilds.mockResolvedValue(paginatedResult);

      await controller.getMyBuilds('1', '16', 'name-ASC', '', currentUser);

      expect(mockBuildsService.findAllBuilds).toHaveBeenCalledWith(
        currentUser,
        1,
        16,
        'name-ASC',
        '',
      );
    });

    it('returns the paginated result from the service', async () => {
      mockBuildsService.findAllBuilds.mockResolvedValue(paginatedResult);

      const result = await controller.getMyBuilds(
        '1',
        '16',
        'name-ASC',
        '',
        currentUser,
      );

      expect(result).toEqual(paginatedResult);
    });
  });

  describe('updateBuild()', () => {
    it('delegates to BuildsService.updateBuild with the dto, current user and id', async () => {
      mockBuildsService.updateBuild.mockResolvedValue(buildResponse);

      await controller.updateBuild(buildDto, currentUser, 42);

      expect(mockBuildsService.updateBuild).toHaveBeenCalledWith(
        buildDto,
        currentUser,
        42,
      );
    });

    it('returns the updated BuildResponseDto', async () => {
      mockBuildsService.updateBuild.mockResolvedValue(buildResponse);

      const result = await controller.updateBuild(buildDto, currentUser, 42);

      expect(result).toEqual(buildResponse);
    });

    it('propagates errors thrown by the service', async () => {
      mockBuildsService.updateBuild.mockRejectedValue(new Error('Forbidden'));

      await expect(
        controller.updateBuild(buildDto, currentUser, 42),
      ).rejects.toThrow('Forbidden');
    });
  });

  describe('getBuildById()', () => {
    it('delegates to BuildsService.getBuildDetailsById with id and current user', async () => {
      mockBuildsService.getBuildDetailsById.mockResolvedValue(buildResponse);

      await controller.getBuildById(7, currentUser);

      expect(mockBuildsService.getBuildDetailsById).toHaveBeenCalledWith(
        7,
        currentUser,
      );
    });

    it('returns the BuildResponseDto from the service', async () => {
      mockBuildsService.getBuildDetailsById.mockResolvedValue(buildResponse);

      const result = await controller.getBuildById(7, currentUser);

      expect(result).toEqual(buildResponse);
    });

    it('propagates errors thrown by the service', async () => {
      mockBuildsService.getBuildDetailsById.mockRejectedValue(
        new Error('Not Found'),
      );

      await expect(controller.getBuildById(7, currentUser)).rejects.toThrow(
        'Not Found',
      );
    });
  });

  describe('assignComponent()', () => {
    const assignmentDto: BuildComponentAssignmentDto = {
      componentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      buildId: 1,
      componentType: 'cpu',
    };

    it('delegates to BuildsService.assignComponent with the dto and current user', async () => {
      mockBuildsService.assignComponent.mockResolvedValue(undefined);

      await controller.assignComponent(assignmentDto, currentUser);

      expect(mockBuildsService.assignComponent).toHaveBeenCalledWith(
        assignmentDto,
        currentUser,
      );
    });

    it('propagates errors thrown by the service', async () => {
      mockBuildsService.assignComponent.mockRejectedValue(
        new Error('Conflict'),
      );

      await expect(
        controller.assignComponent(assignmentDto, currentUser),
      ).rejects.toThrow('Conflict');
    });
  });

  describe('removeComponent()', () => {
    const assignmentDto: BuildComponentAssignmentDto = {
      componentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      buildId: 1,
      componentType: 'gpu',
    };

    it('delegates to BuildsService.removeComponent with the dto and current user', async () => {
      mockBuildsService.removeComponent.mockResolvedValue(undefined);

      await controller.removeComponent(assignmentDto, currentUser);

      expect(mockBuildsService.removeComponent).toHaveBeenCalledWith(
        assignmentDto,
        currentUser,
      );
    });

    it('propagates errors thrown by the service', async () => {
      mockBuildsService.removeComponent.mockRejectedValue(
        new Error('Not Found'),
      );

      await expect(
        controller.removeComponent(assignmentDto, currentUser),
      ).rejects.toThrow('Not Found');
    });
  });

  describe('findAllUnpublishedBuildsFromCurrentUser()', () => {
    const componentId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const componentType = 'cpu';

    it('delegates to BuildsService.findAllUnpublishedBuildsFromUser with all params', async () => {
      const result: BuildWithComponentCountDto[] = [];
      mockBuildsService.findAllUnpublishedBuildsFromUser.mockResolvedValue(
        result,
      );

      await controller.findAllUnpublishedBuildsFromCurrentUser(
        currentUser,
        componentId,
        componentType,
      );

      expect(
        mockBuildsService.findAllUnpublishedBuildsFromUser,
      ).toHaveBeenCalledWith(currentUser, componentId, componentType);
    });

    it('returns the array of BuildWithComponentCountDto from the service', async () => {
      const dto = new BuildWithComponentCountDto();
      dto.quantity = 2;
      mockBuildsService.findAllUnpublishedBuildsFromUser.mockResolvedValue([
        dto,
      ]);

      const result = await controller.findAllUnpublishedBuildsFromCurrentUser(
        currentUser,
        componentId,
        componentType,
      );

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(2);
    });

    it('propagates errors thrown by the service', async () => {
      mockBuildsService.findAllUnpublishedBuildsFromUser.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        controller.findAllUnpublishedBuildsFromCurrentUser(
          currentUser,
          componentId,
          componentType,
        ),
      ).rejects.toThrow('DB error');
    });
  });

  describe('deleteBuildById()', () => {
    it('delegates to BuildsService.deleteBuild with current user and id', async () => {
      mockBuildsService.deleteBuild.mockResolvedValue(undefined);

      await controller.deleteBuildById(currentUser, 99);

      expect(mockBuildsService.deleteBuild).toHaveBeenCalledWith(
        currentUser,
        99,
      );
    });

    it('propagates errors thrown by the service', async () => {
      mockBuildsService.deleteBuild.mockRejectedValue(new Error('Forbidden'));

      await expect(controller.deleteBuildById(currentUser, 99)).rejects.toThrow(
        'Forbidden',
      );
    });
  });

  describe('uploadBuildPhoto()', () => {
    const fakeFile = {
      buffer: Buffer.from('img'),
      mimetype: 'image/jpeg',
      size: 3,
    } as unknown as Express.Multer.File;

    it('delegates to BuildsService.uploadBuildPhoto with id, user and file', async () => {
      mockBuildsService.uploadBuildPhoto.mockResolvedValue({
        photoUrl: 'https://example.com/photo.jpg',
      });

      await controller.uploadBuildPhoto(1, currentUser, fakeFile);

      expect(mockBuildsService.uploadBuildPhoto).toHaveBeenCalledWith(
        1,
        currentUser,
        fakeFile,
      );
    });

    it('returns the photoUrl object from the service', async () => {
      const expected = { photoUrl: 'https://example.com/photo.jpg' };
      mockBuildsService.uploadBuildPhoto.mockResolvedValue(expected);

      const result = await controller.uploadBuildPhoto(
        1,
        currentUser,
        fakeFile,
      );

      expect(result).toEqual(expected);
    });

    it('propagates errors thrown by the service', async () => {
      mockBuildsService.uploadBuildPhoto.mockRejectedValue(
        new Error('Upload failed'),
      );

      await expect(
        controller.uploadBuildPhoto(1, currentUser, fakeFile),
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('deleteBuildPhoto()', () => {
    it('delegates to BuildsService.deleteBuildPhoto with id and user', async () => {
      mockBuildsService.deleteBuildPhoto.mockResolvedValue(undefined);

      await controller.deleteBuildPhoto(1, currentUser);

      expect(mockBuildsService.deleteBuildPhoto).toHaveBeenCalledWith(
        1,
        currentUser,
      );
    });

    it('returns void on success', async () => {
      mockBuildsService.deleteBuildPhoto.mockResolvedValue(undefined);

      const result = await controller.deleteBuildPhoto(1, currentUser);

      expect(result).toBeUndefined();
    });

    it('propagates errors thrown by the service', async () => {
      mockBuildsService.deleteBuildPhoto.mockRejectedValue(
        new Error('Forbidden'),
      );

      await expect(controller.deleteBuildPhoto(1, currentUser)).rejects.toThrow(
        'Forbidden',
      );
    });
  });

  describe('getBuildsCount()', () => {
    it('delegates to BuildsService.findBuildsCount', async () => {
      mockBuildsService.findBuildsCount = jest.fn().mockResolvedValue(5);

      const result = await controller.getBuildsCount();

      expect(mockBuildsService.findBuildsCount).toHaveBeenCalled();
      expect(result).toBe(5);
    });

    it('returns 0 when there are no published builds', async () => {
      mockBuildsService.findBuildsCount = jest.fn().mockResolvedValue(0);

      const result = await controller.getBuildsCount();

      expect(result).toBe(0);
    });
  });
});
