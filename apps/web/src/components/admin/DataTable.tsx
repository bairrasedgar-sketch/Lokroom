/**
 * Tableau de données réutilisable pour l'admin
 * Style Airbnb avec pagination et tri
 */
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
  onPageChange?: (page: number) => void;
  onSort?: (key: string, order: "asc" | "desc") => void;
  sortKey?: string;
  sortOrder?: "asc" | "desc";
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  emptyMessage?: string;
  rowKey?: keyof T | ((item: T) => string);
  onRowClick?: (item: T) => void;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading,
  pagination,
  onPageChange,
  onSort,
  sortKey,
  sortOrder,
  searchPlaceholder = "Rechercher...",
  onSearch,
  emptyMessage = "Aucun résultat",
  rowKey = "id" as keyof T,
  onRowClick,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleSort = (key: string) => {
    if (!onSort) return;
    const newOrder = sortKey === key && sortOrder === "asc" ? "desc" : "asc";
    onSort(key, newOrder);
  };

  const getRowKey = (item: T, index: number): string => {
    if (typeof rowKey === "function") {
      return rowKey(item);
    }
    return String(item[rowKey] ?? index);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Search bar */}
      {onSearch && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider",
                    col.sortable && "cursor-pointer hover:bg-gray-100",
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortOrder === "asc" ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center"
                >
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-red-500 mx-auto" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={getRowKey(item, index)}
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-6 py-4 text-sm", col.className)}
                    >
                      {col.render
                        ? col.render(item)
                        : String(item[col.key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pageCount > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {((pagination.page - 1) * pagination.pageSize + 1).toLocaleString()}-
            {Math.min(
              pagination.page * pagination.pageSize,
              pagination.total
            ).toLocaleString()}{" "}
            sur {pagination.total.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronDoubleLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="px-4 py-2 text-sm font-medium">
              {pagination.page} / {pagination.pageCount}
            </span>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page === pagination.pageCount}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange?.(pagination.pageCount)}
              disabled={pagination.page === pagination.pageCount}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronDoubleRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
