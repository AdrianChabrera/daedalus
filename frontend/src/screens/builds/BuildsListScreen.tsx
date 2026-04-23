import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MyBuildCard, PublicBuildCard } from '../../components/builds/BuildCard';
import { BuildSkeletonCard } from '../../components/builds/BuildSkeletonCard';
import { Pagination } from '../../components/general/Pagination';
import { SearchBar } from '../../components/general/Searchbar';
import { SortIcon } from '../../components/general/SortIcon';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';
import { useSortState } from '../../hooks/useSortState';
import { useBuilds } from '../../hooks/useBuilds';
import styles from '../../styles/BuildsScreen.module.css';
import type { BuildSummary } from '../../types/BuildLists.type';

const PAGE_SIZE = 15;

const SORT_FIELDS = [
  { label: 'Alphabetical', field: 'name' },
  { label: 'Date', field: 'createdAt' },
];

interface BuildsListScreenProps {
  title: string;
  apiUrl: string;
  authToken?: string;
  showCreateButton?: boolean;
  onBuildClick?: (build: BuildSummary) => void;
  headerExtra?: React.ReactNode;
  cardVariant: 'my-builds' | 'public-builds';
  onDeleteBuild?: (build: BuildSummary) => void; 
}

export function BuildsListScreen({
  title,
  apiUrl,
  authToken,
  showCreateButton = false,
  onBuildClick,
  headerExtra,
  cardVariant,
  onDeleteBuild,
}: BuildsListScreenProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);

  const { activeSort, handleSortClick, reset: resetSort, buildOrderParam } = useSortState();
  const { searchInput, setSearchInput, debouncedSearch, reset: resetSearch } = useDebouncedSearch();

  const orderParam = buildOrderParam(activeSort) ?? 'name-ASC';

  const { result, loading, error } = useBuilds({
    url: apiUrl,
    page: pageParam,
    pageSize: PAGE_SIZE,
    order: orderParam,
    search: debouncedSearch,
    authToken,
  });

  useEffect(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', '1');
      return next;
    }, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, activeSort.field, activeSort.direction]);

  useEffect(() => {
    resetSort();
    resetSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortClick_ = (field: string) => {
    handleSortClick(field);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', '1');
      return next;
    });
  };

  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 1;

  const renderCard = (build: BuildSummary) => {
    const props = { 
      key: build.id, 
      build, 
      onClick: () => onBuildClick?.(build), 
      onDelete: () => onDeleteBuild?.(build),
    };
    return cardVariant === 'my-builds'
      ? <MyBuildCard {...props} />
      : <PublicBuildCard {...props} />;
  };

  return (
    <div className={styles.page}>
      <div className="bgGlow" aria-hidden />
      <div className="bgGrid" aria-hidden />

      <div className={styles.inner}>
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <h1 className={styles.pageTitle}>{title}</h1>
            {headerExtra}
          </div>

          {showCreateButton && (
            <Link to="/builds/new" className={styles.createBtn}>
              <Plus size={16} />
              Create a new build
            </Link>
          )}
        </div>

        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search for Builds…"
        />

        <div className={styles.sortBar}>
          <span className={styles.sortLabel}>Order by:</span>
          <div className={styles.sortButtons}>
            {SORT_FIELDS.map(btn => {
              const isActive =
                activeSort.field === btn.field && activeSort.direction !== null;
              return (
                <button
                  key={btn.field}
                  className={`${styles.sortBtn} ${isActive ? styles.sortBtnActive : ''}`}
                  onClick={() => handleSortClick_(btn.field)}
                  type="button"
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
            <p className={styles.errorText}>Could not load builds: {error}</p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {loading
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <BuildSkeletonCard key={i} />
                  ))
                : result?.data.map(renderCard)}
            </div>

            {!loading && result && result.total === 0 && (
              <div className={styles.emptyState}>
                <p>No builds found.</p>
              </div>
            )}

            {!loading && result && result.total > 0 && (
              <Pagination
                page={pageParam}
                totalPages={totalPages}
                onPrev={() => handlePageChange(pageParam - 1)}
                onNext={() => handlePageChange(pageParam + 1)}
                onPageSelect={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}