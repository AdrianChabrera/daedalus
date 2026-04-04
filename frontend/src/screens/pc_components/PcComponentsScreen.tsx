import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from '../../styles/PcComponentsScreen.module.css';
import { Cpu, Gpu, Layers, HardDrive, MemoryStick, Fan, Keyboard, Mouse, Zap, PcCase, Thermometer, Monitor, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';
import { API_ROUTES } from '../../config/api';
import type { PaginatedResult } from '../../types/PaginatedResult.type';
import type { ActiveSort, PcComponent, PcComponentTypeConfig, SortDirection } from '../../types/PcComponents.types';
import { PcComponentCard } from '../../components/PcComponentCard';
import { PcComponentSkeletonCard } from '../../components/PcComponentSkeletonCard';
import { TypeDropdown } from '../../components/PcComponentsDropdown';
import { Pagination } from '../../components/Pagination';
import { FilterSidebar } from '../../components/PcComponentsFilterSideBar';
import { useComponentFilters } from '../../hooks/useComponentsFilters';
import { SearchBar } from '../../components/Searchbar';

const PAGE_SIZE = 16;

const COMPONENT_TYPES: PcComponentTypeConfig[] = [
  {
    label: 'CPU',
    endpoint: 'cpu',
    icon: <Cpu size={16} />,
    sortFields: [
      { label: 'Total Cores', field: 'coreCount' },
      { label: 'Boost Clock', field: 'boostClock' },
      { label: 'TDP', field: 'tdp' },
    ],
    subtitle: (c) => {
      const cpu = c as PcComponent & { boostClock?: number; coreCount?: number; socket?: string };
      const boostClock = cpu.boostClock ? `${cpu.boostClock} GHz` : 'N/A';
      const coreCount = cpu.coreCount ? `${cpu.coreCount}` : 'N/A';
      const socket = cpu.socket ?? 'N/A';
      return <span>Boost Clock: {boostClock} <br/>Cores: {coreCount} <br/>Socket: {socket}</span>;
    },
  },
  {
    label: 'GPU',
    endpoint: 'gpu',
    icon: <Gpu size={16} />,
    sortFields: [
      { label: 'Memory', field: 'memory' },
      { label: 'Boost Clock', field: 'coreBoostClock' },
      { label: 'TDP', field: 'tdp' },
    ],
    subtitle: (c) => {
      const gpu = c as PcComponent & { memory?: number; coreBoostClock?: number; chipset?: string };
      const memory = gpu.memory ? `${gpu.memory} GB` : 'N/A';
      const coreBoostClock = gpu.coreBoostClock ? `${gpu.coreBoostClock} GHz` : 'N/A';
      const chipset = gpu.chipset ?? 'N/A';
      return <span>Memory: {memory} <br/>Boost Clock: {coreBoostClock} <br/>Chipset: {chipset}</span>;
    },
  },
  {
    label: 'Motherboard',
    endpoint: 'motherboard',
    icon: <Layers size={16} />,
    sortFields: [
      { label: 'Max Memory', field: 'maxMemory' },
      { label: 'Memory Slots', field: 'memorySlots' },
    ],
    subtitle: (c) => {
      const mb = c as PcComponent & { socket?: string; formFactor?: string; chipset?: string };
      return <span>Socket: {mb.socket ?? 'N/A'} <br/>Form Factor: {mb.formFactor ?? 'N/A'} <br/>Chipset: {mb.chipset ?? 'N/A'}</span>;
    },
  },
  {
    label: 'RAM',
    endpoint: 'ram',
    icon: <MemoryStick size={16} />,
    sortFields: [
      { label: 'Capacity', field: 'capacity' },
      { label: 'Speed', field: 'speed' },
      { label: 'CAS Latency', field: 'casLatency' },
    ],
    subtitle: (c) => {
      const ram = c as PcComponent & { speed?: number; capacity?: number; memoryType?: string };
      const speed = ram.speed ? `${ram.speed} MHz` : 'N/A';
      const capacity = ram.capacity ? `${ram.capacity} GB` : 'N/A';
      return <span>Speed: {speed} <br/>Capacity: {capacity} <br/>Type: {ram.memoryType ?? 'N/A'}</span>;
    },
  },
  {
    label: 'Storage',
    endpoint: 'storage-drive',
    icon: <HardDrive size={16} />,
    sortFields: [{ label: 'Capacity', field: 'capacity' }],
    subtitle: (c) => {
      const s = c as PcComponent & { capacity?: number; storageType?: string; storageInterface?: string };
      const capacity = s.capacity ? `${s.capacity} GB` : 'N/A';
      return <span>Capacity: {capacity} <br/>Type: {s.storageType ?? 'N/A'} <br/>Interface: {s.storageInterface ?? 'N/A'}</span>;
    },
  },
  {
    label: 'CPU Cooler',
    endpoint: 'cpu-cooler',
    icon: <Thermometer size={16} />,
    sortFields: [
      { label: 'Max Fan RPM', field: 'maxFanRpm' },
      { label: 'Noise Level', field: 'maxNoiseLevel' },
    ],
    subtitle: (c) => {
      const cc = c as PcComponent & { waterCooled?: boolean };
      return <span>Type: {cc.waterCooled ? 'Water Cooled' : 'Air Cooled'}</span>;
    },
  },
  {
    label: 'Case',
    endpoint: 'case',
    icon: <PcCase size={16} />,
    sortFields: [
      { label: 'Volume', field: 'volume' },
      { label: 'Weight', field: 'weight' },
    ],
    subtitle: (c) => {
      const cs = c as PcComponent & { formFactor?: string };
      return <span>Form Factor: {cs.formFactor ?? 'N/A'}</span>;
    },
  },
  {
    label: 'Power Supply',
    endpoint: 'power-supply',
    icon: <Zap size={16} />,
    sortFields: [{ label: 'Wattage', field: 'wattage' }],
    subtitle: (c) => {
      const ps = c as PcComponent & { wattage?: number; efficencyRating?: string };
      const wattage = ps.wattage ? `${ps.wattage} W` : 'N/A';
      return <span>Wattage: {wattage} <br/>Efficiency Rating: {ps.efficencyRating ?? 'N/A'}</span>;
    },
  },
  {
    label: 'Fan',
    endpoint: 'fan',
    icon: <Fan size={16} />,
    subtitle: () => <span />,
  },
  {
    label: 'Monitor',
    endpoint: 'monitor',
    icon: <Monitor size={16} />,
    sortFields: [
      { label: 'Screen Size', field: 'screenSize' },
      { label: 'Refresh Rate', field: 'refreshRate' },
      { label: 'Response Time', field: 'responseTime' },
    ],
    subtitle: (c) => {
      const m = c as PcComponent & { verticalRes?: string; horizontalRes?: string; screenSize?: number };
      const resolution = m.verticalRes && m.horizontalRes ? `${m.horizontalRes}x${m.verticalRes}` : 'N/A';
      const screenSize = m.screenSize ? `${m.screenSize} "` : 'N/A';
      return <span>Resolution: {resolution} <br/>Screen Size: {screenSize}</span>;
    },
  },
  {
    label: 'Keyboard',
    endpoint: 'keyboard',
    icon: <Keyboard size={16} />,
    subtitle: () => <span />,
  },
  {
    label: 'Mouse',
    endpoint: 'mouse',
    icon: <Mouse size={16} />,
    subtitle: () => <span />,
  },
];

function nextDirection(current: SortDirection): SortDirection {
  if (current === null) return 'ASC';
  if (current === 'ASC') return 'DESC';
  return null;
}

function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === 'ASC') return <ArrowUp size={13} />;
  if (direction === 'DESC') return <ArrowDown size={13} />;
  return <ArrowUpDown size={13} />;
}

export default function ComponentsScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const typeParam = searchParams.get('type') ?? 'cpu';
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);

  const currentType = COMPONENT_TYPES.find(t => t.endpoint === typeParam) ?? COMPONENT_TYPES[0];

  const [result, setResult] = useState<PaginatedResult<PcComponent> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState<ActiveSort>({ field: '', direction: 'ASC' });

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const {
    schema,
    loadingSchema,
    activeFilters,
    setRangeFilter,
    toggleMultiString,
    setBooleanFilter,
    clearFilters,
    hasActiveFilters,
    buildQueryString,
  } = useComponentFilters(currentType.endpoint);

  useEffect(() => {
    setActiveSort({ field: '', direction: 'ASC' });
    setSearchInput('');
    setDebouncedSearch('');
  }, [currentType.endpoint]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', '1');
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const buildOrderParam = useCallback((sort: ActiveSort): string | undefined => {
    if (sort.direction === null) return undefined;
    return `${sort.field}-${sort.direction}`;
  }, []);

  useEffect(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', '1');
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilters]);

  useEffect(() => {
    let cancelled = false;

    const fetchComponents = async () => {
      setLoading(true);
      setError(null);
      try {
        const orderParam = buildOrderParam(activeSort);
        const filterQS = buildQueryString();
        const url =
          API_ROUTES.COMPONENTS(currentType.endpoint) +
          `?page=${pageParam}&limit=${PAGE_SIZE}` +
          (orderParam ? `&order=${orderParam}` : '') +
          filterQS + 
          (debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '');
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data: PaginatedResult<PcComponent> = await res.json();
        if (!cancelled) setResult(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unexpected error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchComponents();
    return () => { cancelled = true; };
  }, [currentType.endpoint, pageParam, activeSort, buildOrderParam, buildQueryString, debouncedSearch]);

  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 1;

  const handleTypeChange = (type: PcComponentTypeConfig) => {
    setSearchParams({ type: type.endpoint, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ type: currentType.endpoint, page: String(newPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleComponentClick = (component: PcComponent) => {
    navigate(`/components/${currentType.endpoint}/${component.buildcoresId}`);
  };

  const handleSortClick = (field: string) => {
    setActiveSort(prev => {
      if (prev.field === field) {
        const next = nextDirection(prev.direction);
        if (next === null) return { field: '', direction: 'ASC' };
        return { field, direction: next };
      }
      return { field, direction: 'ASC' };
    });
    setSearchParams({ type: currentType.endpoint, page: '1' });
  };

  const fixedSortButtons = [{ label: 'Alphabetical', field: 'name' }];
  const extraSortButtons = currentType.sortFields ?? [];
  const allSortButtons = [...fixedSortButtons, ...extraSortButtons];

  return (
    <div className={styles.page}>
      <div className="bgGlow" aria-hidden />
      <div className="bgGrid" aria-hidden />

      <div className={styles.inner}>
        <div className={styles.header}>
          <TypeDropdown current={currentType} onChange={handleTypeChange} pcComponentTypes={COMPONENT_TYPES} />
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            placeholder={`Search ${currentType.label}s...`}
          />
        </div>

        <div className={styles.body}>
          <FilterSidebar
            schema={schema}
            loading={loadingSchema}
            activeFilters={activeFilters}
            onRangeChange={setRangeFilter}
            onMultiStringToggle={toggleMultiString}
            onBooleanSelect={setBooleanFilter}
            onClear={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          <div className={styles.content}>
            <div className={styles.sortBar}>
              <span className={styles.sortLabel}>Order by:</span>
              <div className={styles.sortButtons}>
                {allSortButtons.map(btn => {
                  const isActive = activeSort.field === btn.field && activeSort.direction !== null;
                  const direction = isActive ? activeSort.direction : null;
                  return (
                    <button
                      key={btn.field}
                      className={`${styles.sortBtn} ${isActive ? styles.sortBtnActive : ''}`}
                      onClick={() => handleSortClick(btn.field)}
                    >
                      <SortIcon direction={direction} />
                      <span>{btn.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error ? (
              <div className={styles.errorState}>
                <p className={styles.errorText}>Could not load components: {error}</p>
              </div>
            ) : (
              <>
                <div className={styles.grid}>
                  {loading
                    ? Array.from({ length: PAGE_SIZE }).map((_, i) => <PcComponentSkeletonCard key={i} />)
                    : result?.data.map(component => (
                        <PcComponentCard
                          key={component.buildcoresId}
                          component={component}
                          subtitle={currentType.subtitle(component)}
                          onClick={() => handleComponentClick(component)}
                        />
                      ))}
                </div>

                {!loading && result && result.total > 0 && (
                  <Pagination
                    page={pageParam}
                    totalPages={totalPages}
                    onPrev={() => handlePageChange(pageParam - 1)}
                    onNext={() => handlePageChange(pageParam + 1)}
                    onPageSelect={handlePageChange}
                  />
                )}

                {!loading && result?.total === 0 && (
                  <div className={styles.emptyState}>
                    <p>No components found.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}