import type { CategorySlice } from '../../../domain/entities/analytics';
import { formatNumber } from '../../../shared/format';

export const DONUT_COLORS = ['#4f705e', '#7fa18c', '#b7c9a0', '#dfc98b', '#c39b74', '#8a9f77'];

/** SVG donut chart with an auto-generated legend. */
export function DonutChart({
  data,
  size = 172,
  thickness = 25,
  centerLabel = 'Total',
}: {
  data: CategorySlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;

  return (
    <div className="donut-wrap">
      <div className="donut" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#efebdb"
            strokeWidth={thickness}
          />
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {data.map((slice, i) => {
              const fraction = slice.value / total;
              const dash = Math.max(0, fraction * circumference - 3);
              const offset = -accumulated * circumference;
              accumulated += fraction;
              return (
                <circle
                  key={slice.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                  strokeWidth={thickness}
                  strokeDasharray={`${dash} ${circumference}`}
                  strokeDashoffset={offset}
                />
              );
            })}
          </g>
        </svg>
        <div className="donut-center">
          <strong>{formatNumber(total)}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>

      <div className="legend">
        {data.map((slice, i) => (
          <div key={slice.label} className="legend-row">
            <span
              className="legend-dot"
              style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="legend-label">{slice.label}</span>
            <span className="legend-pct">{Math.round((slice.value / total) * 100)}%</span>
            <span className="legend-value">{formatNumber(slice.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
