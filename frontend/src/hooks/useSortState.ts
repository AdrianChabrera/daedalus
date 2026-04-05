import { useState, useCallback } from 'react';
import type { ActiveSort, SortDirection } from '../types/PcComponents.types';

function nextDirection(current: SortDirection): SortDirection {
  if (current === null) return 'ASC';
  if (current === 'ASC') return 'DESC';
  return null;
}

export function useSortState() {
  const [activeSort, setActiveSort] = useState<ActiveSort>({
    field: '',
    direction: 'ASC',
  });

  const handleSortClick = useCallback((field: string) => {
    setActiveSort(prev => {
      if (prev.field === field) {
        const next = nextDirection(prev.direction);
        if (next === null) return { field: '', direction: 'ASC' };
        return { field, direction: next };
      }
      return { field, direction: 'ASC' };
    });
  }, []);

  const reset = useCallback(() => {
    setActiveSort({ field: '', direction: 'ASC' });
  }, []);

  const buildOrderParam = useCallback(
    (sort: ActiveSort = activeSort): string | undefined => {
    if (sort.direction === null) return undefined;
      return `${sort.field}-${sort.direction}`;
    },
    [activeSort],
  );

  return { activeSort, handleSortClick, reset, buildOrderParam };
}