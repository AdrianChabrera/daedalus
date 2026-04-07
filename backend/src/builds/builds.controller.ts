import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BuildCreationDto } from './dtos/BuildCreation.dto';
import { BuildsService } from './builds.service';
import { BuildResponseDto } from './dtos/BuildResponse.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { SignInData } from '../auth/interfaces/auth.interfaces';
import { AuthGuard } from 'src/auth/guards/auth.guard';

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
}
