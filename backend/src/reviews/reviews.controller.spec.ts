import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optionalAuth.guard';
import { SignInData } from '../auth/interfaces/auth.interfaces';
import { ReviewCreationDto } from './dtos/review-creation.dto';
import { ReviewResponseDto } from './dtos/review-response.dto';
import { ComponentType } from '../components/entities/component-type.enum';

const mockReviewsService: jest.Mocked<
  Pick<
    ReviewsService,
    | 'createReview'
    | 'listBuildReviews'
    | 'listComponentReviews'
    | 'listUserReviews'
    | 'deleteReview'
    | 'getComponentRatingStats'
  >
> = {
  createReview: jest.fn(),
  listBuildReviews: jest.fn(),
  listComponentReviews: jest.fn(),
  listUserReviews: jest.fn(),
  deleteReview: jest.fn(),
  getComponentRatingStats: jest.fn(),
};

const mockAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };

const currentUser: SignInData = { userId: 1, username: 'alice' };

const fakeReviewResponse = {
  id: 1,
  stars: 5,
  text: 'Great!',
  username: 'alice',
} as unknown as ReviewResponseDto;

const paginatedResult = {
  data: [fakeReviewResponse],
  total: 1,
  page: 1,
  limit: 5,
  hasCurrentUserReviewed: false,
};

async function buildModule(): Promise<ReviewsController> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [ReviewsController],
    providers: [{ provide: ReviewsService, useValue: mockReviewsService }],
  })
    .overrideGuard(AuthGuard)
    .useValue(mockAuthGuard)
    .overrideGuard(OptionalAuthGuard)
    .useValue(mockAuthGuard)
    .compile();

  return module.get<ReviewsController>(ReviewsController);
}

describe('ReviewsController', () => {
  let controller: ReviewsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    controller = await buildModule();
  });

  describe('createReview()', () => {
    const reviewDto: ReviewCreationDto = {
      stars: 5,
      text: 'Excellent build!',
      buildId: 1,
      componentId: undefined,
      componentType: undefined,
    } as unknown as ReviewCreationDto;

    it('delegates to ReviewsService.createReview with currentUser and dto', async () => {
      mockReviewsService.createReview.mockResolvedValue(fakeReviewResponse);

      await controller.createReview(currentUser, reviewDto);

      expect(mockReviewsService.createReview).toHaveBeenCalledWith(
        currentUser,
        reviewDto,
      );
    });

    it('returns the ReviewResponseDto from the service', async () => {
      mockReviewsService.createReview.mockResolvedValue(fakeReviewResponse);

      const result = await controller.createReview(currentUser, reviewDto);

      expect(result).toEqual(fakeReviewResponse);
    });

    it('propagates errors thrown by the service', async () => {
      mockReviewsService.createReview.mockRejectedValue(new Error('Conflict'));

      await expect(
        controller.createReview(currentUser, reviewDto),
      ).rejects.toThrow('Conflict');
    });
  });

  describe('listBuildReviews()', () => {
    it('delegates to ReviewsService.listBuildReviews with parsed params', async () => {
      mockReviewsService.listBuildReviews.mockResolvedValue(paginatedResult);

      await controller.listBuildReviews(1, '2', '10', currentUser);

      expect(mockReviewsService.listBuildReviews).toHaveBeenCalledWith(
        1,
        2,
        10,
        currentUser,
      );
    });

    it('uses default page=1 and limit=5 when not provided', async () => {
      mockReviewsService.listBuildReviews.mockResolvedValue(paginatedResult);

      await controller.listBuildReviews(1, '1', '5', currentUser);

      expect(mockReviewsService.listBuildReviews).toHaveBeenCalledWith(
        1,
        1,
        5,
        currentUser,
      );
    });

    it('returns the paginated result from the service', async () => {
      mockReviewsService.listBuildReviews.mockResolvedValue(paginatedResult);

      const result = await controller.listBuildReviews(
        1,
        '1',
        '5',
        currentUser,
      );

      expect(result).toEqual(paginatedResult);
    });

    it('propagates errors thrown by the service', async () => {
      mockReviewsService.listBuildReviews.mockRejectedValue(
        new Error('Not Found'),
      );

      await expect(
        controller.listBuildReviews(999, '1', '5', currentUser),
      ).rejects.toThrow('Not Found');
    });
  });

  describe('listComponentReviews()', () => {
    const componentId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const componentType = ComponentType.GPU;

    it('delegates to ReviewsService.listComponentReviews with parsed params', async () => {
      mockReviewsService.listComponentReviews.mockResolvedValue(
        paginatedResult,
      );

      await controller.listComponentReviews(
        componentType,
        componentId,
        '2',
        '10',
        currentUser,
      );

      expect(mockReviewsService.listComponentReviews).toHaveBeenCalledWith(
        componentId,
        componentType,
        2,
        10,
        currentUser,
      );
    });

    it('uses default page=1 and limit=5 when not provided', async () => {
      mockReviewsService.listComponentReviews.mockResolvedValue(
        paginatedResult,
      );

      await controller.listComponentReviews(
        componentType,
        componentId,
        '1',
        '5',
        currentUser,
      );

      expect(mockReviewsService.listComponentReviews).toHaveBeenCalledWith(
        componentId,
        componentType,
        1,
        5,
        currentUser,
      );
    });

    it('returns the paginated result from the service', async () => {
      mockReviewsService.listComponentReviews.mockResolvedValue(
        paginatedResult,
      );

      const result = await controller.listComponentReviews(
        componentType,
        componentId,
        '1',
        '5',
        currentUser,
      );

      expect(result).toEqual(paginatedResult);
    });

    it('propagates errors thrown by the service', async () => {
      mockReviewsService.listComponentReviews.mockRejectedValue(
        new Error('Not Found'),
      );

      await expect(
        controller.listComponentReviews(
          componentType,
          'bad-id',
          '1',
          '5',
          currentUser,
        ),
      ).rejects.toThrow('Not Found');
    });
  });

  describe('listUserReviews()', () => {
    const userPaginatedResult = { data: [], total: 0, page: 1, limit: 8 };

    it('delegates to ReviewsService.listUserReviews with parsed params and order', async () => {
      mockReviewsService.listUserReviews.mockResolvedValue(userPaginatedResult);

      await controller.listUserReviews(currentUser, '2', '8', 'stars-DESC');

      expect(mockReviewsService.listUserReviews).toHaveBeenCalledWith(
        currentUser,
        2,
        8,
        'stars-DESC',
      );
    });

    it('uses default order when not provided', async () => {
      mockReviewsService.listUserReviews.mockResolvedValue(userPaginatedResult);

      await controller.listUserReviews(currentUser, '1', '8', 'createdAt-DESC');

      expect(mockReviewsService.listUserReviews).toHaveBeenCalledWith(
        currentUser,
        1,
        8,
        'createdAt-DESC',
      );
    });

    it('returns the paginated result from the service', async () => {
      mockReviewsService.listUserReviews.mockResolvedValue(userPaginatedResult);

      const result = await controller.listUserReviews(
        currentUser,
        '1',
        '8',
        'createdAt-DESC',
      );

      expect(result).toEqual(userPaginatedResult);
    });

    it('propagates errors thrown by the service', async () => {
      mockReviewsService.listUserReviews.mockRejectedValue(
        new Error('Bad Request'),
      );

      await expect(
        controller.listUserReviews(currentUser, '1', '8', 'invalid-field'),
      ).rejects.toThrow('Bad Request');
    });
  });

  describe('deleteReview()', () => {
    it('delegates to ReviewsService.deleteReview with reviewId and currentUser', async () => {
      mockReviewsService.deleteReview.mockResolvedValue(undefined);

      await controller.deleteReview(42, currentUser);

      expect(mockReviewsService.deleteReview).toHaveBeenCalledWith(
        42,
        currentUser,
      );
    });

    it('returns void on success', async () => {
      mockReviewsService.deleteReview.mockResolvedValue(undefined);

      const result = await controller.deleteReview(42, currentUser);

      expect(result).toBeUndefined();
    });

    it('propagates errors thrown by the service', async () => {
      mockReviewsService.deleteReview.mockRejectedValue(new Error('Forbidden'));

      await expect(controller.deleteReview(42, currentUser)).rejects.toThrow(
        'Forbidden',
      );
    });
  });

  describe('getComponentRatingStats()', () => {
    const componentId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const componentType = ComponentType.GPU;

    it('delegates to ReviewsService.getComponentRatingStats with componentId and componentType', async () => {
      mockReviewsService.getComponentRatingStats.mockResolvedValue({
        average: 4.5,
        count: 10,
      });

      await controller.getComponentRatingStats(componentType, componentId);

      expect(mockReviewsService.getComponentRatingStats).toHaveBeenCalledWith(
        componentId,
        componentType,
      );
    });

    it('returns the stats object from the service', async () => {
      const stats = { average: 4.25, count: 8 };
      mockReviewsService.getComponentRatingStats.mockResolvedValue(stats);

      const result = await controller.getComponentRatingStats(
        componentType,
        componentId,
      );

      expect(result).toEqual(stats);
    });

    it('returns null average when there are no reviews', async () => {
      mockReviewsService.getComponentRatingStats.mockResolvedValue({
        average: null,
        count: 0,
      });

      const result = await controller.getComponentRatingStats(
        componentType,
        componentId,
      );

      expect(result.average).toBeNull();
      expect(result.count).toBe(0);
    });

    it('propagates errors thrown by the service', async () => {
      mockReviewsService.getComponentRatingStats.mockRejectedValue(
        new Error('Not Found'),
      );

      await expect(
        controller.getComponentRatingStats(componentType, 'bad-id'),
      ).rejects.toThrow('Not Found');
    });
  });
});
