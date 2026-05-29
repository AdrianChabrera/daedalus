import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuthGuard } from './guards/auth.guard';
import { AuthDto } from './dtos/auth.dto';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception';

const mockAuthService = {
  authenticate: jest.fn(),
  register: jest.fn(),
};

const mockUsersService = {
  findUserByName: jest.fn(),
  delete: jest.fn(),
  getUserStats: jest.fn(),
};

const mockAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('login', () => {
    const input: AuthDto = { username: 'alice', password: 'pass' };

    it('should call AuthService.authenticate with the input and return the result', async () => {
      const authResult = { accessToken: 'tok', username: 'alice', userId: 1 };
      mockAuthService.authenticate.mockResolvedValue(authResult);

      const result = await controller.login(input);

      expect(mockAuthService.authenticate).toHaveBeenCalledWith(input);
      expect(result).toEqual(authResult);
    });

    it('should propagate errors thrown by AuthService.authenticate', async () => {
      mockAuthService.authenticate.mockRejectedValue(new Error('Unauthorized'));

      await expect(controller.login(input)).rejects.toThrow('Unauthorized');
    });
  });

  describe('register', () => {
    const input: AuthDto = { username: 'bob', password: 'secret' };

    it('should call AuthService.register with username and password and return the result', async () => {
      const authResult = { accessToken: 'tok', username: 'bob', userId: 2 };
      mockAuthService.register.mockResolvedValue(authResult);

      const result = await controller.register(input);

      expect(mockAuthService.register).toHaveBeenCalledWith('bob', 'secret');
      expect(result).toEqual(authResult);
    });

    it('should propagate errors thrown by AuthService.register', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Username taken'));

      await expect(controller.register(input)).rejects.toThrow(
        'Username taken',
      );
    });
  });

  describe('getUserInfo', () => {
    const currentUser = { userId: 3, username: 'carol' };

    it('should call UsersService.findUserByName with the current user username', async () => {
      const userRecord = { id: 3, username: 'carol', password: 'hashed' };
      mockUsersService.findUserByName.mockResolvedValue(userRecord);

      const result = await controller.getUserInfo(currentUser);

      expect(mockUsersService.findUserByName).toHaveBeenCalledWith('carol');
      expect(result).toEqual({ userId: 3, username: 'carol' });
    });

    it('should throw UnauthorizedException when the user is not found', async () => {
      mockUsersService.findUserByName.mockResolvedValue(null);

      await expect(controller.getUserInfo(currentUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('delete', () => {
    const currentUser = { userId: 4, username: 'dave' };

    it('should call UsersService.delete with the current user id', async () => {
      mockUsersService.delete.mockResolvedValue(undefined);

      await controller.delete(currentUser);

      expect(mockUsersService.delete).toHaveBeenCalledWith(4);
    });

    it('should propagate errors thrown by UsersService.delete', async () => {
      mockUsersService.delete.mockRejectedValue(new Error('User not found'));

      await expect(controller.delete(currentUser)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('getUserStats', () => {
    const currentUser = { userId: 5, username: 'eve' };

    it('should call UsersService.getUserStats with the current user id and return the result', async () => {
      const stats = {
        buildsCount: 3,
        favoriteBuildsCount: 2,
        favoriteComponentsCount: 5,
        reviewsCount: 1,
        memberSince: new Date('2024-01-01'),
      };
      mockUsersService.getUserStats.mockResolvedValue(stats);

      const result = await controller.getUserStats(currentUser);

      expect(mockUsersService.getUserStats).toHaveBeenCalledWith(5);
      expect(result).toEqual(stats);
    });

    it('should propagate NotFoundException when the user does not exist', async () => {
      mockUsersService.getUserStats.mockRejectedValue(
        new NotFoundException('Logged user not found'),
      );

      await expect(controller.getUserStats(currentUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
