import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ReviewsService } from './reviews.service';
import { Review } from './entities/review.entity';
import { BuildsService } from '../builds/builds.service';
import { ComponentsService } from '../components/components.service';
import { UsersService } from '../users/users.service';
import { SignInData } from '../auth/interfaces/auth.interfaces';
import { ReviewCreationDto } from './dtos/review-creation.dto';
import { ReviewResponseDto } from './dtos/review-response.dto';

function makeUser(overrides = {}) {
  return Object.assign({}, { id: 1, username: 'alice' }, overrides);
}

function makeBuild(overrides = {}) {
  return Object.assign(
    {},
    { id: 1, name: 'Test Build', published: true, user: makeUser() },
    overrides,
  );
}

function makeComponent(overrides = {}) {
  return Object.assign(
    {},
    { buildcoresId: 'comp-uuid', name: 'RTX 4090', manufacturer: 'NVIDIA' },
    overrides,
  );
}

function makeReview(overrides = {}): Review {
  return Object.assign(
    new Review(),
    {
      id: 1,
      stars: 4,
      text: 'Great build!',
      user: makeUser(),
      build: makeBuild(),
      createdAt: new Date('2024-01-01'),
      componentId: null,
      componentType: null,
    },
    overrides,
  );
}

function makeReviewRepoMock() {
  const _qb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ average: null, count: '0' }),
  };
  return {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(_qb),
    _qb,
  };
}

const mockBuildsService = {
  findBuildById: jest.fn(),
};

const mockComponentsService = {
  findComponentById: jest.fn(),
};

const mockUsersService = {
  findUserById: jest.fn(),
};

const currentUser: SignInData = { userId: 1, username: 'alice' };

async function buildModule(
  reviewRepoOverride?: ReturnType<typeof makeReviewRepoMock>,
) {
  const reviewRepo = reviewRepoOverride ?? makeReviewRepoMock();

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ReviewsService,
      { provide: getRepositoryToken(Review), useValue: reviewRepo },
      { provide: BuildsService, useValue: mockBuildsService },
      { provide: ComponentsService, useValue: mockComponentsService },
      { provide: UsersService, useValue: mockUsersService },
    ],
  }).compile();

  return {
    service: module.get<ReviewsService>(ReviewsService),
    reviewRepo,
  };
}

describe('ReviewsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsersService.findUserById.mockResolvedValue(makeUser());
    mockBuildsService.findBuildById.mockResolvedValue(makeBuild());
    mockComponentsService.findComponentById.mockResolvedValue(makeComponent());
  });

  describe('createReview()', () => {
    const buildReviewDto: ReviewCreationDto = {
      stars: 5,
      text: 'Excellent build!',
      buildId: 1,
      componentId: undefined,
      componentType: undefined,
    } as unknown as ReviewCreationDto;

    const componentReviewDto: ReviewCreationDto = {
      stars: 4,
      text: 'Great GPU!',
      buildId: undefined,
      componentId: 'comp-uuid',
      componentType: 'gpu',
    };

    it('throws BadRequestException when both buildId and componentId are provided', async () => {
      const { service } = await buildModule();

      await expect(
        service.createReview(currentUser, {
          ...buildReviewDto,
          componentId: 'comp-uuid',
          componentType: 'gpu',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when neither buildId nor componentId is provided', async () => {
      const { service } = await buildModule();

      await expect(
        service.createReview(currentUser, {
          stars: 3,
          text: 'meh',
          buildId: undefined,
          componentId: undefined,
          componentType: undefined,
        } as unknown as ReviewCreationDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when the logged user is not found', async () => {
      mockUsersService.findUserById.mockResolvedValue(null);
      const { service } = await buildModule();

      await expect(
        service.createReview(currentUser, buildReviewDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when the user has already reviewed the build', async () => {
      const reviewRepo = makeReviewRepoMock();
      reviewRepo.findOne.mockResolvedValue(makeReview());
      const { service } = await buildModule(reviewRepo);

      await expect(
        service.createReview(currentUser, buildReviewDto),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when the user has already reviewed the component', async () => {
      const reviewRepo = makeReviewRepoMock();
      reviewRepo.findOne.mockResolvedValue(makeReview());
      const { service } = await buildModule(reviewRepo);

      await expect(
        service.createReview(currentUser, componentReviewDto),
      ).rejects.toThrow(ConflictException);
    });

    it('saves and returns a ReviewResponseDto for a build review', async () => {
      const reviewRepo = makeReviewRepoMock();
      const savedReview = makeReview();
      reviewRepo.findOne.mockResolvedValue(null);
      reviewRepo.create.mockReturnValue(savedReview);
      reviewRepo.save.mockResolvedValue(savedReview);

      const { service } = await buildModule(reviewRepo);
      const result = await service.createReview(currentUser, buildReviewDto);

      expect(reviewRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('saves and returns a ReviewResponseDto for a component review', async () => {
      const reviewRepo = makeReviewRepoMock();
      const savedReview = makeReview({
        build: null,
        componentId: 'comp-uuid',
        componentType: 'gpu',
      });
      reviewRepo.findOne.mockResolvedValue(null);
      reviewRepo.create.mockReturnValue(savedReview);
      reviewRepo.save.mockResolvedValue(savedReview);

      const { service } = await buildModule(reviewRepo);
      const result = await service.createReview(
        currentUser,
        componentReviewDto,
      );

      expect(reviewRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('assigns the component name and manufacturer from the component service', async () => {
      const reviewRepo = makeReviewRepoMock();
      const component = makeComponent({
        name: 'RTX 4090',
        manufacturer: 'NVIDIA',
      });
      mockComponentsService.findComponentById.mockResolvedValue(component);
      const savedReview = makeReview({
        build: null,
        componentId: 'comp-uuid',
        componentType: 'gpu',
      });
      reviewRepo.findOne.mockResolvedValue(null);
      reviewRepo.create.mockReturnValue(savedReview);
      reviewRepo.save.mockResolvedValue(savedReview);

      const { service } = await buildModule(reviewRepo);
      const result = await service.createReview(
        currentUser,
        componentReviewDto,
      );

      expect(result.componentName).toBe('RTX 4090');
      expect(result.manufacturerName).toBe('NVIDIA');
    });
  });

  describe('listBuildReviews()', () => {
    it('throws NotFoundException when the build does not exist', async () => {
      mockBuildsService.findBuildById.mockRejectedValue(
        new NotFoundException(),
      );
      const { service } = await buildModule();

      await expect(service.listBuildReviews(999, 1, 5)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns a paginated result with reviews', async () => {
      const reviews = [makeReview()];
      const reviewRepo = makeReviewRepoMock();
      reviewRepo.findAndCount.mockResolvedValue([reviews, 1]);
      reviewRepo.findOne.mockResolvedValue(null);

      const { service } = await buildModule(reviewRepo);
      const result = await service.listBuildReviews(1, 1, 5, currentUser);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(5);
    });

    it('sets hasCurrentUserReviewed to true when the user has reviewed the build', async () => {
      const reviewRepo = makeReviewRepoMock();
      reviewRepo.findAndCount.mockResolvedValue([[], 0]);
      reviewRepo.findOne.mockResolvedValue(makeReview());

      const { service } = await buildModule(reviewRepo);
      const result = await service.listBuildReviews(1, 1, 5, currentUser);

      expect(result.hasCurrentUserReviewed).toBe(true);
    });

    it('sets hasCurrentUserReviewed to false when the user has not reviewed', async () => {
      const reviewRepo = makeReviewRepoMock();
      reviewRepo.findAndCount.mockResolvedValue([[], 0]);
      reviewRepo.findOne.mockResolvedValue(null);

      const { service } = await buildModule(reviewRepo);
      const result = await service.listBuildReviews(1, 1, 5, currentUser);

      expect(result.hasCurrentUserReviewed).toBe(false);
    });

    it('sets hasCurrentUserReviewed to undefined when currentUser is not provided', async () => {
      const reviewRepo = makeReviewRepoMock();
      reviewRepo.findAndCount.mockResolvedValue([[], 0]);

      const { service } = await buildModule(reviewRepo);
      const result = await service.listBuildReviews(1, 1, 5);

      expect(result.hasCurrentUserReviewed).toBeUndefined();
    });

    it('applies correct skip for pagination', async () => {
      const reviewRepo = makeReviewRepoMock();
      reviewRepo.findAndCount.mockResolvedValue([[], 0]);

      const { service } = await buildModule(reviewRepo);
      await service.listBuildReviews(1, 3, 5);

      expect(reviewRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10 }),
      );
    });
  });

  describe('listComponentReviews()', () => {
    it('throws NotFoundException when the component does not exist', async () => {
      mockComponentsService.findComponentById.mockRejectedValue(
        new NotFoundException(),
      );
      const { service } = await buildModule();

      await expect(
        service.listComponentReviews('bad-id', 'gpu', 1, 5),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns a paginated result with reviews', async () => {
      const reviews = [
        makeReview({
          build: null,
          componentId: 'comp-uuid',
          componentType: 'gpu',
        }),
      ];
      const reviewRepo = makeReviewRepoMock();
      reviewRepo.findAndCount.mockResolvedValue([reviews, 1]);
      reviewRepo.findOne.mockResolvedValue(null);

      const { service } = await buildModule(reviewRepo);
      const result = await service.listComponentReviews(
        'comp-uuid',
        'gpu',
        1,
        5,
        currentUser,
      );

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('sets hasCurrentUserReviewed to true when the user has reviewed the component', async () => {
      const reviewRepo = makeReviewRepoMock();
      reviewRepo.findAndCount.mockResolvedValue([[], 0]);
      reviewRepo.findOne.mockResolvedValue(makeReview());

      const { service } = await buildModule(reviewRepo);
      const result = await service.listComponentReviews(
        'comp-uuid',
        'gpu',
        1,
        5,
        currentUser,
      );

      expect(result.hasCurrentUserReviewed).toBe(true);
    });

    it('sets hasCurrentUserReviewed to undefined when no currentUser is provided', async () => {
      const reviewRepo = makeReviewRepoMock();
      reviewRepo.findAndCount.mockResolvedValue([[], 0]);

      const { service } = await buildModule(reviewRepo);
      const result = await service.listComponentReviews(
        'comp-uuid',
        'gpu',
        1,
        5,
      );

      expect(result.hasCurrentUserReviewed).toBeUndefined();
    });

    it('includes component name and manufacturer in the response DTOs', async () => {
      const component = makeComponent({
        name: 'RTX 4090',
        manufacturer: 'NVIDIA',
      });
      mockComponentsService.findComponentById.mockResolvedValue(component);
      const review = makeReview({
        build: null,
        componentId: 'comp-uuid',
        componentType: 'gpu',
      });
      const reviewRepo = makeReviewRepoMock();
      reviewRepo.findAndCount.mockResolvedValue([[review], 1]);
      reviewRepo.findOne.mockResolvedValue(null);

      const { service } = await buildModule(reviewRepo);

      const result = (await service.listComponentReviews(
        'comp-uuid',
        'gpu',
        1,
        5,
      )) as {
        data: ReviewResponseDto[];
      };

      expect(result.data[0].componentName).toBe('RTX 4090');
      expect(result.data[0].manufacturerName).toBe('NVIDIA');
    });
  });

  describe('listUserReviews()', () => {
    it('throws BadRequestException for an invalid order field', async () => {
      const { service } = await buildModule();

      await expect(
        service.listUserReviews(currentUser, 1, 8, 'invalid-DESC'),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns a paginated result of the current user reviews', async () => {
      const reviews = [makeReview()];
      const reviewRepo = makeReviewRepoMock();
      reviewRepo.findAndCount.mockResolvedValue([reviews, 1]);

      const { service } = await buildModule(reviewRepo);
      const result = await service.listUserReviews(currentUser, 1, 8);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(8);
    });

    it('applies correct skip for pagination', async () => {
      const reviewRepo = makeReviewRepoMock();
      reviewRepo.findAndCount.mockResolvedValue([[], 0]);

      const { service } = await buildModule(reviewRepo);
      await service.listUserReviews(currentUser, 2, 8);

      expect(reviewRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 8 }),
      );
    });

    it('fetches component info for component reviews', async () => {
      const componentReview = makeReview({
        build: null,
        componentId: 'comp-uuid',
        componentType: 'gpu',
      });
      const reviewRepo = makeReviewRepoMock();
      reviewRepo.findAndCount.mockResolvedValue([[componentReview], 1]);

      const { service } = await buildModule(reviewRepo);
      await service.listUserReviews(currentUser, 1, 8);

      expect(mockComponentsService.findComponentById).toHaveBeenCalledWith(
        'gpu',
        'comp-uuid',
      );
    });

    it('does not call findComponentById for build reviews', async () => {
      const buildReview = makeReview({ componentId: null });
      const reviewRepo = makeReviewRepoMock();
      reviewRepo.findAndCount.mockResolvedValue([[buildReview], 1]);

      const { service } = await buildModule(reviewRepo);
      await service.listUserReviews(currentUser, 1, 8);

      expect(mockComponentsService.findComponentById).not.toHaveBeenCalled();
    });

    it('accepts stars as a valid order field', async () => {
      const reviewRepo = makeReviewRepoMock();
      reviewRepo.findAndCount.mockResolvedValue([[], 0]);

      const { service } = await buildModule(reviewRepo);

      await expect(
        service.listUserReviews(currentUser, 1, 8, 'stars-ASC'),
      ).resolves.toBeDefined();
    });

    it('defaults to DESC direction when none is specified', async () => {
      const reviewRepo = makeReviewRepoMock();
      reviewRepo.findAndCount.mockResolvedValue([[], 0]);

      const { service } = await buildModule(reviewRepo);
      await service.listUserReviews(currentUser, 1, 8, 'createdAt');

      expect(reviewRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ order: { createdAt: 'DESC' } }),
      );
    });
  });

  describe('deleteReview()', () => {
    it('removes the review when it belongs to the current user', async () => {
      const review = makeReview();
      const reviewRepo = makeReviewRepoMock();
      reviewRepo.findOne.mockResolvedValue(review);
      reviewRepo.remove.mockResolvedValue(review);

      const { service } = await buildModule(reviewRepo);
      await service.deleteReview(1, currentUser);

      expect(reviewRepo.remove).toHaveBeenCalledWith(review);
    });

    it('throws NotFoundException when the review does not exist', async () => {
      const reviewRepo = makeReviewRepoMock();
      reviewRepo.findOne.mockResolvedValue(null);

      const { service } = await buildModule(reviewRepo);

      await expect(service.deleteReview(999, currentUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when the review belongs to another user', async () => {
      const review = makeReview({ user: makeUser({ id: 99 }) });
      const reviewRepo = makeReviewRepoMock();
      reviewRepo.findOne.mockResolvedValue(review);

      const { service } = await buildModule(reviewRepo);

      await expect(service.deleteReview(1, currentUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getComponentRatingStats()', () => {
    it('returns the average and count when reviews exist', async () => {
      const reviewRepo = makeReviewRepoMock();
      reviewRepo._qb.getRawOne.mockResolvedValue({
        average: '4.333333',
        count: '3',
      });

      const { service } = await buildModule(reviewRepo);
      const result = await service.getComponentRatingStats('comp-uuid', 'gpu');

      expect(result.average).toBe(4.33);
      expect(result.count).toBe(3);
    });

    it('returns null average when there are no reviews', async () => {
      const reviewRepo = makeReviewRepoMock();
      reviewRepo._qb.getRawOne.mockResolvedValue({ average: null, count: '0' });

      const { service } = await buildModule(reviewRepo);
      const result = await service.getComponentRatingStats('comp-uuid', 'gpu');

      expect(result.average).toBeNull();
      expect(result.count).toBe(0);
    });

    it('rounds the average to 2 decimal places', async () => {
      const reviewRepo = makeReviewRepoMock();
      reviewRepo._qb.getRawOne.mockResolvedValue({
        average: '3.6666666',
        count: '3',
      });

      const { service } = await buildModule(reviewRepo);
      const result = await service.getComponentRatingStats('comp-uuid', 'gpu');

      expect(result.average).toBe(3.67);
    });
  });
});
