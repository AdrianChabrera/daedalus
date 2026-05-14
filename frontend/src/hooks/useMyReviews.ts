import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_ROUTES } from '../config/api';
import { useSortState } from '../hooks/useSortState';
import type { Review, ReviewsTab } from '../types/Reviews.type';
import type { PaginatedResult } from '../types/PaginatedResult.type';

const PAGE_SIZE = 8;

export const SORT_FIELDS = [
  { label: 'Date', field: 'createdAt' },
  { label: 'Stars', field: 'stars' },
];

export function useMyReviews() {
  const { user } = useAuth();
  const { activeSort, handleSortClick, buildOrderParam } = useSortState();

  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<ReviewsTab>('all');
  const [page, setPage] = useState(1);

  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const buildReviews = allReviews.filter(
    (r) => r.buildName != null && r.componentType == null,
  );
  const componentReviews = allReviews.filter((r) => r.componentType != null);

  const displayedReviews =
    tab === 'builds'
      ? buildReviews
      : tab === 'components'
      ? componentReviews
      : allReviews;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const tabCounts = {
    all: total,
    builds: buildReviews.length,
    components: componentReviews.length,
  } as const;

  const fetchReviews = useCallback(
    async (targetPage: number) => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const order =
          (activeSort.field && buildOrderParam(activeSort)) || 'createdAt-DESC';
        const qs = new URLSearchParams({
          page: String(targetPage),
          limit: String(PAGE_SIZE),
          order,
        });
        const res = await fetch(`${API_ROUTES.MY_REVIEWS}?${qs}`, {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data: PaginatedResult<Review> = await res.json();
        setAllReviews(data.data);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unexpected error');
      } finally {
        setLoading(false);
      }
    },
    [user, activeSort, buildOrderParam],
  );

  useEffect(() => {
    fetchReviews(page);
  }, [fetchReviews, page]);

  useEffect(() => { setPage(1); }, [tab]);
  useEffect(() => { setPage(1); }, [activeSort]);

  const handleDelete = async () => {
    if (reviewToDelete == null || !user) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(API_ROUTES.DELETE_REVIEW(reviewToDelete), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setReviewToDelete(null);
      const nextPage = allReviews.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      await fetchReviews(nextPage);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Could not delete review',
      );
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => setReviewToDelete(null);

  const goToPrevPage = () => setPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setPage((p) => Math.min(totalPages, p + 1));

  return {
    displayedReviews,
    total,
    totalPages,
    tabCounts,
    tab,
    setTab,
    page,
    setPage,
    loading,
    error,
    activeSort,
    handleSortClick,
    reviewToDelete,
    setReviewToDelete,
    deleting,
    deleteError,
    handleDelete,
    cancelDelete,
    goToPrevPage,
    goToNextPage,
  };
}