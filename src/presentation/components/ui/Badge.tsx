import type { ReactNode } from 'react';
import { cn } from '../../../shared/format';
import type { CatalogStatus } from '../../../domain/entities/catalog';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'sage';

export function Badge({
  tone = 'neutral',
  dot = true,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span className={cn('badge', `tone-${tone}`)}>
      {dot && <span className="dot" aria-hidden />}
      {children}
    </span>
  );
}

export function CatalogStatusBadge({ status }: { status: CatalogStatus }) {
  return (
    <Badge tone={status === 'active' ? 'success' : 'neutral'}>
      {status === 'active' ? 'Active' : 'Inactive'}
    </Badge>
  );
}
