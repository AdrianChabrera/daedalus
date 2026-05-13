import { useState } from 'react';
import { X, Star } from 'lucide-react';
import styles from '../../styles/Reviews.module.css';
import type { WriteReviewModalProps } from '../../types/Reviews.type';

export default function WriteReviewModal({
  isOpen,
  onClose,
  onSubmit,
  targetName,
}: WriteReviewModalProps) {
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (stars === 0) {
      setError('Please select a star rating.');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await onSubmit(stars, text.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setStars(0);
      setHoveredStar(0);
      setText('');
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const displayStars = hoveredStar || stars;

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Write a review</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p className={styles.targetName}>{targetName}</p>

        <div className={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={`${styles.starBtn} ${n <= displayStars ? styles.starBtnFilled : ''}`}
              onMouseEnter={() => setHoveredStar(n)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setStars(n)}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
            >
              <Star size={28} fill={n <= displayStars ? 'currentColor' : 'none'} />
            </button>
          ))}
          {stars > 0 && (
            <span className={styles.starsLabel}>
              {['', 'Terrible', 'Bad', 'OK', 'Good', 'Excellent'][stars]}
            </span>
          )}
        </div>

        <textarea
          className={styles.textarea}
          placeholder="Share your opinion (optional)"
          maxLength={1000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
        />
        <span className={styles.charCount}>{text.length} / 1000</span>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={loading || stars === 0}
          >
            {loading ? 'Submitting…' : 'Submit review'}
          </button>
        </div>
      </div>
    </div>
  );
}