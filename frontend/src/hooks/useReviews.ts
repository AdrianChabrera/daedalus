import { useState, useEffect, useCallback } from 'react';
import { API_ROUTES } from '../config/api';
import type { CreateReviewPayload, Review, UseReviewsOptions } from '../types/Reviews.type';
import type { PaginatedResult } from '../types/PaginatedResult.type';

export function useReviews({
  buildId,
  componentType,
  componentId,
  pageSize = 5,
  onReviewChange,
}: UseReviewsOptions) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedResult<Review> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchReviews = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      let url: string;
      if (buildId !== undefined) {
        url = API_ROUTES.BUILD_REVIEWS(buildId);
      } else if (componentType && componentId) {
        url = API_ROUTES.COMPONENT_REVIEWS(componentType, componentId);
      } else {
        setLoading(false);
        return;
      }

      const qs = new URLSearchParams({
        page: String(targetPage),
        limit: String(pageSize),
      });

      const res = await fetch(`${url}?${qs.toString()}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: PaginatedResult<Review> = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }, [buildId, componentType, componentId, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [buildId, componentType, componentId]);

  useEffect(() => {
    fetchReviews(page);
  }, [fetchReviews, page]);

  const goToPage = (p: number) => {
    const totalPages = result ? Math.ceil(result.total / pageSize) : 1;
    setPage(Math.max(1, Math.min(p, totalPages)));
  };

  const createReview = async (
    payload: CreateReviewPayload,
    accessToken: string,
  ): Promise<{ error?: string }> => {
    try {
      const res = await fetch(API_ROUTES.CREATE_REVIEW, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        return { error: 'You have already reviewed this.' };
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { error: body.message ?? `Error ${res.status}` };
      }

      setPage(1);
      await fetchReviews(1);
      onReviewChange?.();
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unexpected error' };
    }
  };

  const requestDeleteReview = (reviewId: number) => {
    setDeleteError(null);
    setReviewToDelete(reviewId);
  };

  const confirmDeleteReview = async (accessToken: string): Promise<void> => {
    if (reviewToDelete == null) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(API_ROUTES.DELETE_REVIEW(reviewToDelete), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        setDeleteError(`Error ${res.status}`);
        return;
      }

      setReviewToDelete(null);
      const isLastOnPage = (result?.data ?? []).length === 1 && page > 1;
      const nextPage = isLastOnPage ? page - 1 : page;
      setPage(nextPage);
      onReviewChange?.();
      await fetchReviews(nextPage);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteReview = () => {
    setReviewToDelete(null);
    setDeleteError(null);
  };

  const totalPages = result ? Math.max(1, Math.ceil(result.total / pageSize)) : 1;

  return {
    reviews: result?.data ?? [],
    total: result?.total ?? 0,
    page,
    totalPages,
    loading,
    error,
    goToPage,
    createReview,
    reviewToDelete,
    deleting,
    deleteError,
    requestDeleteReview,
    confirmDeleteReview,
    cancelDeleteReview,
  };
}