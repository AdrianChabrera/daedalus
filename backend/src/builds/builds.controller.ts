import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
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
}
