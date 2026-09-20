import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../shared/format';

function pageList(page: number, count: number): Array<number | 'gap'> {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const pages: Array<number | 'gap'> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(count - 1, page + 1);
  if (start > 2) pages.push('gap');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < count - 1) pages.push('gap');
  pages.push(count);
  return pages;
}

export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="pagination-pages">
      <button
        className="page-btn"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={15} />
      </button>
      {pageList(page, pageCount).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="page-gap">
            …
          </span>
        ) : (
          <button
            key={item}
            className={cn('page-btn', item === page && 'active')}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ),
      )}
      <button
        className="page-btn"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}
