export interface Review {
  id: number;
  username: string;
  text?: string;
  stars: number;
  componentType?: string;
  componentName?: string;
  manufacturerName?: string;
  buildName?: string;
  createdAt: string;
}

export interface UseReviewsOptions {
  buildId?: number;
  componentType?: string;
  componentId?: string;
  pageSize?: number;
  onReviewChange?: () => void;
}

export interface CreateReviewPayload {
  stars: number;
  text?: string;
  buildId?: number;
  componentType?: string;
  componentId?: string;
}

export interface ReviewCardProps {
  review: Review;
  currentUsername?: string;
  onDelete?: (reviewId: number) => void;
}

export interface ReviewsSectionProps {
  buildId?: number;
  componentType?: string;
  componentId?: string;
  targetName: string;
  isOwner?: boolean;
  onReviewChange?: () => void;
}

export interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (stars: number, text: string) => Promise<{ error?: string }>;
  targetName: string;
}

export interface RatingStats {
  average: number | null;
  count: number;
}