jest.mock('bcrypt');

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Build } from 'src/builds/entities/build';

const mockRelationQueryBuilder = {
  relation: jest.fn().mockReturnThis(),
  of: jest.fn().mockReturnThis(),
  add: jest.fn(),
  remove: jest.fn(),
};

const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => mockRelationQueryBuilder),
};

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 1,
    username: 'alice',
    password: 'hashed_pass',
    createdAt: new Date('2024-01-01'),
    favoriteBuilds: [],
    ...overrides,
  }) as User;

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();

    mockRelationQueryBuilder.relation.mockReturnThis();
    mockRelationQueryBuilder.of.mockReturnThis();
  });

  describe('findUserByName', () => {
    it('should return a user when found', async () => {
      const user = makeUser();
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findUserByName('alice');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'alice' },
      });
      expect(result).toEqual(user);
    });

    it('should return null when user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findUserByName('ghost');

      expect(result).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should return a user when found', async () => {
      const user = makeUser();
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findUserById(1);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(user);
    });

    it('should return null when user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findUserById(999);

      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('should hash the password, create and save a new user', async () => {
      const newUser = makeUser({ username: 'bob', password: 'hashed_secret' });

      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_secret');
      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);

      const result = await service.register('bob', 'secret');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'bob' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('secret', 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        username: 'bob',
        password: 'hashed_secret',
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(newUser);
      expect(result).toEqual(newUser);
    });

    it('should throw ConflictException when username is already taken', async () => {
      mockUserRepository.findOne.mockResolvedValue(makeUser());

      await expect(service.register('alice', 'anypass')).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should call repository.delete with the given userId', async () => {
      mockUserRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(1);

      expect(mockUserRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should propagate errors thrown by the repository', async () => {
      mockUserRepository.delete.mockRejectedValue(new Error('DB error'));

      await expect(service.delete(1)).rejects.toThrow('DB error');
    });
  });

  describe('addFavoriteBuild', () => {
    it('should add the build relation for the given user', async () => {
      mockRelationQueryBuilder.add.mockResolvedValue(undefined);

      await service.addFavoriteBuild(1, 10);

      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockRelationQueryBuilder.relation).toHaveBeenCalledWith(
        User,
        'favoriteBuilds',
      );
      expect(mockRelationQueryBuilder.of).toHaveBeenCalledWith(1);
      expect(mockRelationQueryBuilder.add).toHaveBeenCalledWith(10);
    });

    it('should propagate errors from the query builder', async () => {
      mockRelationQueryBuilder.add.mockRejectedValue(
        new Error('relation error'),
      );

      await expect(service.addFavoriteBuild(1, 10)).rejects.toThrow(
        'relation error',
      );
    });
  });

  describe('removeFavoriteBuild', () => {
    it('should remove the build relation for the given user', async () => {
      mockRelationQueryBuilder.remove.mockResolvedValue(undefined);

      await service.removeFavoriteBuild(1, 10);

      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockRelationQueryBuilder.relation).toHaveBeenCalledWith(
        User,
        'favoriteBuilds',
      );
      expect(mockRelationQueryBuilder.of).toHaveBeenCalledWith(1);
      expect(mockRelationQueryBuilder.remove).toHaveBeenCalledWith(10);
    });

    it('should propagate errors from the query builder', async () => {
      mockRelationQueryBuilder.remove.mockRejectedValue(
        new Error('remove error'),
      );

      await expect(service.removeFavoriteBuild(1, 10)).rejects.toThrow(
        'remove error',
      );
    });
  });

  describe('findFavoriteBuildIds', () => {
    it('should return an array of favorite build ids for the user', async () => {
      const user = makeUser({
        favoriteBuilds: [{ id: 10 }, { id: 20 }] as Build[],
      });
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findFavoriteBuildIds(1);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { favoriteBuilds: true },
        select: { id: true, favoriteBuilds: { id: true } },
      });
      expect(result).toEqual([10, 20]);
    });

    it('should return an empty array when the user has no favorite builds', async () => {
      const user = makeUser({ favoriteBuilds: [] });
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findFavoriteBuildIds(1);

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when the user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findFavoriteBuildIds(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserStats', () => {
    const mockDate = new Date('2024-01-01');

    const makeCountQB = (count: string) => ({
      relation: jest.fn().mockReturnThis(),
      of: jest.fn().mockReturnThis(),
      add: jest.fn(),
      remove: jest.fn(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ count }),
    });

    it('should return stats for a valid user', async () => {
      const user = makeUser({ createdAt: mockDate });
      mockUserRepository.findOne.mockResolvedValue(user);

      mockUserRepository.createQueryBuilder
        .mockReturnValueOnce(makeCountQB('3'))
        .mockReturnValueOnce(makeCountQB('2'))
        .mockReturnValueOnce(makeCountQB('5'))
        .mockReturnValueOnce(makeCountQB('1'));

      const result = await service.getUserStats(1);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, createdAt: true },
      });
      expect(result).toEqual({
        buildsCount: 3,
        favoriteBuildsCount: 2,
        favoriteComponentsCount: 5,
        reviewsCount: 1,
        memberSince: mockDate,
      });
    });

    it('should throw NotFoundException when the user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserStats(999)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUserRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should return zero counts when user has no related data', async () => {
      const user = makeUser({ createdAt: mockDate });
      mockUserRepository.findOne.mockResolvedValue(user);

      mockUserRepository.createQueryBuilder
        .mockReturnValueOnce(makeCountQB('0'))
        .mockReturnValueOnce(makeCountQB('0'))
        .mockReturnValueOnce(makeCountQB('0'))
        .mockReturnValueOnce(makeCountQB('0'));

      const result = await service.getUserStats(1);

      expect(result).toEqual({
        buildsCount: 0,
        favoriteBuildsCount: 0,
        favoriteComponentsCount: 0,
        reviewsCount: 0,
        memberSince: mockDate,
      });
    });
  });
});
