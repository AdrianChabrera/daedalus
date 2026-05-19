import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ComponentType } from '../components/entities/component-type.enum';
import { SignInData } from '../auth/interfaces/auth.interfaces';
import { Build } from '../builds/entities/build';
import { Component } from '../components/entities/component.entity';

const makeCurrentUser = (overrides: Partial<SignInData> = {}): SignInData => ({
  userId: 1,
  username: 'alice',
  ...overrides,
});

const makePaginatedResult = <T>(items: T[] = []) => ({
  data: items,
  total: items.length,
  page: 1,
  limit: 16,
});

const mockFavoritesService = {
  markComponentAsFavorite: jest.fn(),
  unmarkComponentAsFavorite: jest.fn(),
  listUserFavoriteComponents: jest.fn(),
  markBuildAsFavorite: jest.fn(),
  unmarkBuildAsFavorite: jest.fn(),
  listUserFavoriteBuilds: jest.fn(),
};

describe('FavoritesController', () => {
  let controller: FavoritesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [
        { provide: FavoritesService, useValue: mockFavoritesService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FavoritesController>(FavoritesController);
    jest.clearAllMocks();
  });

  describe('assignFavoriteComponent', () => {
    it('should call markComponentAsFavorite with the correct arguments', async () => {
      const currentUser = makeCurrentUser();
      mockFavoritesService.markComponentAsFavorite.mockResolvedValue(undefined);

      await controller.assignFavoriteComponent(
        currentUser,
        ComponentType.GPU,
        'comp-42',
      );

      expect(mockFavoritesService.markComponentAsFavorite).toHaveBeenCalledWith(
        'comp-42',
        ComponentType.GPU,
        currentUser,
      );
    });

    it('should propagate exceptions thrown by the service', async () => {
      mockFavoritesService.markComponentAsFavorite.mockRejectedValue(
        new Error('service error'),
      );

      await expect(
        controller.assignFavoriteComponent(
          makeCurrentUser(),
          ComponentType.GPU,
          'comp-42',
        ),
      ).rejects.toThrow('service error');
    });
  });

  describe('unassignFavoriteComponent', () => {
    it('should call unmarkComponentAsFavorite with the correct arguments', async () => {
      const currentUser = makeCurrentUser();
      mockFavoritesService.unmarkComponentAsFavorite.mockResolvedValue(
        undefined,
      );

      await controller.unassignFavoriteComponent(currentUser, 'comp-42');

      expect(
        mockFavoritesService.unmarkComponentAsFavorite,
      ).toHaveBeenCalledWith('comp-42', currentUser);
    });
  });

  describe('listUserFavoriteComponents', () => {
    it('should call listUserFavoriteComponents with defaults and return paginated result', async () => {
      const currentUser = makeCurrentUser();
      const paginatedResult = makePaginatedResult<Component>();
      mockFavoritesService.listUserFavoriteComponents.mockResolvedValue(
        paginatedResult,
      );

      const result = await controller.listUserFavoriteComponents(
        currentUser,
        ComponentType.GPU,
        '1',
        '16',
        'name-ASC',
        '',
        {},
      );

      expect(
        mockFavoritesService.listUserFavoriteComponents,
      ).toHaveBeenCalledWith(
        currentUser,
        ComponentType.GPU,
        1,
        16,
        expect.objectContaining({ ranges: {}, multiStrings: {}, booleans: {} }),
        'name-ASC',
        '',
      );
      expect(result).toEqual(paginatedResult);
    });

    it('should parse page and limit as integers', async () => {
      mockFavoritesService.listUserFavoriteComponents.mockResolvedValue(
        makePaginatedResult(),
      );

      await controller.listUserFavoriteComponents(
        makeCurrentUser(),
        ComponentType.CPU,
        '3',
        '8',
        'name-DESC',
        'rtx',
        {},
      );

      expect(
        mockFavoritesService.listUserFavoriteComponents,
      ).toHaveBeenCalledWith(
        expect.anything(),
        ComponentType.CPU,
        3,
        8,
        expect.any(Object),
        'name-DESC',
        'rtx',
      );
    });
  });

  describe('assignFavoriteBuild', () => {
    it('should call markBuildAsFavorite with the correct arguments', async () => {
      const currentUser = makeCurrentUser();
      mockFavoritesService.markBuildAsFavorite.mockResolvedValue(undefined);

      await controller.assignFavoriteBuild(currentUser, 10);

      expect(mockFavoritesService.markBuildAsFavorite).toHaveBeenCalledWith(
        10,
        currentUser,
      );
    });

    it('should propagate exceptions thrown by the service', async () => {
      mockFavoritesService.markBuildAsFavorite.mockRejectedValue(
        new Error('conflict'),
      );

      await expect(
        controller.assignFavoriteBuild(makeCurrentUser(), 10),
      ).rejects.toThrow('conflict');
    });
  });

  describe('unassignFavoriteBuild', () => {
    it('should call unmarkBuildAsFavorite with the correct arguments', async () => {
      const currentUser = makeCurrentUser();
      mockFavoritesService.unmarkBuildAsFavorite.mockResolvedValue(undefined);

      await controller.unassignFavoriteBuild(currentUser, 10);

      expect(mockFavoritesService.unmarkBuildAsFavorite).toHaveBeenCalledWith(
        10,
        currentUser,
      );
    });
  });

  describe('listUserFavoriteBuilds', () => {
    it('should call listUserFavoriteBuilds with defaults and return paginated result', async () => {
      const currentUser = makeCurrentUser();
      const paginatedResult = makePaginatedResult<Build>();
      mockFavoritesService.listUserFavoriteBuilds.mockResolvedValue(
        paginatedResult,
      );

      const result = await controller.listUserFavoriteBuilds(
        currentUser,
        '1',
        '16',
        'name-ASC',
        '',
      );

      expect(mockFavoritesService.listUserFavoriteBuilds).toHaveBeenCalledWith(
        currentUser,
        1,
        16,
        'name-ASC',
        '',
      );
      expect(result).toEqual(paginatedResult);
    });

    it('should parse page and limit as integers', async () => {
      mockFavoritesService.listUserFavoriteBuilds.mockResolvedValue(
        makePaginatedResult(),
      );

      await controller.listUserFavoriteBuilds(
        makeCurrentUser(),
        '2',
        '8',
        'name-DESC',
        'build name',
      );

      expect(mockFavoritesService.listUserFavoriteBuilds).toHaveBeenCalledWith(
        expect.anything(),
        2,
        8,
        'name-DESC',
        'build name',
      );
    });
  });
});
