import { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import styles from '../../styles/Searchbar.module.css';

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className={styles.wrap}>
      <Search size={13} className={styles.icon} />
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
      {value && (
        <button
          className={styles.clear}
          onClick={() => { onChange(''); inputRef.current?.focus(); }}
          type="button"
          aria-label="Clear search"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}