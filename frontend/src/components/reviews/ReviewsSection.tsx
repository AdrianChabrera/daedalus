import { useState } from 'react';
import { PenLine } from 'lucide-react';
import { useReviews } from '../../hooks/useReviews';
import { useAuth } from '../../context/AuthContext';
import { Pagination } from '../general/Pagination';
import ReviewCard from './ReviewCard';
import WriteReviewModal from './WriteReviewModal';
import styles from '../../styles/Reviews.module.css';
import type { ReviewsSectionProps } from '../../types/Reviews.type';

const PAGE_SIZE = 5;

export default function ReviewsSection({
  buildId,
  componentType,
  componentId,
  targetName,
  isOwner = false,
  onReviewChange,
}: ReviewsSectionProps) {
  const { user } = useAuth();
  const {
    reviews,
    total,
    page,
    totalPages,
    loading,
    error,
    goToPage,
    createReview,
    deleteReview,
  } = useReviews({ buildId, componentType, componentId, pageSize: PAGE_SIZE, onReviewChange });

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canWriteReview = !!user && !isOwner;
  const hasUserReviewed = !!user && reviews.some((r) => r.username === user.username);

  const handleSubmit = async (stars: number, text: string) => {
    if (!user) return { error: 'You must be logged in.' };

    const payload: {
      stars: number;
      text?: string;
      buildId?: number;
      componentType?: string;
      componentId?: string;
    } = { stars };

    if (text) payload.text = text;

    if (buildId !== undefined) {
      payload.buildId = buildId;
    } else if (componentType && componentId) {
      payload.componentType = componentType;
      payload.componentId = componentId;
    }

    return createReview(payload, user.accessToken);
  };

  const handleDelete = async (reviewId: number) => {
    if (!user) return;
    setDeleteError(null);
    const result = await deleteReview(reviewId, user.accessToken);
    if (result.error) setDeleteError(result.error);
  };

  const writeReviewDisabledReason = !user
    ? 'Log in to write a review'
    : isOwner
    ? "You can't review your own build"
    : hasUserReviewed
    ? 'You have already reviewed this'
    : undefined;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          Reviews{total > 0 && <span className={styles.reviewCount}>{total}</span>}
        </h2>
        <button
          className={styles.writeBtn}
          onClick={() => setModalOpen(true)}
          disabled={!canWriteReview || hasUserReviewed}
          title={writeReviewDisabledReason}
          aria-label="Write a review"
        >
          <PenLine size={14} />
          Write a review
        </button>
      </div>

      {loading && (
        <div className={styles.stateBox}>
          <div className={styles.spinner} />
        </div>
      )}

      {!loading && error && (
        <div className={styles.stateBox}>
          <p className={styles.errorText}>Could not load reviews: {error}</p>
        </div>
      )}

      {!loading && !error && reviews.length === 0 && (
        <div className={styles.stateBox}>
          <p className={styles.emptyText}>No reviews yet. Be the first!</p>
        </div>
      )}

      {!loading && !error && reviews.length > 0 && (
        <>
          <div className={styles.list}>
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                currentUsername={user?.username}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPrev={() => goToPage(page - 1)}
              onNext={() => goToPage(page + 1)}
              onPageSelect={goToPage}
            />
          )}
        </>
      )}

      {deleteError && <p className={styles.errorText}>{deleteError}</p>}

      <WriteReviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        targetName={targetName}
      />
    </section>
  );
}