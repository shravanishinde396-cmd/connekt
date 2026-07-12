import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../utils/cn.js';
import { Button } from './Button.js';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description,
  actionLabel,
  onAction,
  icon,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 py-16 bg-zinc-900/15 border border-zinc-800/80 border-dashed rounded-3xl backdrop-blur-sm",
        className
      )}
      {...props}
    >
      <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-2xl text-zinc-500 mb-4 shadow-md group-hover:scale-105 transition-transform duration-300">
        {icon || <Inbox className="w-8 h-8 text-zinc-400" />}
      </div>
      <h3 className="text-lg font-bold text-zinc-200 tracking-tight">{title}</h3>
      <p className="text-zinc-500 text-xs max-w-xs mt-1 mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="default" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
