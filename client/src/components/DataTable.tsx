import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search, Eye } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchKey?: keyof T;
  searchPlaceholder?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchKey,
  searchPlaceholder = 'Search...',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => columns.map((c) => c.key));
  const [showColDropdown, setShowColDropdown] = useState(false);

  // Handle search
  const filteredData = useMemo(() => {
    if (!searchQuery || !searchKey) return data;
    return data.filter((item) => {
      const val = item[searchKey];
      if (val === undefined || val === null) return false;
      return String(val).toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [data, searchQuery, searchKey]);

  // Handle sort
  const sortedData = useMemo(() => {
    const sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // Handle pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Adjust page number if out of bounds
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="w-full bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-md">
      {/* Table controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-5 border-b border-zinc-850">
        {searchKey ? (
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500/80 text-zinc-100 placeholder-zinc-500 transition-colors"
            />
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3 relative w-full sm:w-auto justify-end">
          {/* Column selector */}
          <button
            onClick={() => setShowColDropdown(!showColDropdown)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:text-zinc-100 transition-colors focus:outline-none"
          >
            <Eye className="w-4 h-4" />
            Columns
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {showColDropdown && (
            <div className="absolute right-0 top-12 z-20 w-48 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2">
              <div className="text-xs font-semibold text-zinc-500 px-3 py-1.5 uppercase tracking-wider">Show/Hide</div>
              {columns.map((c) => (
                <label
                  key={c.key}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-900 text-sm text-zinc-300 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(c.key)}
                    onChange={() => toggleColumn(c.key)}
                    className="rounded border-zinc-800 text-purple-600 focus:ring-0 focus:ring-offset-0 bg-zinc-900"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-950/40 border-b border-zinc-850">
              {columns
                .filter((c) => visibleColumns.includes(c.key))
                .map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && requestSort(col.key)}
                    className={`px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider select-none ${
                      col.sortable ? 'cursor-pointer hover:text-zinc-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && sortConfig?.key === col.key ? (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )
                      ) : col.sortable ? (
                        <span className="opacity-0 hover:opacity-100 transition-opacity">
                          <ChevronUp className="w-3.5 h-3.5 text-zinc-600" />
                        </span>
                      ) : null}
                    </div>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850 bg-transparent">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, rowIndex) => (
                <tr
                  key={item.id || item._id || rowIndex}
                  className="hover:bg-zinc-900/30 transition-colors group"
                >
                  {columns
                    .filter((c) => visibleColumns.includes(c.key))
                    .map((col) => {
                      const value = item[col.key];
                      return (
                        <td key={col.key} className="px-6 py-4 text-sm text-zinc-300">
                          {col.render ? col.render(value, item) : String(value ?? '')}
                        </td>
                      );
                    })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-zinc-500 text-sm">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination panel */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-5 border-t border-zinc-850 text-sm text-zinc-400">
        <div className="flex items-center gap-2">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-zinc-950/60 border border-zinc-850 rounded-lg px-2.5 py-1 text-zinc-300 focus:outline-none focus:border-purple-500/80"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>entries</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-zinc-500 text-xs">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 disabled:opacity-40 disabled:hover:bg-zinc-950/40 transition-colors focus:outline-none text-zinc-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-zinc-200">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 disabled:opacity-40 disabled:hover:bg-zinc-950/40 transition-colors focus:outline-none text-zinc-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
