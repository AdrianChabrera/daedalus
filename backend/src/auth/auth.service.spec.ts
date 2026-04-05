jest.mock('bcrypt');

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuthDto } from './dto/auth.dto';

const mockUsersService = {
  register: jest.fn(),
  findUserByName: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a user and return an AuthResult', async () => {
      const createdUser = { id: 1, username: 'alice' };
      const accessToken = 'signed.jwt.token';

      mockUsersService.register.mockResolvedValue(createdUser);
      mockJwtService.signAsync.mockResolvedValue(accessToken);

      const result = await service.register('alice', 'password123');

      expect(mockUsersService.register).toHaveBeenCalledWith(
        'alice',
        'password123',
      );
      expect(result).toEqual({
        accessToken,
        username: 'alice',
        userId: 1,
      });
    });

    it('should propagate errors thrown by UsersService.register', async () => {
      mockUsersService.register.mockRejectedValue(new Error('Username taken'));

      await expect(service.register('alice', 'password123')).rejects.toThrow(
        'Username taken',
      );
    });
  });

  describe('signIn', () => {
    it('should sign a JWT and return an AuthResult', async () => {
      const accessToken = 'signed.jwt.token';
      mockJwtService.signAsync.mockResolvedValue(accessToken);

      const result = await service.signIn({ userId: 42, username: 'bob' });

      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: 42,
        username: 'bob',
      });
      expect(result).toEqual({
        accessToken,
        username: 'bob',
        userId: 42,
      });
    });

    it('should propagate errors thrown by JwtService.signAsync', async () => {
      mockJwtService.signAsync.mockRejectedValue(new Error('JWT error'));

      await expect(
        service.signIn({ userId: 1, username: 'bob' }),
      ).rejects.toThrow('JWT error');
    });
  });

  describe('validateUser', () => {
    const input: AuthDto = { username: 'carol', password: 'secret' };

    it('should return SignInData when credentials are valid', async () => {
      const dbUser = { id: 7, username: 'carol', password: 'hashed_secret' };
      mockUsersService.findUserByName.mockResolvedValue(dbUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(input);

      expect(mockUsersService.findUserByName).toHaveBeenCalledWith('carol');
      expect(bcrypt.compare).toHaveBeenCalledWith('secret', 'hashed_secret');
      expect(result).toEqual({ userId: 7, username: 'carol' });
    });

    it('should return null when the user does not exist', async () => {
      mockUsersService.findUserByName.mockResolvedValue(null);

      const result = await service.validateUser(input);

      expect(result).toBeNull();
    });

    it('should return null when the password is incorrect', async () => {
      const dbUser = { id: 7, username: 'carol', password: 'hashed_secret' };
      mockUsersService.findUserByName.mockResolvedValue(dbUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(input);

      expect(result).toBeNull();
    });
  });

  describe('authenticate', () => {
    const input: AuthDto = { username: 'dave', password: 'pass' };

    it('should return an AuthResult when credentials are valid', async () => {
      const signInData = { userId: 99, username: 'dave' };
      const accessToken = 'valid.jwt';
      const validateUserSpy = jest
        .spyOn(service, 'validateUser')
        .mockResolvedValue(signInData);

      mockJwtService.signAsync.mockResolvedValue(accessToken);

      const result = await service.authenticate(input);

      expect(validateUserSpy).toHaveBeenCalledWith(input);
      expect(result).toEqual({
        accessToken,
        username: 'dave',
        userId: 99,
      });
    });

    it('should throw UnauthorizedException when validateUser returns null', async () => {
      const validateUserSpy = jest
        .spyOn(service, 'validateUser')
        .mockResolvedValue(null);

      await expect(service.authenticate(input)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(validateUserSpy).toHaveBeenCalledWith(input);
    });
  });
});
