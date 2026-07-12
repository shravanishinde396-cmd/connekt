import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className,
}) => {
  return (
    <nav className={cn("flex items-center gap-1.5 text-xs text-zinc-500 font-semibold uppercase tracking-wider", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />}
            {isLast || !item.href ? (
              <span className={cn("text-zinc-400 font-bold", isLast && "text-purple-400")}>
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="hover:text-zinc-200 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
