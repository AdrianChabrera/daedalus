import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findUserByName(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findUserById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async register(username: string, password: string): Promise<User> {
    const existing = await this.findUserByName(username);
    if (existing) throw new ConflictException('Username already in use');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async delete(userId: number): Promise<void> {
    await this.userRepository.delete(userId);
  }

  async addFavoriteBuild(userId: number, buildId: number): Promise<void> {
    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'favoriteBuilds')
      .of(userId)
      .add(buildId);
  }

  async removeFavoriteBuild(userId: number, buildId: number): Promise<void> {
    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'favoriteBuilds')
      .of(userId)
      .remove(buildId);
  }

  async findFavoriteBuildIds(userId: number): Promise<number[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { favoriteBuilds: true },
      select: { id: true, favoriteBuilds: { id: true } },
    });

    if (!user) throw new NotFoundException('User not found');

    return user.favoriteBuilds.map((b) => b.id);
  }
}
