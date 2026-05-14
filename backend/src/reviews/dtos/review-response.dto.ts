import { Review } from '../entities/review.entity';

export class ReviewResponseDto {
  id!: number;
  username!: string;
  text?: string;
  stars!: number;
  componentType?: string;
  componentName?: string;
  manufacturerName?: string;
  buildName?: string;
  buildPhotoUrl?: string;
  buildAuthorUsername?: string;
  createdAt!: Date;

  constructor(
    review: Review,
    componentName?: string,
    manufacturerName?: string,
  ) {
    this.id = review.id;
    this.username = review.user.username;
    this.text = review.text;
    this.stars = review.stars;
    this.componentType = review.componentType;
    this.componentName = componentName;
    this.manufacturerName = manufacturerName;
    this.buildName = review.build?.name;
    this.buildPhotoUrl = review.build?.photoUrl ?? undefined;
    this.buildAuthorUsername = review.build?.user?.username ?? undefined;
    this.createdAt = review.createdAt;
  }
}
