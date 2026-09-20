import { useEffect, useRef, useState, type MouseEvent } from 'react';
import type { SeriesPoint } from '../../../domain/entities/analytics';

const PAD_LEFT = 14;
const PAD_RIGHT = 14;
const PAD_TOP = 18;
const PAD_BOTTOM = 28;

/** Responsive SVG bar chart with hover tooltip. */
export function BarChart({
  data,
  height = 230,
  formatValue = (n) => String(Math.round(n)),
}: {
  data: SeriesPoint[];
  height?: number;
  formatValue?: (n: number) => string;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (data.length === 0 || width === 0) {
    return <div ref={wrapRef} className="chart-shell" style={{ height }} />;
  }

  const innerW = Math.max(10, width - PAD_LEFT - PAD_RIGHT);
  const innerH = height - PAD_TOP - PAD_BOTTOM;
  const max = Math.max(...data.map((d) => d.value)) * 1.15 || 1;
  const slot = innerW / data.length;
  const barWidth = Math.min(40, slot * 0.55);

  const handleMove = (event: MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left - PAD_LEFT;
    const index = Math.floor(px / slot);
    setHover(index >= 0 && index < data.length ? index : null);
  };

  return (
    <div ref={wrapRef} className="chart-shell" style={{ height }}>
      <svg width={width} height={height} onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => {
          const barH = (d.value / max) * innerH;
          const bx = PAD_LEFT + slot * i + (slot - barWidth) / 2;
          const by = PAD_TOP + innerH - barH;
          return (
            <g key={d.label}>
              <rect
                x={bx}
                y={by}
                width={barWidth}
                height={Math.max(2, barH)}
                rx={7}
                fill={hover === i ? '#4e6d5c' : '#6f8f7e'}
                style={{ transition: 'fill 0.12s ease' }}
              />
              <text
                x={bx + barWidth / 2}
                y={height - 8}
                textAnchor="middle"
                className="chart-tick"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hover !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: PAD_LEFT + slot * hover + slot / 2,
            top:
              PAD_TOP + innerH - (data[hover].value / max) * innerH,
          }}
        >
          <span className="chart-tooltip-label">{data[hover].label}</span>
          <strong>{formatValue(data[hover].value)}</strong>
        </div>
      )}
    </div>
  );
}
