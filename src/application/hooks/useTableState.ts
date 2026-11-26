import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from './useDebounce';

export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

export interface TableStateOptions<T> {
  /** Produces the searchable text for a row. */
  getSearchText?: (row: T) => string;
  /** Map of column key -> value extractor used for sorting. */
  sorters?: Record<string, (row: T) => string | number>;
  initialSort?: SortState;
  pageSize?: number;
  /** Extra predicate filter (e.g. status chips), applied before search. */
  filterFn?: (row: T) => boolean;
}

/**
 * Generic client-side table state: debounced search, tri-state column
 * sorting (asc -> desc -> off) and pagination, all composed from one
 * source array. Used by the reusable <DataTable /> component.
 */
export function useTableState<T>(rows: T[], options: TableStateOptions<T> = {}) {
  const { getSearchText, sorters, initialSort, filterFn } = options;

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);
  const [sort, setSort] = useState<SortState | null>(initialSort ?? null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(options.pageSize ?? 10);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1);
  }, []);

  const filtered = useMemo(() => {
    let out = rows;
    if (filterFn) out = out.filter(filterFn);
    const q = debouncedQuery.trim().toLowerCase();
    if (q && getSearchText) {
      out = out.filter((row) => getSearchText(row).toLowerCase().includes(q));
    }
    return out;
  }, [rows, filterFn, debouncedQuery, getSearchText]);

  const sorted = useMemo(() => {
    if (!sort || !sorters || !sorters[sort.key]) return filtered;
    const getValue = sorters[sort.key];
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [filtered, sort, sorters]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);

  const pageRows = useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sorted, currentPage, pageSize],
  );

  // Reset pagination whenever the result set is narrowed.
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, filterFn]);

  const toggleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null; // third click clears the sort
    });
  }, []);

  return {
    query,
    setQuery,
    sort,
    toggleSort,
    page: currentPage,
    pageCount,
    setPage,
    pageSize,
    setPageSize,
    total: sorted.length,
    pageRows,
  };
}
