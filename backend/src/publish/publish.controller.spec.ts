import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { PublishController } from './publish.controller';
import { PublishService } from './publish.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { BuildCreationDto } from 'src/builds/dtos/BuildCreation.dto';
import { BuildResponseDto } from 'src/builds/dtos/BuildResponse.dto';
import { SignInData } from '../auth/interfaces/auth.interfaces';

const mockPublishService: jest.Mocked<
  Pick<PublishService, 'createAndPublishBuild' | 'publishBuild'>
> = {
  createAndPublishBuild: jest.fn(),
  publishBuild: jest.fn(),
};

const mockAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };

const currentUser: SignInData = { userId: 1, username: 'alice' };

const buildDto: BuildCreationDto = {
  name: 'My Published Build',
  description: 'A fully assembled build',
  fanIds: [],
  monitorIds: [],
  ramIds: [],
  storageDriveIds: [],
};

const buildResponse = {
  id: 1,
  name: 'My Published Build',
  username: 'alice',
  published: true,
  fans: [],
  rams: [],
  monitors: [],
  storageDrives: [],
} as unknown as BuildResponseDto;

async function buildModule(): Promise<PublishController> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [PublishController],
    providers: [{ provide: PublishService, useValue: mockPublishService }],
  })
    .overrideGuard(AuthGuard)
    .useValue(mockAuthGuard)
    .compile();

  return module.get<PublishController>(PublishController);
}

describe('PublishController', () => {
  let controller: PublishController;

  beforeEach(async () => {
    jest.clearAllMocks();
    controller = await buildModule();
  });

  describe('createAndPublishBuild()', () => {
    it('delegates to PublishService.createAndPublishBuild with the dto and current user', async () => {
      mockPublishService.createAndPublishBuild.mockResolvedValue(buildResponse);

      await controller.createAndPublishBuild(buildDto, currentUser);

      expect(mockPublishService.createAndPublishBuild).toHaveBeenCalledWith(
        buildDto,
        currentUser,
      );
    });

    it('returns the BuildResponseDto with isPublished set to true', async () => {
      mockPublishService.createAndPublishBuild.mockResolvedValue(buildResponse);

      const result = await controller.createAndPublishBuild(
        buildDto,
        currentUser,
      );

      expect(result).toEqual(buildResponse);
      expect(result.published).toBe(true);
    });

    it('propagates ConflictException when the build has compatibility errors', async () => {
      mockPublishService.createAndPublishBuild.mockRejectedValue(
        new ConflictException(
          "You can't publish a build with compatibility errors.",
        ),
      );

      await expect(
        controller.createAndPublishBuild(buildDto, currentUser),
      ).rejects.toThrow(ConflictException);
    });

    it('propagates ConflictException when mandatory components are missing', async () => {
      mockPublishService.createAndPublishBuild.mockRejectedValue(
        new ConflictException(
          'Some mandatory components are missing. The following components must be included in order to publish the build: cpu, gpu.',
        ),
      );

      await expect(
        controller.createAndPublishBuild(buildDto, currentUser),
      ).rejects.toThrow(ConflictException);
    });

    it('propagates generic errors thrown by the service', async () => {
      mockPublishService.createAndPublishBuild.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        controller.createAndPublishBuild(buildDto, currentUser),
      ).rejects.toThrow('DB error');
    });
  });

  describe('publishBuild()', () => {
    it('delegates to PublishService.publishBuild with the current user and id', async () => {
      mockPublishService.publishBuild.mockResolvedValue(undefined);

      await controller.publishBuild(currentUser, 42);

      expect(mockPublishService.publishBuild).toHaveBeenCalledWith(
        currentUser,
        42,
      );
    });

    it('returns void on success', async () => {
      mockPublishService.publishBuild.mockResolvedValue(undefined);

      const result = await controller.publishBuild(currentUser, 42);

      expect(result).toBeUndefined();
    });

    it('propagates UnauthorizedException when the build does not belong to the current user', async () => {
      mockPublishService.publishBuild.mockRejectedValue(
        new UnauthorizedException(
          "You can't publish a build that is not yours.",
        ),
      );

      await expect(controller.publishBuild(currentUser, 42)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('propagates ConflictException when the build is already published', async () => {
      mockPublishService.publishBuild.mockRejectedValue(
        new ConflictException('This build is already published'),
      );

      await expect(controller.publishBuild(currentUser, 42)).rejects.toThrow(
        ConflictException,
      );
    });

    it('propagates ConflictException when the build has compatibility errors', async () => {
      mockPublishService.publishBuild.mockRejectedValue(
        new ConflictException(
          "You can't publish a build with compatibility errors.",
        ),
      );

      await expect(controller.publishBuild(currentUser, 42)).rejects.toThrow(
        ConflictException,
      );
    });

    it('propagates generic errors thrown by the service', async () => {
      mockPublishService.publishBuild.mockRejectedValue(new Error('Not Found'));

      await expect(controller.publishBuild(currentUser, 42)).rejects.toThrow(
        'Not Found',
      );
    });
  });
});
