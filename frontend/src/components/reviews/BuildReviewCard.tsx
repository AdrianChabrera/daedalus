import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import type { ReviewCardProps } from "../../types/Reviews.type";
import { StarDisplay } from "./StarDisplay";
import styles from '../../styles/MyReviewsScreen.module.css';
import placeholder from '../../assets/daedalus_placeholder.png';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function BuildReviewCard({ review, onDelete }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isLong, setIsLong] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const check = () => {
      el.style.maxHeight = 'none';
      const full = el.scrollHeight;
      el.style.maxHeight = '';
      setIsLong(full > 40);
    };

    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [review.text]);

  return (
    <article className={styles.card}>
      <div className={styles.cardVisual}>
        {review.buildPhotoUrl ? (
          <img src={review.buildPhotoUrl} alt={review.buildName ?? 'Build'} className={styles.buildPhoto} />
        ) : (
          <div className={styles.entityImagePlaceholder}>
            <img src={placeholder} alt="" className={styles.imagePlaceholder} />
          </div>
        )}
        <span className={styles.cardTypeBadge}>Build</span>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.cardTitleRow}>
          <span className={styles.cardTitle}>{review.buildName ?? '—'}</span>
          <div className={styles.cardStars}><StarDisplay stars={review.stars} /></div>
          <button
            className={styles.deleteBtn}
            onClick={() => onDelete?.(review.id)}
            aria-label="Delete review"
            title="Delete review"
          >
            <Trash2 size={14} />
          </button>
          <div className={styles.cardMeta}>
            {review.buildAuthorUsername && (
              <span className={styles.cardAuthor}>by {review.buildAuthorUsername}</span>
            )}
            <span className={styles.cardDate}>{formatDate(review.createdAt)}</span>
          </div>
        </div>

        {review.text && (
          <>
            <div className={`${styles.cardBody} ${expanded ? styles.cardBodyExpanded : ''}`}>
              <p className={styles.cardText} ref={textRef}>{review.text}</p>
            </div>
            {isLong && (
              <button
                className={styles.viewAllBtn}
                onClick={() => setExpanded(prev => !prev)}
              >
                {expanded ? 'Show less' : 'View all'}
              </button>
            )}
          </>
        )}
      </div>
    </article>
  );
}