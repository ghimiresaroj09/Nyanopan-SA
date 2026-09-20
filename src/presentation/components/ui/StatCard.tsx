import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn, formatMetric } from '../../../shared/format';

export function DeltaPill({ delta }: { delta: number }) {
  const up = delta >= 0;
  return (
    <span className={cn('delta-pill', up ? 'delta-up' : 'delta-down')}>
      {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

export function StatCard({
  label,
  value,
  format,
  delta,
  footnote,
  icon,
}: {
  label: string;
  value: number;
  format: 'currency' | 'number';
  delta?: number;
  footnote?: string;
  icon: ReactNode;
}) {
  return (
    <div className="card stat-card">
      <div className="stat-top">
        <span className="stat-icon">{icon}</span>
        {typeof delta === 'number' && <DeltaPill delta={delta} />}
      </div>
      <div className="stat-value">{formatMetric(format, value)}</div>
      <div className="stat-meta">
        <span className="stat-label">{label}</span>
        {footnote && <span className="stat-note">{footnote}</span>}
      </div>
    </div>
  );
}
