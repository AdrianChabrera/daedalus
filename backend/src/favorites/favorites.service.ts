import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SignInData } from 'src/auth/interfaces/auth.interfaces';
import { BuildsService } from 'src/builds/builds.service';
import { ComponentsService } from 'src/components/components.service';
import { UserFavoriteComponent } from './entities/userFavoriteComponent.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { Component } from 'src/components/entities/component.entity';
import { Build } from 'src/builds/entities/build';
import {
  PaginatedResult,
  ParsedFilters,
} from 'src/components/interfaces/pc-components.interfaces';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(UserFavoriteComponent)
    private readonly userFavoriteComponentRepository: Repository<UserFavoriteComponent>,
    private readonly buildsService: BuildsService,
    private readonly componentsService: ComponentsService,
    private readonly usersService: UsersService,
  ) {}

  async markComponentAsFavorite(
    componentId: string,
    componentType: string,
    currentUser: SignInData,
  ): Promise<void> {
    const fav = new UserFavoriteComponent();

    const user = await this.usersService.findUserById(currentUser.userId);
    if (!user) throw new NotFoundException('Logged user not found');

    fav.componentId = componentId;
    fav.componentType = componentType;
    fav.user = user;

    try {
      await this.userFavoriteComponentRepository.save(fav);
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (e instanceof Error && 'code' in e && (e as any).code === '23505')
        throw new ConflictException('Component already marked as favorite');
      throw e;
    }
  }

  async unmarkComponentAsFavorite(
    componentId: string,
    currentUser: SignInData,
  ): Promise<void> {
    const userFavoriteComponent =
      await this.userFavoriteComponentRepository.findOne({
        where: {
          user: { id: currentUser.userId },
          componentId: componentId,
        },
        relations: { user: true },
      });

    if (!userFavoriteComponent)
      throw new NotFoundException('Favorite component assignment not found');

    if (!currentUser || currentUser.userId !== userFavoriteComponent.user.id) {
      throw new ForbiddenException(
        "You didn't assign this component as a favorite",
      );
    }

    await this.userFavoriteComponentRepository.delete(userFavoriteComponent.id);
  }

  async listUserFavoriteComponents(
    currentUser: SignInData,
    componentType: string,
    page: number = 1,
    limit: number = 16,
    filters: ParsedFilters = { ranges: {}, multiStrings: {}, booleans: {} },
    order: string = 'name-ASC',
    search: string = '',
  ): Promise<PaginatedResult<Component>> {
    const userFavoriteComponents =
      await this.userFavoriteComponentRepository.find({
        where: {
          user: { id: currentUser.userId },
          componentType: componentType,
        },
        select: ['componentId'],
      });

    const allowedIds = userFavoriteComponents.map((c) => c.componentId);

    return this.componentsService.findAllComponents(
      componentType,
      page,
      limit,
      filters,
      order,
      search,
      allowedIds,
    );
  }

  async markBuildAsFavorite(
    buildId: number,
    currentUser: SignInData,
  ): Promise<void> {
    const user = await this.usersService.findUserById(currentUser.userId);
    if (!user) throw new NotFoundException('Logged user not found');

    const build = await this.buildsService.findBuildById(buildId);

    if (build.user.id === user.id) {
      throw new ConflictException("You can't favorite a build that is yours");
    }

    if (!build.published) {
      throw new ConflictException("You can't favorite a private build");
    }

    await this.usersService.addFavoriteBuild(currentUser.userId, buildId);
  }

  async unmarkBuildAsFavorite(
    buildId: number,
    currentUser: SignInData,
  ): Promise<void> {
    const user = await this.usersService.findUserById(currentUser.userId);
    if (!user) throw new NotFoundException('Logged user not found');

    await this.usersService.removeFavoriteBuild(currentUser.userId, buildId);
  }

  async listUserFavoriteBuilds(
    currentUser: SignInData,
    page: number = 1,
    limit: number = 16,
    order: string = 'name-ASC',
    search: string = '',
  ): Promise<PaginatedResult<Build>> {
    const allowedIds = await this.usersService.findFavoriteBuildIds(
      currentUser.userId,
    );

    return this.buildsService.findAllBuilds(
      null,
      page,
      limit,
      order,
      search,
      allowedIds,
    );
  }
}
