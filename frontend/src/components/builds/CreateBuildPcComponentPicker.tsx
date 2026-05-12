import { useState } from "react";
import type { BuildState, ComponentPickerProps, PickerResult } from "../../types/CreateBuildTypes";
import { API_ROUTES } from "../../config/api";
import styles from '../../styles/CreateBuildScreen.module.css';
import { ChevronRight, Component, ShieldCheck, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export function CreateBuildPcComponentPicker({ slot, build, hasErrors, onSelect, onClose }: ComponentPickerProps & { build: BuildState; hasErrors?: boolean }) {
  const navigate = useNavigate();
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
    if (e.key === 'Enter') void doSearch();
  };

  const handleBrowseCompatible = () => {
    console.log('navigating to compatible', slot.endpoint, build);
    onClose();
    navigate(
      `/components/compatible?type=${slot.endpoint}&page=1`,
      { state: { build } },
    );
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
          <button className={styles.pickerSearchBtn} onClick={() => void doSearch()}>Search</button>
        </div>
        <div className={styles.pickerCatalogLink}>
          <Link to={`/components?type=${slot.endpoint}&page=1`}>
            Browse full catalog
            <Component size={12} />
          </Link>
          <span>·</span>
          <button
            className={styles.pickerCompatibleLink}
            onClick={handleBrowseCompatible}
            disabled={hasErrors}
            title={hasErrors ? 'Fix all errors in your build before browsing compatible components' : undefined}
          >
            <ShieldCheck size={12} />
            {hasErrors
              ? 'Fix errors to browse compatible components'
              : 'Browse compatible only'}
          </button>
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