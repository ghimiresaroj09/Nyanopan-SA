import { initials } from '../../../shared/format';

const PALETTE = [
  { bg: '#dfe8d8', fg: '#40604c' },
  { bg: '#eae0bd', fg: '#6d5d28' },
  { bg: '#d9e3e7', fg: '#3f5f6d' },
  { bg: '#e8dbcd', fg: '#77502f' },
  { bg: '#e0e5ce', fg: '#55603a' },
];

export function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const color = PALETTE[hash % PALETTE.length];

  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        background: color.bg,
        color: color.fg,
        fontSize: size * 0.36,
      }}
    >
      {initials(name)}
    </span>
  );
}
