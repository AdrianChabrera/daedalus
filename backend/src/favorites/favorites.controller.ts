import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { SignInData } from '../auth/interfaces/auth.interfaces';
import { COMPONENT_FILTER_SCHEMAS } from '../components/utils/filter-schemas';
import { parseFilters } from '../components/utils/utils';
import { ComponentType } from '../components/entities/component-type.enum';

const parseComponentTypePipe = new ParseEnumPipe(ComponentType);

@Controller('favorites')
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('/components/:cType/:cId')
  @UseGuards(AuthGuard)
  async assignFavoriteComponent(
    @CurrentUser() currentUser: SignInData,
    @Param('cType', parseComponentTypePipe) componentType: ComponentType,
    @Param('cId') componentId: string,
  ): Promise<void> {
    return await this.favoritesService.markComponentAsFavorite(
      componentId,
      componentType,
      currentUser,
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/components/:cId')
  @UseGuards(AuthGuard)
  async unassignFavoriteComponent(
    @CurrentUser() currentUser: SignInData,
    @Param('cId') componentId: string,
  ): Promise<void> {
    return await this.favoritesService.unmarkComponentAsFavorite(
      componentId,
      currentUser,
    );
  }

  @Get('/components/:cType')
  @UseGuards(AuthGuard)
  async listUserFavoriteComponents(
    @CurrentUser() currentUser: SignInData,
    @Param('cType', parseComponentTypePipe) componentType: ComponentType,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '16',
    @Query('order') order: string = 'name-ASC',
    @Query('search') search: string = '',
    @Query() queryParams: Record<string, string>,
  ) {
    const type = componentType.toLowerCase();
    const schema = COMPONENT_FILTER_SCHEMAS[type] ?? {};
    const filters = parseFilters(queryParams, schema);

    return this.favoritesService.listUserFavoriteComponents(
      currentUser,
      componentType,
      parseInt(page, 10),
      parseInt(limit, 10),
      filters,
      order,
      search,
    );
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/builds/:bId')
  @UseGuards(AuthGuard)
  async assignFavoriteBuild(
    @CurrentUser() currentUser: SignInData,
    @Param('bId', ParseIntPipe) buildId: number,
  ): Promise<void> {
    return await this.favoritesService.markBuildAsFavorite(
      buildId,
      currentUser,
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/builds/:bId')
  @UseGuards(AuthGuard)
  async unassignFavoriteBuild(
    @CurrentUser() currentUser: SignInData,
    @Param('bId', ParseIntPipe) buildId: number,
  ): Promise<void> {
    return await this.favoritesService.unmarkBuildAsFavorite(
      buildId,
      currentUser,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/builds')
  @UseGuards(AuthGuard)
  async listUserFavoriteBuilds(
    @CurrentUser() currentUser: SignInData,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '16',
    @Query('order') order: string = 'name-ASC',
    @Query('search') search: string = '',
  ) {
    return this.favoritesService.listUserFavoriteBuilds(
      currentUser,
      parseInt(page, 10),
      parseInt(limit, 10),
      order,
      search,
    );
  }
}
