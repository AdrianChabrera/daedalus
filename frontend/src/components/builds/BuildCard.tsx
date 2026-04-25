import { Lock, Globe, User, Pencil, Trash2 } from 'lucide-react';
import styles from '../../styles/BuildsScreen.module.css';
import type { BuildCardProps } from '../../types/BuildLists.type';

function StarPlaceholder() {
  return (
    <span className={styles.stars} aria-label="Rating — not yet implemented">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={styles.starEmpty}>★</span>
      ))}
    </span>
  );
}

export function BuildCard({ build, onClick, footerInfo }: BuildCardProps) {
  const date = new Date(build.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <button className={styles.card} onClick={onClick} type="button">
      <div className={styles.cardHeader}>
        <span className={styles.cardName}>
          {build.name.length > 28 ? `${build.name.substring(0, 28)}…` : build.name}
        </span>
        <StarPlaceholder />
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardImage}>
          <div className={styles.cardImagePlaceholder} />
        </div>
        <p className={styles.cardDesc}>
          {build.description
            ? build.description.length > 120
              ? `${build.description.substring(0, 120)}…`
              : build.description
            : <span className={styles.cardNoDesc}>No description provided.</span>}
        </p>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.cardDate}>{date}</span>
        {footerInfo && (
          <span className={styles.cardVisibility}>{footerInfo}</span>
        )}
      </div>
    </button>
  );
}

export function MyBuildCard({ build, onClick, onDelete, onEdit }: Omit<BuildCardProps, 'footerInfo'> & { onDelete?: () => void; onEdit?: () => void }) {
  return (
    <BuildCard
      build={build}
      onClick={onClick}
      footerInfo={
        <>
          <span className={styles.cardActions}>
            { !build.published && 
              <button
                type="button"
                className={styles.cardActionBtn}
                onClick={e => { e.stopPropagation(); onEdit?.(); }}
                aria-label="Edit build"
                title="Edit"
              >
                <Pencil size={12} />
              </button>
            }
            <button
              type="button"
              className={`${styles.cardActionBtn} ${styles['cardActionBtn--danger']}`}
              onClick={e => { e.stopPropagation(); onDelete?.(); }}
              aria-label="Delete build"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </span>
          <span className={styles.cardVisibility}>
            {build.published ? (
              <><Globe size={12} /> Public</>
            ) : (
              <><Lock size={12} /> Private</>
            )}
          </span>
        </>
      }
    />
  );
}

export function PublicBuildCard({ build, onClick }: Omit<BuildCardProps, 'footerInfo'>) {
  return (
    <BuildCard
      build={build}
      onClick={onClick}
      footerInfo={
        build.user?.username ? (
          <><User size={12} /> {build.user.username}</>
        ) : null
      }
    />
  );
}