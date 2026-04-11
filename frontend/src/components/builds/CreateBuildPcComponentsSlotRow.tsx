import { Minus, Plus, X } from "lucide-react";
import type { MultiComponentEntry, SlotRowProps } from "../../types/CreateBuildTypes";
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

function QuantityControl({
  quantity,
  onIncrement,
  onDecrement,
}: {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div className={styles.quantityControl}>
      <button
        className={styles.quantityBtn}
        onClick={onDecrement}
        aria-label="Decrease quantity"
        type="button"
      >
        <Minus size={11} />
      </button>
      <span className={styles.quantityValue}>{quantity}</span>
      <button
        className={styles.quantityBtn}
        onClick={onIncrement}
        aria-label="Increase quantity"
        type="button"
      >
        <Plus size={11} />
      </button>
    </div>
  );
}

export function CreteBuildPcComponentsSlotRow({
  slot,
  single,
  multi,
  multiEntries,
  onAssign,
  onRemoveSingle,
  onRemoveMulti,
  onQuantityChange,
}: SlotRowProps) {
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
        {multi.map((comp) => {
          const entry: MultiComponentEntry | undefined = multiEntries.find(
            e => e.componentId === comp.id
          );
          const quantity = entry?.quantity ?? 1;

          return (
            <div key={comp.id} className={`${styles.slotRow} ${styles.slotRowFilled}`}>
              <div className={styles.slotIcon}>{slot.icon}</div>
              <div className={styles.slotLabel}>{slot.label}</div>
              <div className={styles.slotFilled}>
                <div className={styles.slotCompInfo}>
                  <span className={styles.slotCompName}>{comp.name}</span>
                  <StarPlaceholder />
                  <SpecTags specs={comp.specs} />
                </div>
                <QuantityControl
                  quantity={quantity}
                  onIncrement={() => onQuantityChange(comp.id, quantity + 1)}
                  onDecrement={() => {
                    if (quantity > 1) {
                      onQuantityChange(comp.id, quantity - 1);
                    } else {
                      onRemoveMulti(comp.id);
                    }
                  }}
                />
                <button
                  className={styles.slotRemoveBtn}
                  onClick={() => onRemoveMulti(comp.id)}
                  aria-label="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
        <div className={`${styles.slotRow} ${styles.slotRowAddMore}`}>
          <div className={styles.slotIcon} style={{ opacity: 0 }}>{slot.icon}</div>
          <div className={styles.slotLabel} style={{ opacity: 0 }}>{slot.label}</div>
          <div className={styles.slotEmpty}>
            <button className={styles.slotAddMoreBtn} onClick={onAssign}>
              <Plus size={14} />
              Add different model
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