import styles from '../../styles/PcComponentsScreen.module.css';

export function PcComponentSkeletonCard() {
  return (
    <div className={styles.skeleton} aria-hidden>
      <div className={styles.skeletonImage} />
      <div className={styles.skeletonBody}>
        <div className={styles.skeletonLine} style={{ width: '80%' }} />
        <div className={styles.skeletonLine} style={{ width: '60%' }} />
        <div className={styles.skeletonLine} style={{ width: '50%', marginTop: 8 }} />
      </div>
    </div>
  );
}