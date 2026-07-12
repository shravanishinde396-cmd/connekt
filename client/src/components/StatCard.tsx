import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number | string;
    isPositive: boolean;
  };
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl animate-pulse">
        <div className="flex justify-between items-start">
          <div className="h-4 bg-zinc-800 rounded w-24 mb-3"></div>
          <div className="w-8 h-8 rounded-full bg-zinc-800"></div>
        </div>
        <div className="h-8 bg-zinc-800 rounded w-16 mb-2"></div>
        <div className="h-3 bg-zinc-800 rounded w-32"></div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-all duration-300 relative overflow-hidden group">
      {/* Background glow hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

      <div className="flex justify-between items-start">
        <span className="text-sm font-medium text-zinc-400">{title}</span>
        {icon && <div className="p-2 bg-zinc-800/50 rounded-xl text-purple-400 group-hover:text-purple-300 transition-colors">{icon}</div>}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-zinc-100 tracking-tight">{value}</span>
        {trend && (
          <span
            className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.isPositive
                ? 'bg-green-500/10 text-green-400'
                : 'bg-red-500/10 text-red-400'
            }`}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      {description && <p className="mt-2 text-xs text-zinc-500">{description}</p>}
    </div>
  );
};
export default StatCard;
