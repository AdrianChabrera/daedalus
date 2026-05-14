import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Pagination } from '../../components/general/Pagination';
import ConfirmModal from '../../components/general/ConfirmModal';
import { SortIcon } from '../../components/general/SortIcon';
import { ComponentReviewCard } from '../../components/reviews/ComponentReviewCard';
import { BuildReviewCard } from '../../components/reviews/BuildReviewCard';
import { useMyReviews, SORT_FIELDS } from '../../hooks/useMyReviews';
import styles from '../../styles/MyReviewsScreen.module.css';
import type { ReviewsTab } from '../../types/Reviews.type';

export default function MyReviewsScreen() {
  const navigate = useNavigate();
  const {
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
  } = useMyReviews();

  return (
    <div className={styles.page}>
      <div className="bgGlow" aria-hidden />
      <div className="bgGrid" aria-hidden />

      <div className={styles.inner}>
        <button className={styles.backBtn} onClick={() => navigate('/profile')}>
          <ArrowLeft size={15} />
          Back to profile
        </button>

        <div className={styles.header}>
          <h1 className={styles.pageTitle}>My Reviews</h1>
          {!loading && (
            <span className={styles.totalBadge}>{total} total</span>
          )}
        </div>

        <div className={styles.tabs}>
          {(['all', 'builds', 'components'] as ReviewsTab[]).map((t) => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'all' ? 'All' : t === 'builds' ? 'Builds' : 'Components'}
              {!loading && (
                <span
                  className={`${styles.tabCount} ${tab === t ? styles.tabCountActive : ''}`}
                >
                  {tabCounts[t]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className={styles.sortBar}>
          <span className={styles.sortLabel}>Order by:</span>
          <div className={styles.sortButtons}>
            {SORT_FIELDS.map((btn) => {
              const isActive =
                activeSort.field === btn.field && activeSort.direction !== null;
              return (
                <button
                  key={btn.field}
                  className={`${styles.sortBtn} ${isActive ? styles.sortBtnActive : ''}`}
                  onClick={() => handleSortClick(btn.field)}
                  type="button"
                >
                  <SortIcon direction={isActive ? activeSort.direction : null} />
                  <span>{btn.label}</span>
                </button>
              );
            })}
          </div>
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

        {!loading && !error && displayedReviews.length === 0 && (
          <div className={styles.stateBox}>
            <p className={styles.emptyText}>
              {tab === 'all'
                ? "You haven't written any reviews yet."
                : tab === 'builds'
                ? "You haven't reviewed any builds yet."
                : "You haven't reviewed any components yet."}
            </p>
          </div>
        )}

        {!loading && !error && displayedReviews.length > 0 && (
          <>
            <div className={styles.grid}>
              {displayedReviews.map((review) =>
                review.componentType != null ? (
                  <ComponentReviewCard
                    key={review.id}
                    review={review}
                    onDelete={setReviewToDelete}
                  />
                ) : (
                  <BuildReviewCard
                    key={review.id}
                    review={review}
                    onDelete={setReviewToDelete}
                  />
                ),
              )}
            </div>

            {totalPages > 1 && tab === 'all' && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onPrev={goToPrevPage}
                onNext={goToNextPage}
                onPageSelect={setPage}
              />
            )}
          </>
        )}

        {deleteError && (
          <p className={styles.errorText}>{deleteError}</p>
        )}
      </div>

      <ConfirmModal
        isOpen={reviewToDelete !== null}
        loading={deleting}
        title="Delete review"
        description={
          <>
            This review will be <strong>permanently deleted</strong>. This
            action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}