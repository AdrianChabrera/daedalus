import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { FilterSchema, ActiveFilters } from '../../hooks/useComponentsFilters';
import styles from '../../styles/PcComponentsFilterSideBar.module.css';

function formatFilterLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
}

const COLLAPSED_COUNT = 4;

function MultiStringFilter({
  label,
  values,
  selected,
  onToggle,
}: {
  label: string;
  values: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? values : values.slice(0, COLLAPSED_COUNT);

  return (
    <div className={styles.filterGroup}>
      <p className={styles.filterGroupLabel}>{label}</p>
      <ul className={styles.checkList}>
        {visible.map(v => {
          const checked = selected.includes(v);
          return (
            <li key={v}>
              <label className={`${styles.checkItem} ${checked ? styles.checkItemActive : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(v)}
                  className={styles.hiddenCheck}
                />
                <span className={styles.customCheck} aria-hidden>
                  {checked && (
                    <svg viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className={styles.checkLabel}>{v}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {values.length > COLLAPSED_COUNT && (
        <button
          className={styles.viewMoreBtn}
          onClick={() => setExpanded(e => !e)}
          type="button"
        >
          {expanded ? 'View less' : `View ${values.length - COLLAPSED_COUNT} more`}
          <ChevronDown
            size={12}
            className={`${styles.viewMoreChevron} ${expanded ? styles.viewMoreChevronOpen : ''}`}
          />
        </button>
      )}
    </div>
  );
}

function RangeFilter({
  label,
  min: absMin,
  max: absMax,
  currentMin,
  currentMax,
  onChangeMin,
  onChangeMax,
}: {
  label: string;
  min: number;
  max: number;
  currentMin: number | undefined;
  currentMax: number | undefined;
  onChangeMin: (v: number | undefined) => void;
  onChangeMax: (v: number | undefined) => void;
}) {
  const step = Number.isInteger(absMin) && Number.isInteger(absMax) ? 1 : 0.01;
  const decimals = step === 1 ? 0 : 2;

  const effectiveMin = currentMin ?? absMin;
  const effectiveMax = currentMax ?? absMax;

  const [sliderMin, setSliderMin] = useState(effectiveMin);
  const [sliderMax, setSliderMax] = useState(effectiveMax);

  const [prevEffectiveMin, setPrevEffectiveMin] = useState(effectiveMin);
  const [prevEffectiveMax, setPrevEffectiveMax] = useState(effectiveMax);

  if (effectiveMin !== prevEffectiveMin) {
    setPrevEffectiveMin(effectiveMin);
    setSliderMin(effectiveMin);
  }

  if (effectiveMax !== prevEffectiveMax) {
    setPrevEffectiveMax(effectiveMax);
    setSliderMax(effectiveMax);
  }

  const range = absMax - absMin || 1;
  const pctMin = Math.max(0, Math.min(100, ((sliderMin - absMin) / range) * 100));
  const pctMax = Math.max(0, Math.min(100, ((sliderMax - absMin) / range) * 100));

  const [minText, setMinText] = useState('');
  const [maxText, setMaxText] = useState('');
  const [minFocused, setMinFocused] = useState(false);
  const [maxFocused, setMaxFocused] = useState(false);

  const fmt = (n: number) =>
    Number.isInteger(n) ? String(n) : n.toFixed(decimals).replace(/\.?0+$/, '');

  const handleSliderMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const clamped = Math.min(val, sliderMax - step);
    setSliderMin(clamped);
  };

  const handleSliderMinRelease = () => {
    onChangeMin(sliderMin <= absMin ? undefined : sliderMin);
  };

  const handleSliderMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const clamped = Math.max(val, sliderMin + step);
    setSliderMax(clamped);
  };

  const handleSliderMaxRelease = () => {
    onChangeMax(sliderMax >= absMax ? undefined : sliderMax);
  };

  const handleMinFocus = () => {
    setMinFocused(true);
    setMinText(fmt(sliderMin));
  };

  const handleMinBlur = () => {
    setMinFocused(false);
    const val = parseFloat(minText);
    if (isNaN(val) || val <= absMin) {
      onChangeMin(undefined);
    } else {
      onChangeMin(Math.min(val, sliderMax - step));
    }
    setMinText('');
  };

  const handleMaxFocus = () => {
    setMaxFocused(true);
    setMaxText(fmt(sliderMax));
  };

  const handleMaxBlur = () => {
    setMaxFocused(false);
    const val = parseFloat(maxText);
    if (isNaN(val) || val >= absMax) {
      onChangeMax(undefined);
    } else {
      onChangeMax(Math.max(val, sliderMin + step)); 
    }
    setMaxText('');
  };

  const minDisplay = minFocused ? minText : fmt(sliderMin);
  const maxDisplay = maxFocused ? maxText : fmt(sliderMax);

  return (
    <div className={styles.filterGroup}>
      <p className={styles.filterGroupLabel}>{label}</p>

      <div className={styles.rangeWrap}>
        <div className={styles.rangeTrack}>
          <div
            className={styles.rangeTrackFill}
            style={{ left: `${pctMin}%`, width: `${pctMax - pctMin}%` }}
          />
        </div>

        <input
          type="range"
          min={absMin}
          max={absMax}
          step={step}
          value={sliderMin} 
          onChange={handleSliderMinChange}
          onMouseUp={handleSliderMinRelease}
          onTouchEnd={handleSliderMinRelease}
          className={styles.rangeInput}
          style={{ zIndex: pctMin >= 95 ? 5 : 3 }}
        />

        <input
          type="range"
          min={absMin}
          max={absMax}
          step={step}
          value={sliderMax}
          onChange={handleSliderMaxChange}
          onMouseUp={handleSliderMaxRelease}
          onTouchEnd={handleSliderMaxRelease}
          className={styles.rangeInput}
          style={{ zIndex: 4 }}
        />
      </div>

      <div className={styles.rangeInputs}>
        <input
          type="number"
          className={styles.rangeNumberInput}
          value={minDisplay}
          onChange={e => setMinText(e.target.value)}
          onFocus={handleMinFocus}
          onBlur={handleMinBlur}
          onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
        <span className={styles.rangeSep}>–</span>
        <input
          type="number"
          className={styles.rangeNumberInput}
          value={maxDisplay}
          onChange={e => setMaxText(e.target.value)}
          onFocus={handleMaxFocus}
          onBlur={handleMaxBlur}
          onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
      </div>
    </div>
  );
}

function BooleanFilter({
  label,
  value,
  onSelect,
}: {
  label: string;
  value: boolean | undefined;
  onSelect: (v: boolean | undefined) => void;
}) {
  const options = [
    { label: 'Yes', bool: true },
    { label: 'No', bool: false },
  ];

  return (
    <div className={styles.filterGroup}>
      <p className={styles.filterGroupLabel}>{label}</p>
      <div className={styles.boolRow}>
        {options.map(opt => {
          const active = value === opt.bool;
          return (
            <label
              key={opt.label}
              className={`${styles.checkItem} ${active ? styles.checkItemActive : ''}`}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => onSelect(active ? undefined : opt.bool)}
                className={styles.hiddenCheck}
              />
              <span className={styles.customCheck} aria-hidden>
                {active && (
                  <svg viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className={styles.checkLabel}>{opt.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function FilterSidebar({
  schema,
  loading,
  activeFilters,
  onRangeChange,
  onMultiStringToggle,
  onBooleanSelect,
  onClear,
  hasActiveFilters,
}: {
  schema: FilterSchema;
  loading: boolean;
  activeFilters: ActiveFilters;
  onRangeChange: (key: string, bound: 'min' | 'max', value: number | undefined) => void;
  onMultiStringToggle: (key: string, value: string) => void;
  onBooleanSelect: (key: string, value: boolean | undefined) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}) {
  const entries = Object.entries(schema).sort(([, a], [, b]) => {
    const order = { 'multi-string': 0, range: 1, boolean: 2 };
    return order[a.type] - order[b.type];
  });

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarTitle}>Filters</span>
        {hasActiveFilters && (
          <button className={styles.clearBtn} onClick={onClear} type="button">
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.skeletonWrap}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.skeletonGroup}>
              <div className={styles.skeletonLabel} />
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLine} style={{ width: '70%' }} />
              <div className={styles.skeletonLine} style={{ width: '85%' }} />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? null : (
        <div className={styles.filterList}>
          {entries.map(([key, def]) => {
            const label = formatFilterLabel(key);

            if (def.type === 'multi-string') {
              return (
                <MultiStringFilter
                  key={key}
                  label={label}
                  values={def.values}
                  selected={activeFilters.multiStrings[key] ?? []}
                  onToggle={v => onMultiStringToggle(key, v)}
                />
              );
            }

            if (def.type === 'range' && def.min !== null && def.max !== null) {
              return (
                <RangeFilter
                  key={key}
                  label={label}
                  min={Number(def.min)}
                  max={Number(def.max)}
                  currentMin={activeFilters.ranges[key]?.min}
                  currentMax={activeFilters.ranges[key]?.max}
                  onChangeMin={v => onRangeChange(key, 'min', v)}
                  onChangeMax={v => onRangeChange(key, 'max', v)}
                />
              );
            }

            if (def.type === 'boolean') {
              return (
                <BooleanFilter
                  key={key}
                  label={label}
                  value={activeFilters.booleans[key]}
                  onSelect={v => onBooleanSelect(key, v)}
                />
              );
            }

            return null;
          })}
        </div>
      )}
    </aside>
  );
}