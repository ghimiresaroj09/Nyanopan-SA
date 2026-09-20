import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../shared/format';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }: ButtonProps) {
  return (
    <button className={cn('btn', `btn-${variant}`, size === 'sm' && 'btn-sm', className)} {...rest}>
      {children}
    </button>
  );
}
