import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn.js';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', loading = false, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
          // Variants
          variant === 'default' && "bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]",
          variant === 'outline' && "bg-transparent border border-border text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900/50 hover:border-zinc-700",
          variant === 'ghost' && "bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50",
          variant === 'secondary' && "bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:scale-[1.01] active:scale-[0.99] border border-border/40",
          variant === 'destructive' && "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20 hover:scale-[1.01] active:scale-[0.99]",
          variant === 'link' && "bg-transparent hover:underline text-primary p-0 underline-offset-4 hover:bg-transparent",
          // Sizes
          size === 'sm' && "h-9 px-3 py-1.5 text-xs rounded-lg",
          size === 'md' && "h-11 px-5 py-2.5",
          size === 'lg' && "h-13 px-8 py-3 rounded-2xl text-base",
          size === 'icon' && "h-11 w-11 p-0",
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
