import styles from '../../styles/MyReviewsScreen.module.css';

export function StarDisplay({ stars }: { stars: number }) {
  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= stars ? styles.starFilled : styles.starEmpty}>
          ★
        </span>
      ))}
    </div>
  );
}