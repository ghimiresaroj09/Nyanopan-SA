import type { InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input className={`input ${className ?? ''}`} {...rest} />;
}

export function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <div className={`search-input ${className ?? ''}`}>
      <Search size={15} />
      <input className="input" {...rest} />
    </div>
  );
}
