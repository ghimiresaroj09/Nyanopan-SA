import { useMemo, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { useTableState, type SortState } from '../../../application/hooks/useTableState';
import { cn } from '../../../shared/format';
import { EmptyState } from '../ui/EmptyState';
import { Pagination } from '../ui/Pagination';
import { SearchInput } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  /** Provide to make the column sortable. */
  sortValue?: (row: T) => string | number;
  align?: 'left' | 'right' | 'center';
}

export interface DataTableProps<T> {
  data: T[];
  columns: Array<Column<T>>;
  getRowId: (row: T) => string;
  /** Enables the built-in search box when provided. */
  getSearchText?: (row: T) => string;
  searchPlaceholder?: string;
  /** Extra predicate filter, e.g. status chips outside the table. */
  filterFn?: (row: T) => boolean;
  pageSize?: number;
  initialSort?: SortState;
  /** Extra controls rendered to the right of the search box. */
  toolbar?: ReactNode;
  hideSearch?: boolean;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
}

/**
 * Reusable data table with debounced search, tri-state column sorting,
 * pagination, loading skeletons and empty states. Fully generic over
 * the row type — pages only describe columns.
 */
export function DataTable<T>({
  data,
  columns,
  getRowId,
  getSearchText,
  searchPlaceholder = 'Search…',
  filterFn,
  pageSize = 8,
  initialSort,
  toolbar,
  hideSearch = false,
  loading = false,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  onRowClick,
}: DataTableProps<T>) {
  const sorters = useMemo(() => {
    const map: Record<string, (row: T) => string | number> = {};
    columns.forEach((column) => {
      if (column.sortValue) map[column.key] = column.sortValue;
    });
    return map;
  }, [columns]);

  const table = useTableState(data, {
    getSearchText,
    sorters,
    initialSort,
    pageSize,
    filterFn,
  });

  const from = table.total === 0 ? 0 : (table.page - 1) * table.pageSize + 1;
  const to = Math.min(table.page * table.pageSize, table.total);

  return (
    <div className="data-table-root">
      {(!hideSearch || toolbar) && (
        <div className="table-toolbar">
          {!hideSearch && getSearchText ? (
            <SearchInput
              className="table-search"
              placeholder={searchPlaceholder}
              value={table.query}
              onChange={(event) => table.setQuery(event.target.value)}
            />
          ) : (
            <span />
          )}
          {toolbar}
        </div>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th className="th-sn">SN</th>
              {columns.map((column) => {
                const sortable = Boolean(column.sortValue);
                const sorted = table.sort?.key === column.key;
                return (
                  <th
                    key={column.key}
                    style={{ textAlign: column.align ?? 'left' }}
                    className={cn(sortable && 'th-sort')}
                    onClick={sortable ? () => table.toggleSort(column.key) : undefined}
                    aria-sort={
                      sorted ? (table.sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined
                    }
                  >
                    <span
                      className={cn(
                        'th-inner',
                        column.align === 'right' && 'align-right',
                        column.align === 'center' && 'align-center',
                      )}
                    >
                      {column.header}
                      {sortable && (
                        <span className="sort-icon">
                          {sorted ? (
                            table.sort!.dir === 'asc' ? (
                              <ChevronUp size={13} />
                            ) : (
                              <ChevronDown size={13} />
                            )
                          ) : (
                            <ChevronsUpDown size={13} />
                          )}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          {loading ? (
            <tbody>
              {Array.from({ length: Math.min(table.pageSize, 8) }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="td-sn">
                    <div className="skeleton" style={{ height: 15, width: 22 }} />
                  </td>
                  {columns.map((column) => (
                    <td key={column.key}>
                      <div className="skeleton" style={{ height: 15, width: '72%' }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ) : table.pageRows.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={columns.length + 1}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {table.pageRows.map((row, rowIndex) => (
                <tr
                  key={getRowId(row)}
                  className={cn(onRowClick && 'row-clickable')}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  <td className="td-sn">
                    {(table.page - 1) * table.pageSize + rowIndex + 1}
                  </td>
                  {columns.map((column) => (
                    <td key={column.key} style={{ textAlign: column.align ?? 'left' }}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {table.total > 0 && (
        <div className="pagination">
          <span>
            Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{table.total}</strong>
          </span>
          <div className="pagination-controls">
            <label className="rows-per-page">
              Rows per page
              <select
                className="rows-select"
                value={table.pageSize}
                onChange={(event) => table.setPageSize(Number(event.target.value))}
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <Pagination page={table.page} pageCount={table.pageCount} onChange={table.setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
