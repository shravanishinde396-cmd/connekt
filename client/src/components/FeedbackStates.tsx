import React from 'react';
import { Inbox, AlertTriangle, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Available',
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 py-16 bg-zinc-900/20 border border-zinc-800/80 rounded-2xl border-dashed">
      <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-zinc-500 mb-4">
        {icon || <Inbox className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-semibold text-zinc-200">{title}</h3>
      <p className="text-zinc-500 text-sm max-w-sm mt-1 mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2 text-sm bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-zinc-100 font-medium rounded-xl transition-colors focus:outline-none"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something Went Wrong',
  message,
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 py-12 bg-red-950/10 border border-red-500/20 rounded-2xl">
      <div className="p-3.5 bg-red-950/40 border border-red-500/30 rounded-2xl text-red-400 mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-red-200">{title}</h3>
      <p className="text-red-300/70 text-sm max-w-sm mt-1 mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-red-900/30 hover:bg-red-900/50 text-red-200 border border-red-800/40 font-medium rounded-xl transition-all focus:outline-none"
        >
          <RefreshCw className="w-4 h-4 animate-spin-hover" />
          Try Again
        </button>
      )}
    </div>
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="w-full bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-9 bg-zinc-800 rounded-xl w-48"></div>
        <div className="h-9 bg-zinc-800 rounded-xl w-32"></div>
      </div>
      <div className="space-y-4">
        <div className="h-5 bg-zinc-850 rounded w-full"></div>
        <hr className="border-zinc-800" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="h-4 bg-zinc-850 rounded w-1/4"></div>
            <div className="h-4 bg-zinc-850 rounded w-1/4"></div>
            <div className="h-4 bg-zinc-850 rounded w-1/4"></div>
            <div className="h-4 bg-zinc-850 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl animate-pulse">
          <div className="h-4 bg-zinc-800 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-zinc-800 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
};
