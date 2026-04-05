import { useState, useEffect } from 'react';

export function useDebouncedSearch(delay = 400) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), delay);
    return () => clearTimeout(t);
  }, [searchInput, delay]);

  const reset = () => {
    setSearchInput('');
    setDebouncedSearch('');
  };

  return { searchInput, setSearchInput, debouncedSearch, reset };
}