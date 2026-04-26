import { Link } from 'react-router-dom';
import styles from '../../styles/BuildDetailsScreen.module.css';
import type { ComponentRowProps } from '../../types/BuildDetails.type';

function formatSpecValue(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}

function formatSpecKey(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
}

export function BuildDetailsComponentSlotRow({ icon, label, component, specs, endpoint, quantity }: ComponentRowProps) {
  const specEntries = specs
    .map(key => ({ key, value: component[key] }))
    .filter(({ value }) => value != null)
    .slice(0, 4);

  return (
    <div className={styles.componentRow}>
      <div className={styles.componentIcon}>{icon}</div>
      <div className={styles.componentLabel}>
        {label}
        {quantity && quantity > 1 && <span className={styles.quantityBadge}>×{quantity}</span>}
      </div>
      <div className={styles.componentInfo}>
        <Link
          to={`/components/${endpoint}/${component.buildcoresId}`}
          className={styles.componentName}
        >
          {component.name ?? '—'}
        </Link>        
        {specEntries.length > 0 && (
          <div className={styles.specList}>
            {specEntries.map(({ key, value }) => (
              <span key={key} className={styles.specItem}>
                <span className={styles.specKey}>{formatSpecKey(key)}</span>
                <span className={styles.specVal}>{formatSpecValue(value)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}