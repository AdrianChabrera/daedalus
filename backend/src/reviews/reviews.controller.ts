import {
  Body,
  Controller,
  DefaultValuePipe,
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
import { ReviewsService } from './reviews.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { SignInData } from 'src/auth/interfaces/auth.interfaces';
import { ReviewCreationDto } from './dtos/review-creation.dto';
import { ReviewResponseDto } from './dtos/review-response.dto';
import { ComponentType } from 'src/components/entities/component-type.enum';
import { PaginatedResult } from 'src/components/interfaces/pc-components.interfaces';
import { OptionalAuthGuard } from 'src/auth/guards/optionalAuth.guard';
import { ReviewPaginatedResult } from './interfaces/reviews.interfaces';

const parseComponentTypePipe = new ParseEnumPipe(ComponentType);

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  @UseGuards(AuthGuard)
  async createReview(
    @CurrentUser() currentUser: SignInData,
    @Body() reviewDto: ReviewCreationDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.createReview(currentUser, reviewDto);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/builds/:bId')
  @UseGuards(OptionalAuthGuard)
  async listBuildReviews(
    @Param('bId', ParseIntPipe) buildId: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '5',
    @CurrentUser() currentUser: SignInData,
  ): Promise<ReviewPaginatedResult<ReviewResponseDto>> {
    return this.reviewsService.listBuildReviews(
      buildId,
      parseInt(page, 10),
      parseInt(limit, 10),
      currentUser,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/components/:cType/:cId')
  @UseGuards(OptionalAuthGuard)
  async listComponentReviews(
    @Param('cType', parseComponentTypePipe) componentType: ComponentType,
    @Param('cId') componentId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '5',
    @CurrentUser() currentUser: SignInData,
  ): Promise<ReviewPaginatedResult<ReviewResponseDto>> {
    return this.reviewsService.listComponentReviews(
      componentId,
      componentType,
      parseInt(page, 10),
      parseInt(limit, 10),
      currentUser,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/my-reviews')
  @UseGuards(AuthGuard)
  async listUserReviews(
    @CurrentUser() currentUser: SignInData,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '8',
    @Query('order', new DefaultValuePipe('createdAt-DESC')) order: string,
  ): Promise<PaginatedResult<ReviewResponseDto>> {
    return this.reviewsService.listUserReviews(
      currentUser,
      parseInt(page, 10),
      parseInt(limit, 10),
      order,
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/:reviewId')
  @UseGuards(AuthGuard)
  async deleteReview(
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @CurrentUser() currentUser: SignInData,
  ): Promise<void> {
    return this.reviewsService.deleteReview(reviewId, currentUser);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/components/:cType/:cId/stats')
  async getComponentRatingStats(
    @Param('cType', parseComponentTypePipe) componentType: ComponentType,
    @Param('cId') componentId: string,
  ): Promise<{ average: number | null; count: number }> {
    return this.reviewsService.getComponentRatingStats(
      componentId,
      componentType,
    );
  }
}
