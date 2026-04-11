import { Plus, X } from "lucide-react";
import type { SlotRowProps } from "../../types/CreateBuildTypes";
import styles from '../../styles/CreateBuildScreen.module.css';

function StarPlaceholder() {
  return (
    <span className={styles.stars} aria-label="Rating — not yet implemented">
      {[1,2,3,4,5].map(i => <span key={i} className={styles.starEmpty}>★</span>)}
    </span>
  );
}

function SpecTags({ specs }: { specs?: Record<string, unknown> }) {
  if (!specs) return null; 

  const entries = Object.entries(specs).filter(([, v]) => v != null);
  if (!entries.length) return null;
  
  return (
    <span className={styles.specTags}>
      {entries.map(([k, v]) => (
        <span key={k} className={styles.specTag}>
          <span className={styles.specTagKey}>{formatSpecKey(k)}</span>
          <span className={styles.specTagValue}>{String(v)}</span>
        </span>
      ))}
    </span>
  );
}

function formatSpecKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
}

export function CreteBuildPcComponentsSlotRow({ slot, single, multi, onAssign, onRemoveSingle, onRemoveMulti }: SlotRowProps) {
  const isEmpty = slot.multi ? multi.length === 0 : single === null;

  if (isEmpty) {
    return (
      <div className={styles.slotRow}>
        <div className={styles.slotIcon}>{slot.icon}</div>
        <div className={styles.slotLabel}>{slot.label}</div>
        <div className={styles.slotEmpty}>
          <button className={styles.slotAddBtn} onClick={onAssign}>
            <Plus size={16} />
            ADD
          </button>
        </div>
      </div>
    );
  }

  if (slot.multi) {
    return (
      <>
        {multi.map((comp) => (
          <div key={comp.id} className={`${styles.slotRow} ${styles.slotRowFilled}`}>
            <div className={styles.slotIcon}>{slot.icon}</div>
            <div className={styles.slotLabel}>{slot.label}</div>
            <div className={styles.slotFilled}>
              <div className={styles.slotCompInfo}>
                <span className={styles.slotCompName}>{comp.name}</span>
                <StarPlaceholder />
                <SpecTags specs={comp.specs} />
              </div>
              <button className={styles.slotRemoveBtn} onClick={() => onRemoveMulti(comp.id)} aria-label="Remove">
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
        <div className={`${styles.slotRow} ${styles.slotRowAddMore}`}>
          <div className={styles.slotIcon} style={{ opacity: 0 }}>{slot.icon}</div>
          <div className={styles.slotLabel} style={{ opacity: 0 }}>{slot.label}</div>
          <div className={styles.slotEmpty}>
            <button className={styles.slotAddMoreBtn} onClick={onAssign}>
              <Plus size={14} />
              Add more
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className={`${styles.slotRow} ${styles.slotRowFilled}`}>
      <div className={styles.slotIcon}>{slot.icon}</div>
      <div className={styles.slotLabel}>{slot.label}</div>
      <div className={styles.slotFilled}>
        <div className={styles.slotCompInfo}>
          <span className={styles.slotCompName}>{single!.name}</span>
          <StarPlaceholder />
          <SpecTags specs={single!.specs} />
        </div>
        <button className={styles.slotRemoveBtn} onClick={onRemoveSingle} aria-label="Remove">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}