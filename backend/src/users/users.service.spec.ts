jest.mock('bcrypt');

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './user.entity';

const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 1,
    username: 'alice',
    password: 'hashed_pass',
    createdAt: new Date('2024-01-01'),
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
});
