import { useState } from "react";
import type { ComponentPickerProps, PickerResult } from "../../types/CreateBuildTypes";
import { API_ROUTES } from "../../config/api";
import styles from '../../styles/CreateBuildScreen.module.css';
import { ArrowUpRight, ChevronRight, X } from "lucide-react";
import { Link } from "react-router-dom";

export function CreateBuildPcComponentPicker({ slot, onSelect, onClose }: ComponentPickerProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<PickerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const url = API_ROUTES.COMPONENTS(slot.endpoint) + `?page=1&limit=20` +
        (search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '');
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResults(data.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') doSearch();
  };

  return (
    <div className={styles.pickerOverlay} onClick={onClose}>
      <div className={styles.pickerModal} onClick={e => e.stopPropagation()}>
        <div className={styles.pickerHeader}>
          <div className={styles.pickerIcon}>{slot.icon}</div>
          <h2 className={styles.pickerTitle}>Select {slot.label}</h2>
          <button className={styles.pickerClose} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.pickerSearch}>
          <input
            className={styles.pickerInput}
            placeholder={`Search ${slot.label}s…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKey}
            autoFocus
          />
          <button className={styles.pickerSearchBtn} onClick={doSearch}>Search</button>
        </div>
        <div className={styles.pickerCatalogLink}>
          <span>or</span>
          <Link to={`/components?type=${slot.endpoint}&page=1`}>
            Browse full catalog
            <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className={styles.pickerResults}>
          {loading && (
            <div className={styles.pickerLoading}>
              <div className={styles.pickerSpinner} />
            </div>
          )}
          {!loading && searched && results.length === 0 && (
            <p className={styles.pickerEmpty}>No results found.</p>
          )}
          {!loading && !searched && (
            <p className={styles.pickerHint}>Type a name and press Search or Enter.</p>
          )}
          {!loading && results.map(r => (
            <button
              key={r.buildcoresId}
              className={styles.pickerItem}
              onClick={() => onSelect({ 
                id: r.buildcoresId, 
                name: r.name ?? r.buildcoresId,
                specs: Object.fromEntries(
                  slot.specs.map(k => [k, r[k]])
                )
              })}
            >
              <span className={styles.pickerItemName}>{r.name ?? '—'}</span>
              <ChevronRight size={14} className={styles.pickerItemArrow} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}