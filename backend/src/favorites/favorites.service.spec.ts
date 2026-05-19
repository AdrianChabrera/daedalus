import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FavoritesService } from './favorites.service';
import { UserFavoriteComponent } from './entities/userFavoriteComponent.entity';
import { BuildsService } from '../builds/builds.service';
import { ComponentsService } from '../components/components.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { Build } from '../builds/entities/build';
import { Component } from '../components/entities/component.entity';
import { SignInData } from '../auth/interfaces/auth.interfaces';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({ id: 1, username: 'alice', password: 'hashed', ...overrides }) as User;

const makeBuild = (overrides: Partial<Build> = {}): Build =>
  ({
    id: 10,
    name: 'My Build',
    published: true,
    user: makeUser(),
    ...overrides,
  }) as Build;

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

const mockFavRepo = {
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
};

const mockBuildsService = {
  findBuildById: jest.fn(),
  findAllBuilds: jest.fn(),
};

const mockComponentsService = {
  findAllComponents: jest.fn(),
};

const mockUsersService = {
  findUserById: jest.fn(),
  addFavoriteBuild: jest.fn(),
  removeFavoriteBuild: jest.fn(),
  findFavoriteBuildIds: jest.fn(),
};

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: getRepositoryToken(UserFavoriteComponent),
          useValue: mockFavRepo,
        },
        { provide: BuildsService, useValue: mockBuildsService },
        { provide: ComponentsService, useValue: mockComponentsService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    jest.clearAllMocks();
  });

  describe('markComponentAsFavorite', () => {
    const currentUser = makeCurrentUser();

    it('should save a new favorite component', async () => {
      mockUsersService.findUserById.mockResolvedValue(makeUser());
      mockFavRepo.save.mockResolvedValue(undefined);

      await expect(
        service.markComponentAsFavorite('comp-1', 'gpu', currentUser),
      ).resolves.toBeUndefined();

      expect(mockUsersService.findUserById).toHaveBeenCalledWith(
        currentUser.userId,
      );
      expect(mockFavRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          componentId: 'comp-1',
          componentType: 'gpu',
        }),
      );
    });

    it('should throw NotFoundException when the logged user does not exist', async () => {
      mockUsersService.findUserById.mockResolvedValue(null);

      await expect(
        service.markComponentAsFavorite('comp-1', 'gpu', currentUser),
      ).rejects.toThrow(NotFoundException);

      expect(mockFavRepo.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException on unique-constraint violation (code 23505)', async () => {
      mockUsersService.findUserById.mockResolvedValue(makeUser());
      const dbError = Object.assign(new Error('unique violation'), {
        code: '23505',
      });
      mockFavRepo.save.mockRejectedValue(dbError);

      await expect(
        service.markComponentAsFavorite('comp-1', 'gpu', currentUser),
      ).rejects.toThrow(ConflictException);
    });

    it('should rethrow unknown errors from the repository', async () => {
      mockUsersService.findUserById.mockResolvedValue(makeUser());
      mockFavRepo.save.mockRejectedValue(new Error('unexpected DB error'));

      await expect(
        service.markComponentAsFavorite('comp-1', 'gpu', currentUser),
      ).rejects.toThrow('unexpected DB error');
    });
  });

  describe('unmarkComponentAsFavorite', () => {
    const currentUser = makeCurrentUser();

    it('should delete the favorite record when it belongs to the current user', async () => {
      const fav = { id: 99, componentId: 'comp-1', user: makeUser({ id: 1 }) };
      mockFavRepo.findOne.mockResolvedValue(fav);
      mockFavRepo.delete.mockResolvedValue({ affected: 1 });

      await expect(
        service.unmarkComponentAsFavorite('comp-1', currentUser),
      ).resolves.toBeUndefined();

      expect(mockFavRepo.delete).toHaveBeenCalledWith(fav.id);
    });

    it('should throw NotFoundException when the favorite record does not exist', async () => {
      mockFavRepo.findOne.mockResolvedValue(null);

      await expect(
        service.unmarkComponentAsFavorite('comp-1', currentUser),
      ).rejects.toThrow(NotFoundException);

      expect(mockFavRepo.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when the favorite belongs to a different user', async () => {
      const fav = { id: 99, componentId: 'comp-1', user: makeUser({ id: 2 }) };
      mockFavRepo.findOne.mockResolvedValue(fav);

      await expect(
        service.unmarkComponentAsFavorite('comp-1', currentUser),
      ).rejects.toThrow(ForbiddenException);

      expect(mockFavRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('listUserFavoriteComponents', () => {
    const currentUser = makeCurrentUser();

    it('should return paginated components filtered by favorite ids', async () => {
      const favs = [{ componentId: 'a' }, { componentId: 'b' }];
      const paginatedResult = makePaginatedResult<Component>();

      mockFavRepo.find.mockResolvedValue(favs);
      mockComponentsService.findAllComponents.mockResolvedValue(
        paginatedResult,
      );

      const result = await service.listUserFavoriteComponents(
        currentUser,
        'gpu',
      );

      expect(mockFavRepo.find).toHaveBeenCalledWith({
        where: { user: { id: currentUser.userId }, componentType: 'gpu' },
        select: ['componentId'],
      });
      expect(mockComponentsService.findAllComponents).toHaveBeenCalledWith(
        'gpu',
        1,
        16,
        { ranges: {}, multiStrings: {}, booleans: {} },
        'name-ASC',
        '',
        ['a', 'b'],
      );
      expect(result).toEqual(paginatedResult);
    });

    it('should call findAllComponents with an empty allowedIds when the user has no favorites', async () => {
      mockFavRepo.find.mockResolvedValue([]);
      mockComponentsService.findAllComponents.mockResolvedValue(
        makePaginatedResult(),
      );

      await service.listUserFavoriteComponents(currentUser, 'cpu');

      expect(mockComponentsService.findAllComponents).toHaveBeenCalledWith(
        'cpu',
        1,
        16,
        { ranges: {}, multiStrings: {}, booleans: {} },
        'name-ASC',
        '',
        [],
      );
    });
  });

  describe('markBuildAsFavorite', () => {
    const currentUser = makeCurrentUser({ userId: 2 });

    it('should add a build as favorite for the current user', async () => {
      const user = makeUser({ id: 2 });
      const build = makeBuild({ user: makeUser({ id: 1 }) });

      mockUsersService.findUserById.mockResolvedValue(user);
      mockBuildsService.findBuildById.mockResolvedValue(build);
      mockUsersService.addFavoriteBuild.mockResolvedValue(undefined);

      await expect(
        service.markBuildAsFavorite(10, currentUser),
      ).resolves.toBeUndefined();

      expect(mockUsersService.addFavoriteBuild).toHaveBeenCalledWith(2, 10);
    });

    it('should throw NotFoundException when the logged user does not exist', async () => {
      mockUsersService.findUserById.mockResolvedValue(null);

      await expect(
        service.markBuildAsFavorite(10, currentUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when the user tries to favorite their own build', async () => {
      const user = makeUser({ id: 2 });
      const build = makeBuild({ user: makeUser({ id: 2 }) });

      mockUsersService.findUserById.mockResolvedValue(user);
      mockBuildsService.findBuildById.mockResolvedValue(build);

      await expect(
        service.markBuildAsFavorite(10, currentUser),
      ).rejects.toThrow(ConflictException);

      expect(mockUsersService.addFavoriteBuild).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the build is not published', async () => {
      const user = makeUser({ id: 2 });
      const build = makeBuild({ published: false, user: makeUser({ id: 1 }) });

      mockUsersService.findUserById.mockResolvedValue(user);
      mockBuildsService.findBuildById.mockResolvedValue(build);

      await expect(
        service.markBuildAsFavorite(10, currentUser),
      ).rejects.toThrow(ConflictException);

      expect(mockUsersService.addFavoriteBuild).not.toHaveBeenCalled();
    });
  });

  describe('unmarkBuildAsFavorite', () => {
    const currentUser = makeCurrentUser();

    it('should remove the build from favorites', async () => {
      mockUsersService.findUserById.mockResolvedValue(makeUser());
      mockUsersService.removeFavoriteBuild.mockResolvedValue(undefined);

      await expect(
        service.unmarkBuildAsFavorite(10, currentUser),
      ).resolves.toBeUndefined();

      expect(mockUsersService.removeFavoriteBuild).toHaveBeenCalledWith(1, 10);
    });

    it('should throw NotFoundException when the logged user does not exist', async () => {
      mockUsersService.findUserById.mockResolvedValue(null);

      await expect(
        service.unmarkBuildAsFavorite(10, currentUser),
      ).rejects.toThrow(NotFoundException);

      expect(mockUsersService.removeFavoriteBuild).not.toHaveBeenCalled();
    });
  });

  describe('listUserFavoriteBuilds', () => {
    const currentUser = makeCurrentUser();

    it('should return paginated favorite builds', async () => {
      const paginatedResult = makePaginatedResult<Build>();

      mockUsersService.findFavoriteBuildIds.mockResolvedValue([10, 20]);
      mockBuildsService.findAllBuilds.mockResolvedValue(paginatedResult);

      const result = await service.listUserFavoriteBuilds(currentUser);

      expect(mockUsersService.findFavoriteBuildIds).toHaveBeenCalledWith(
        currentUser.userId,
      );
      expect(mockBuildsService.findAllBuilds).toHaveBeenCalledWith(
        null,
        1,
        16,
        'name-ASC',
        '',
        [10, 20],
      );
      expect(result).toEqual(paginatedResult);
    });

    it('should forward custom pagination and search params', async () => {
      mockUsersService.findFavoriteBuildIds.mockResolvedValue([]);
      mockBuildsService.findAllBuilds.mockResolvedValue(makePaginatedResult());

      await service.listUserFavoriteBuilds(
        currentUser,
        2,
        8,
        'name-DESC',
        'rtx',
      );

      expect(mockBuildsService.findAllBuilds).toHaveBeenCalledWith(
        null,
        2,
        8,
        'name-DESC',
        'rtx',
        [],
      );
    });
  });
});
