import { cn } from '@/lib/utils';
import * as React from 'react';

type Variant = 'default' | 'secondary' | 'success' | 'danger' | 'warning';

const variants: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-muted text-muted-foreground',
  success: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
};

export function Badge({
  className,
  variant = 'default',
  ...p
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...p}
    />
  );
}
