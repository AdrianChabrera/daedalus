import { Monitor, User } from "lucide-react";
import type { BuildSummary } from "../../types/BuildLists.type";
import styles from '../../styles/HomeScreen.module.css';

function Stars({ rating, count }: { rating?: number | null; count?: number }) {
  const r = rating ?? 0;
  return (
    <span className={styles.cardStars}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= Math.round(r) ? styles.starOn : styles.starOff}>★</span>
      ))}
      {count != null && <span className={styles.cardRatingCount}>({count})</span>}
    </span>
  );
}

export function HomeBuildCard({ build, onClick }: { build: BuildSummary; onClick: () => void }) {
  return (
    <button className={styles.buildCard} onClick={onClick} type="button">
      <div className={styles.buildCardImgWrap}>
        {build.photoUrl ? (
          <img src={build.photoUrl} alt={build.name} className={styles.buildCardImg} />
        ) : (
          <div className={styles.buildCardImgPlaceholder}>
            <Monitor size={28} strokeWidth={1.2} />
          </div>
        )}
        <div className={styles.buildCardImgOverlay} />
      </div>
      <div className={styles.buildCardBody}>
        <p className={styles.buildCardUser}>
          <User size={10} />
          {build.user?.username ?? 'anonymous'}
        </p>
        <h3 className={styles.buildCardName}>
          {build.name.length > 26 ? `${build.name.slice(0, 26)}…` : build.name}
        </h3>
        <Stars rating={build.averageRating} count={build.reviewCount} />
      </div>
    </button>
  );
}