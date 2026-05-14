import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BuildsService } from 'src/builds/builds.service';
import { ComponentsService } from 'src/components/components.service';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { Review } from './entities/review.entity';
import { SignInData } from 'src/auth/interfaces/auth.interfaces';
import { ReviewCreationDto } from './dtos/review-creation.dto';
import { ReviewResponseDto } from './dtos/review-response.dto';
import { PaginatedResult } from 'src/components/interfaces/pc-components.interfaces';
import { ReviewPaginatedResult } from './interfaces/reviews.interfaces';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly buildsService: BuildsService,
    private readonly componentsService: ComponentsService,
    private readonly usersService: UsersService,
  ) {}

  async createReview(
    currentUser: SignInData,
    review: ReviewCreationDto,
  ): Promise<ReviewResponseDto> {
    if (
      (review.buildId && review.componentId) ||
      (!review.buildId && !review.componentId)
    ) {
      throw new BadRequestException(
        'A review must be created for either a build or a component, not both or neither.',
      );
    }

    const user = await this.usersService.findUserById(currentUser.userId);
    if (!user) throw new NotFoundException('Logged user not found');

    const existingReview = await this.reviewRepository.findOne({
      where: review.buildId
        ? { user: { id: currentUser.userId }, build: { id: review.buildId } }
        : {
            user: { id: currentUser.userId },
            componentId: review.componentId,
            componentType: review.componentType,
          },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this entity.');
    }

    const newReview = this.reviewRepository.create({
      user,
      stars: review.stars,
      text: review.text,
    });

    let componentName: string | undefined;
    let componentManufacturer: string | undefined;

    if (review.buildId) {
      const build = await this.buildsService.findBuildById(review.buildId);
      newReview.build = build;
    } else if (review.componentId) {
      const component = await this.componentsService.findComponentById(
        review.componentType,
        review.componentId,
      );
      newReview.componentId = review.componentId;
      newReview.componentType = review.componentType;
      componentName = component?.name ?? '';
      componentManufacturer = component?.manufacturer ?? '';
    }

    const savedReview = await this.reviewRepository.save(newReview);
    return new ReviewResponseDto(
      savedReview,
      componentName ?? '',
      componentManufacturer ?? '',
    );
  }

  async listBuildReviews(
    buildId: number,
    page: number,
    limit: number,
    currentUser?: SignInData,
  ): Promise<ReviewPaginatedResult<ReviewResponseDto>> {
    await this.buildsService.findBuildById(buildId);

    const skip = (page - 1) * limit;
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { build: { id: buildId } },
      relations: ['build', 'user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const hasCurrentUserReviewed = currentUser
      ? !!(await this.reviewRepository.findOne({
          where: { user: { id: currentUser.userId }, build: { id: buildId } },
        }))
      : undefined;

    return {
      data: reviews.map((review) => new ReviewResponseDto(review)),
      total,
      page,
      limit,
      hasCurrentUserReviewed,
    };
  }

  async listComponentReviews(
    componentId: string,
    componentType: string,
    page: number,
    limit: number,
    currentUser?: SignInData,
  ): Promise<ReviewPaginatedResult<ReviewResponseDto>> {
    const component = await this.componentsService.findComponentById(
      componentType,
      componentId,
    );

    const skip = (page - 1) * limit;
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { componentId, componentType },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const hasCurrentUserReviewed = currentUser
      ? !!(await this.reviewRepository.findOne({
          where: {
            user: { id: currentUser.userId },
            componentId,
            componentType,
          },
        }))
      : undefined;

    return {
      data: reviews.map(
        (review) =>
          new ReviewResponseDto(
            review,
            component.name ?? '',
            component.manufacturer ?? '',
          ),
      ),
      total,
      page,
      limit,
      hasCurrentUserReviewed,
    };
  }

  async listUserReviews(
    currentUser: SignInData,
    page: number,
    limit: number,
    order: string = 'createdAt-DESC',
  ): Promise<PaginatedResult<ReviewResponseDto>> {
    const validOrderFileds = ['createdAt', 'stars'];
    const [orderField, orderDir = 'DESC'] = order.split('-');

    if (!validOrderFileds.includes(orderField)) {
      throw new BadRequestException(
        `${order} param is not a valid order param`,
      );
    }

    const skip = (page - 1) * limit;
    const direction = orderDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { user: { id: currentUser.userId } },
      relations: ['build', 'build.user', 'user'],
      order: {
        [orderField]: direction,
      },
      skip,
      take: limit,
    });

    const data = await Promise.all(
      reviews.map(async (review) => {
        let componentName: string | undefined;
        let componentManufacturer: string | undefined;

        if (review.componentId) {
          const component = await this.componentsService.findComponentById(
            review.componentType,
            review.componentId,
          );
          componentName = component?.name ?? '';
          componentManufacturer = component?.manufacturer ?? '';
        }

        return new ReviewResponseDto(
          review,
          componentName,
          componentManufacturer,
        );
      }),
    );

    return { data, total, page, limit };
  }

  async deleteReview(reviewId: number, currentUser: SignInData): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['user'],
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.user.id !== currentUser.userId)
      throw new ForbiddenException(
        "You can't delete a review that isn't yours",
      );
    await this.reviewRepository.remove(review);
  }

  async getComponentRatingStats(
    componentId: string,
    componentType: string,
  ): Promise<{ average: number | null; count: number }> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.stars)', 'average')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.componentId = :componentId', { componentId })
      .andWhere('review.componentType = :componentType', { componentType })
      .getRawOne<{ average: string | null; count: string }>();

    return {
      average: result?.average
        ? parseFloat(parseFloat(result.average).toFixed(2))
        : null,
      count: parseInt(result?.count ?? '0', 10),
    };
  }
}
