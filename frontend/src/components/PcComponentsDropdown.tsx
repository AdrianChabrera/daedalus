import { ChevronDown } from "lucide-react";
import type { PcComponentTypeConfig } from "../types/PcComponents.types";
import { useEffect, useRef, useState } from "react";
import styles from '../styles/PcComponentsScreen.module.css';

export function TypeDropdown({
  current,
  onChange,
  pcComponentTypes,
}: {
  current: PcComponentTypeConfig;
  onChange: (t: PcComponentTypeConfig) => void;
  pcComponentTypes: PcComponentTypeConfig[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={styles.dropdown} ref={ref}>
      <button
        className={styles.dropdownTrigger}
        onClick={() => setOpen(v => !v)}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={styles.dropdownIcon}>{current.icon}</span>
        <span className={styles.dropdownLabel}>{current.label}</span>
        <ChevronDown
          size={14}
          className={`${styles.dropdownChevron} ${open ? styles.dropdownChevronOpen : ''}`}
        />
      </button>

      {open && (
        <ul className={styles.dropdownMenu} role="listbox">
          {pcComponentTypes.map(type => (
            <li key={type.endpoint} role="option" aria-selected={type.endpoint === current.endpoint}>
              <button
                className={`${styles.dropdownItem} ${type.endpoint === current.endpoint ? styles.dropdownItemActive : ''}`}
                onClick={() => { onChange(type); setOpen(false); }}
                type="button"
              >
                <span className={styles.dropdownItemIcon}>{type.icon}</span>
                {type.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}