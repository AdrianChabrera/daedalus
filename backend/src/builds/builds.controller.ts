import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BuildCreationDto } from './dtos/BuildCreation.dto';
import { BuildsService } from './builds.service';
import { BuildResponseDto } from './dtos/BuildResponse.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { SignInData } from '../auth/interfaces/auth.interfaces';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { BuildComponentAssignmentDto } from './dtos/BuildComponentAssignment.dto';
import { BuildWithComponentCountDto } from './dtos/BuildWithComponentCountDto';

@Controller('builds')
export class BuildsController {
  constructor(private buildsService: BuildsService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('/')
  @UseGuards(AuthGuard)
  async createBuild(
    @Body() buildDto: BuildCreationDto,
    @CurrentUser() currentUser: SignInData,
  ): Promise<BuildResponseDto> {
    return await this.buildsService.createBuild(buildDto, currentUser);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/')
  async getAllPublicBuilds(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '16',
    @Query('order') order: string = 'name-ASC',
    @Query('search') search: string = '',
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    return await this.buildsService.findAllBuilds(
      null,
      pageNumber,
      limitNumber,
      order,
      search,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/my-builds')
  @UseGuards(AuthGuard)
  async getMyBuilds(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '16',
    @Query('order') order: string = 'name-ASC',
    @Query('search') search: string = '',
    @CurrentUser() currentUser: SignInData,
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    return await this.buildsService.findAllBuilds(
      currentUser,
      pageNumber,
      limitNumber,
      order,
      search,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Put('/:id')
  @UseGuards(AuthGuard)
  async updateBuild(
    @Body() buildDto: BuildCreationDto,
    @CurrentUser() currentUser: SignInData,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BuildResponseDto> {
    return await this.buildsService.updateBuild(buildDto, currentUser, id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/:id')
  @UseGuards(AuthGuard)
  async getBuildById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: SignInData,
  ): Promise<BuildResponseDto> {
    return await this.buildsService.getBuildDetailsById(id, currentUser);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch('/assign_component')
  @UseGuards(AuthGuard)
  async assignComponent(
    @Body() assignmentDto: BuildComponentAssignmentDto,
    @CurrentUser() currentUser: SignInData,
  ): Promise<void> {
    return await this.buildsService.assignComponent(assignmentDto, currentUser);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch('/remove_component')
  @UseGuards(AuthGuard)
  async removeComponent(
    @Body() assignmentDto: BuildComponentAssignmentDto,
    @CurrentUser() currentUser: SignInData,
  ): Promise<void> {
    return await this.buildsService.removeComponent(assignmentDto, currentUser);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/unpublished/:cType/:cId')
  @UseGuards(AuthGuard)
  async findAllUnpublishedBuildsFromCurrentUser(
    @CurrentUser() currentUser: SignInData,
    @Param('cId') componentId: string,
    @Param('cType') componentType: string,
  ): Promise<BuildWithComponentCountDto[]> {
    return await this.buildsService.findAllUnpublishedBuildsFromUser(
      currentUser,
      componentId,
      componentType,
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/:id')
  @UseGuards(AuthGuard)
  async deleteBuildById(
    @CurrentUser() currentUser: SignInData,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return await this.buildsService.deleteBuild(currentUser, id);
  }
}
