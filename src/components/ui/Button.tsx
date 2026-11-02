import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-[#15100b] border-accent hover:bg-accent-hi hover:border-accent-hi font-semibold',
  secondary:
    'bg-surface-2 text-ink border-line-strong hover:border-ink-3 hover:bg-surface',
  ghost: 'bg-transparent text-ink-2 border-transparent hover:text-ink hover:bg-surface-2',
  danger: 'bg-transparent text-danger border-danger/50 hover:bg-danger/10 hover:border-danger',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-[15px] gap-2',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center rounded-[var(--radius-sm)] border',
        'font-sans transition-colors duration-[120ms] ease-[var(--ease-out)]',
        'disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-px',
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
