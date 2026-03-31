import type { PcComponent } from "../types/PcComponents.types";
import styles from '../styles/PcComponentsScreen.module.css';

export function PcComponentCard({
  component,
  subtitle,
  onClick,
}: {
  component: PcComponent;
  subtitle: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button className={styles.card} onClick={onClick} type="button">
      <div className={styles.cardImage}>
        <span className={styles.cardImagePlaceholder} aria-hidden>
          <svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="0" x2="80" y2="60" stroke="currentColor" strokeWidth="1" />
            <line x1="80" y1="0" x2="0" y2="60" stroke="currentColor" strokeWidth="1" />
            <rect x="0.5" y="0.5" width="79" height="59" stroke="currentColor" strokeWidth="1" />
          </svg>
        </span>
      </div>
      <div className={styles.cardBody}>
        <p className={styles.cardName}>
          {component.name 
            ? (component.name.length > 80 
                ? `${component.name.substring(0, 80)}...` 
                : component.name)
            : '—'}
        </p>        
        {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
        <p className={styles.cardMeta}>
          <span className={styles.cardMetaLabel}>Manufacturer:</span>{' '}
          {component.manufacturer ?? '—'}
        </p>
      </div>
    </button>
  );
}