import { Trash2 } from 'lucide-react';
import styles from '../../styles/Reviews.module.css';
import type { ReviewCardProps } from '../../types/Reviews.type';

function StarDisplay({ stars }: { stars: number }) {
  return (
    <div className={styles.cardStars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= stars ? styles.cardStarFilled : styles.cardStarEmpty}>
          ★
        </span>
      ))}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ReviewCard({ review, currentUsername, onDelete }: ReviewCardProps) {
  const isOwn = currentUsername && currentUsername === review.username;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardLeft}>
          <span className={styles.username}>{review.username}</span>
          <StarDisplay stars={review.stars} />
        </div>
        <div className={styles.cardRight}>
          <span className={styles.date}>{formatDate(review.createdAt)}</span>
          {isOwn && onDelete && (
            <button
              className={styles.deleteBtn}
              onClick={() => onDelete(review.id)}
              aria-label="Delete review"
              title="Delete your review"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      {review.text && <p className={styles.reviewText}>{review.text}</p>}
    </div>
  );
}