import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { SignInData } from '../auth/interfaces/auth.interfaces';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { PublishService } from './publish.service';
import { BuildCreationDto } from 'src/builds/dtos/BuildCreation.dto';
import { BuildResponseDto } from 'src/builds/dtos/BuildResponse.dto';

@Controller('publish')
export class PublishController {
  constructor(private publishService: PublishService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('/')
  @UseGuards(AuthGuard)
  async createAndPublishBuild(
    @Body() buildDto: BuildCreationDto,
    @CurrentUser() currentUser: SignInData,
  ): Promise<BuildResponseDto> {
    return await this.publishService.createAndPublishBuild(
      buildDto,
      currentUser,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Patch('/:id')
  @UseGuards(AuthGuard)
  async publishBuild(
    @CurrentUser() currentUser: SignInData,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return await this.publishService.publishBuild(currentUser, id);
  }
}
