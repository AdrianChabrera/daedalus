import { PaginatedResult } from 'src/components/interfaces/pc-components.interfaces';

export interface ReviewPaginatedResult<T> extends PaginatedResult<T> {
  hasCurrentUserReviewed?: boolean;
}
