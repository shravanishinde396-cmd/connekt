import React from 'react';
import { cn } from '../../utils/cn.js';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'card' | 'avatar' | 'table-row' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  ...props
}) => {
  return (
    <div
      className={cn(
        "animate-pulse bg-zinc-800/60 rounded-xl",
        variant === 'text' && "h-4 w-full rounded",
        variant === 'avatar' && "h-11 w-11 rounded-full",
        variant === 'card' && "h-32 w-full rounded-3xl border border-zinc-850 p-6",
        variant === 'table-row' && "h-12 w-full flex items-center justify-between border-b border-zinc-850",
        className
      )}
      {...props}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 md:p-8 animate-pulse backdrop-blur-md">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-5 w-full" />
        <hr className="border-zinc-850" />
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex gap-4 items-center">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );
};
