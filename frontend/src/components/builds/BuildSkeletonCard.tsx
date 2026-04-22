import styles from '../../styles/BuildsScreen.module.css';

export function BuildSkeletonCard() {
  return (
    <div className={styles.skeleton} aria-hidden>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonLine} style={{ width: '55%' }} />
        <div className={styles.skeletonLine} style={{ width: '20%' }} />
      </div>
      <div className={styles.skeletonBody}>
        <div className={styles.skeletonImage} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <div className={styles.skeletonLine} style={{ width: '90%' }} />
          <div className={styles.skeletonLine} style={{ width: '75%' }} />
          <div className={styles.skeletonLine} style={{ width: '60%' }} />
        </div>
      </div>
      <div className={styles.skeletonFooter}>
        <div className={styles.skeletonLine} style={{ width: '30%' }} />
        <div className={styles.skeletonLine} style={{ width: '20%' }} />
      </div>
    </div>
  );
}