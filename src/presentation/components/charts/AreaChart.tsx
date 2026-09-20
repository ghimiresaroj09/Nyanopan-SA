import { useEffect, useRef, useState, type MouseEvent } from 'react';
import type { SeriesPoint } from '../../../domain/entities/analytics';

const PAD_LEFT = 48;
const PAD_RIGHT = 14;
const PAD_TOP = 14;
const PAD_BOTTOM = 28;

interface Point {
  x: number;
  y: number;
}

function smoothPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

/** Responsive SVG area chart with grid lines and hover tooltip. */
export function AreaChart({
  data,
  height = 280,
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
  const max = Math.max(...data.map((d) => d.value)) * 1.1 || 1;
  const x = (i: number) => PAD_LEFT + (i * innerW) / Math.max(1, data.length - 1);
  const y = (v: number) => PAD_TOP + (1 - v / max) * innerH;
  const points = data.map((d, i) => ({ x: x(i), y: y(d.value) }));
  const linePath = smoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${
    PAD_TOP + innerH
  } L ${points[0].x.toFixed(1)} ${PAD_TOP + innerH} Z`;
  const labelStep = Math.max(1, Math.ceil(data.length / 8));

  const handleMove = (event: MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const index = Math.round(((px - PAD_LEFT) / innerW) * (data.length - 1));
    setHover(Math.min(data.length - 1, Math.max(0, index)));
  };

  return (
    <div ref={wrapRef} className="chart-shell" style={{ height }}>
      <svg width={width} height={height} onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="nyanopan-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5c7d6c" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#5c7d6c" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((f) => {
          const gy = PAD_TOP + (1 - f) * innerH;
          return (
            <g key={f}>
              <line
                x1={PAD_LEFT}
                x2={width - PAD_RIGHT}
                y1={gy}
                y2={gy}
                stroke="#e5e0cb"
                strokeDasharray="3 5"
              />
              <text x={PAD_LEFT - 8} y={gy + 3.5} textAnchor="end" className="chart-tick">
                {formatValue(max * f)}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#nyanopan-area-fill)" />
        <path d={linePath} fill="none" stroke="#5c7d6c" strokeWidth={2.4} strokeLinecap="round" />

        {data.map((d, i) =>
          i % labelStep === 0 ? (
            <text key={i} x={x(i)} y={height - 8} textAnchor="middle" className="chart-tick">
              {d.label}
            </text>
          ) : null,
        )}

        {hover !== null && (
          <g>
            <line
              x1={points[hover].x}
              x2={points[hover].x}
              y1={PAD_TOP}
              y2={PAD_TOP + innerH}
              stroke="#5c7d6c"
              strokeOpacity={0.35}
            />
            <circle
              cx={points[hover].x}
              cy={points[hover].y}
              r={4.5}
              fill="#5c7d6c"
              stroke="#fffdf4"
              strokeWidth={2}
            />
          </g>
        )}
      </svg>

      {hover !== null && (
        <div className="chart-tooltip" style={{ left: points[hover].x, top: points[hover].y }}>
          <span className="chart-tooltip-label">{data[hover].label}</span>
          <strong>{formatValue(data[hover].value)}</strong>
        </div>
      )}
    </div>
  );
}
