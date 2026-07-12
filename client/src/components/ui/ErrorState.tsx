import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn.js';
import { Button } from './Button.js';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'An error occurred',
  message,
  onRetry,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 py-12 bg-red-950/5 border border-red-500/10 rounded-3xl backdrop-blur-sm",
        className
      )}
      {...props}
    >
      <div className="p-3.5 bg-red-950/20 border border-red-500/20 rounded-2xl text-red-400 mb-4 shadow-lg shadow-red-950/20">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-red-200 tracking-tight">{title}</h3>
      <p className="text-red-400/60 text-xs max-w-xs mt-1 mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="border-red-900/30 text-red-300 hover:bg-red-950/20 hover:text-red-200"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Try again
        </Button>
      )}
    </div>
  );
};
