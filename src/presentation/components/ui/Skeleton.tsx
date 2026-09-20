import type { CSSProperties } from 'react';

export function Skeleton({ style, className }: { style?: CSSProperties; className?: string }) {
  return <div className={`skeleton ${className ?? ''}`} style={style} aria-hidden />;
}
