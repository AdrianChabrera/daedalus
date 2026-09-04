import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import styles from '../../styles/PcComponentsScreen.module.css';
import type { PcComponent, PcComponentTypeConfig } from '../../types/PcComponents.types';
import type { BuildState } from '../../types/CreateBuildTypes';
import { PcComponentCard } from '../../components/pc_components/PcComponentCard';
import { PcComponentSkeletonCard } from '../../components/pc_components/PcComponentSkeletonCard';
import { TypeDropdown } from '../../components/pc_components/PcComponentsDropdown';
import { Pagination } from '../../components/general/Pagination';
import { FilterSidebar } from '../../components/pc_components/PcComponentsFilterSideBar';
import { SearchBar } from '../../components/general/Searchbar';
import { SortIcon } from '../../components/general/SortIcon';
import { COMPONENT_TYPES } from '../../consts/PcComponentTypes';
import { useComponentFilters } from '../../hooks/useComponentsFilters';
import { useSortState } from '../../hooks/useSortState';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';
import { useCompatibleComponents } from '../../hooks/useCompatibleComponents';

const PAGE_SIZE = 16;

export default function CompatibleComponentsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const build = location.state?.build as BuildState | undefined;
  const locationState = location.state as { build: BuildState } | null;

  const typeParam = searchParams.get('type') ?? 'cpu';
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const currentType = COMPONENT_TYPES.find(t => t.endpoint === typeParam) ?? COMPONENT_TYPES[0];

  const { activeSort, handleSortClick, reset: resetSort, buildOrderParam } = useSortState();
  const { searchInput, setSearchInput, debouncedSearch, reset: resetSearch } = useDebouncedSearch();
  const {
    schema, loadingSchema, activeFilters,
    setRangeFilter, toggleMultiString, setBooleanFilter,
    clearFilters, hasActiveFilters, buildQueryString,
  } = useComponentFilters(currentType.endpoint);

  const { result, loading, error } = useCompatibleComponents({
    build: build ?? {
      cpuId: null, gpuId: null, motherboardId: null, pcCaseId: null,
      powerSupplyId: null, cpuCoolerId: null, keyboardId: null, mouseId: null,
      ramIds: [], storageDriveIds: [], fanIds: [], monitorIds: [],
    },
    componentType: currentType.endpoint,
    page: pageParam,
    pageSize: PAGE_SIZE,
    activeSort,
    buildOrderParam,
    buildQueryString,
    debouncedSearch,
  });

  useEffect(() => {
    resetSort();
    resetSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentType.endpoint]);

  useEffect(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', '1');
      return next;
    }, { replace: true, state: locationState });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, activeFilters]);

  useEffect(() => {
    if (!build) {
      navigate('/components', { replace: true });
    }
  }, [build, navigate]);

  const componentPlural = useMemo(() => {
    const label = currentType.label.toLowerCase();
    
    if (label === 'mouse') return 'Mice';
    if (label === 'power supply') return 'Power Supplies';
    
    return label.charAt(0).toUpperCase() + label.slice(1) + 's';
  }, [currentType.label]);

  const handleTypeChange = (type: PcComponentTypeConfig) => {
    setSearchParams({ type: type.endpoint, page: '1' }, { state: locationState });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ type: currentType.endpoint, page: String(newPage) }, { state: locationState });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleComponentClick = (component: PcComponent) => {
    navigate(`/components/${currentType.endpoint}/${component.buildcoresId}`);
  };

  const onSortClick = (field: string) => {
    handleSortClick(field);
    setSearchParams({ type: currentType.endpoint, page: '1' }, { state: locationState });
  };

  const fixedSortButtons = [{ label: 'Alphabetical', field: 'name' }];
  const allSortButtons = [...fixedSortButtons, ...(currentType.sortFields ?? [])];
  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 1;

  return (
    <div className={styles.page}>
      <div className="bgGlow" aria-hidden />
      <div className="bgGrid" aria-hidden />
      <div className={styles.inner}>
        <div className={styles.header}>
          <TypeDropdown current={currentType} onChange={handleTypeChange} pcComponentTypes={COMPONENT_TYPES} />
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder={`Search ${currentType.label}s...`} />
        </div>
        <div className={styles.body}>
          <FilterSidebar
            schema={schema} loading={loadingSchema} activeFilters={activeFilters}
            onRangeChange={setRangeFilter} onMultiStringToggle={toggleMultiString}
            onBooleanSelect={setBooleanFilter} onClear={clearFilters} hasActiveFilters={hasActiveFilters}
          />
          <div className={styles.content}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: -8 }}>
              <h1
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: 'var(--white)',
                  textTransform: 'uppercase',
                }}
              >
                Compatible {componentPlural}
              </h1>
            </div>
            <div className={styles.sortBar}>
              <span className={styles.sortLabel}>Order by:</span>
              <div className={styles.sortButtons}>
                {allSortButtons.map(btn => {
                  const isActive = activeSort.field === btn.field && activeSort.direction !== null;
                  return (
                    <button
                      key={btn.field}
                      className={`${styles.sortBtn} ${isActive ? styles.sortBtnActive : ''}`}
                      onClick={() => onSortClick(btn.field)}
                    >
                      <SortIcon direction={isActive ? activeSort.direction : null} />
                      <span>{btn.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {error ? (
              <div className={styles.errorState}>
                <p className={styles.errorText}>Could not load compatible components: {error}</p>
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
                    page={pageParam} totalPages={totalPages}
                    onPrev={() => handlePageChange(pageParam - 1)}
                    onNext={() => handlePageChange(pageParam + 1)}
                    onPageSelect={handlePageChange}
                  />
                )}
                {!loading && result?.total === 0 && (
                  <div className={styles.emptyState}>
                    <p>No compatible {componentPlural.toLowerCase()} found for your current build.</p>
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