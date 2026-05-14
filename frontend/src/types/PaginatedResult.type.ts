export interface PaginatedResult <T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ReviewsPaginatedResult <T> extends PaginatedResult<T> {
  hasCurrentUserReviewed?: boolean;
}