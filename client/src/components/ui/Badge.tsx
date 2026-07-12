import React from 'react';
import { cn } from '../../utils/cn.js';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  ...props
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider select-none",
        // Variants
        variant === 'default' && "bg-primary/10 border-primary/20 text-primary",
        variant === 'secondary' && "bg-secondary text-secondary-foreground border-border/40",
        variant === 'outline' && "bg-transparent border-zinc-800 text-zinc-400",
        variant === 'success' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        variant === 'warning' && "bg-amber-500/10 border-amber-500/20 text-amber-400",
        variant === 'destructive' && "bg-destructive/10 border-destructive/20 text-destructive",
        variant === 'info' && "bg-blue-500/10 border-blue-500/20 text-blue-400",
        className
      )}
      {...props}
    />
  );
};
