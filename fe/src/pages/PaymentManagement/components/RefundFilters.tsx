import React, { useState } from 'react';
import ComponentCard from "../../../components/common/ComponentCard";
import {
  REFUND_STATUS_OPTIONS,
  REFUND_REASON_OPTIONS,
  REFUND_METHOD_OPTIONS,
  RefundFilterParams,
} from '../../../services/refundService';

interface RefundFiltersProps {
  filters: RefundFilterParams;
  onFilterChange: (key: keyof RefundFilterParams, value: any) => void;
  onDateRangeChange: (from: string, to: string) => void;
  onResetFilters: () => void;
}

// Icons
const SearchIcon = () => (
  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const RefundFilters: React.FC<RefundFiltersProps> = ({
  filters,
  onFilterChange,
  onDateRangeChange,
  onResetFilters,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const selectedStatuses = filters.status ? filters.status.split(',') : [];
  const selectedMethods = filters.refundMethod ? filters.refundMethod.split(',') : [];
  const selectedReasons = filters.refundReasonType ? filters.refundReasonType.split(',') : [];

  const handleStatusToggle = (status: string) => {
    const current = selectedStatuses;
    let updated: string[];
    if (current.includes(status)) {
      updated = current.filter(s => s !== status);
    } else {
      updated = [...current, status];
    }
    onFilterChange('status', updated.length > 0 ? updated.join(',') : undefined);
  };

  const handleMethodToggle = (method: string) => {
    const current = selectedMethods;
    let updated: string[];
    if (current.includes(method)) {
      updated = current.filter(m => m !== method);
    } else {
      updated = [...current, method];
    }
    onFilterChange('refundMethod', updated.length > 0 ? updated.join(',') : undefined);
  };

  const handleReasonToggle = (reason: string) => {
    const current = selectedReasons;
    let updated: string[];
    if (current.includes(reason)) {
      updated = current.filter(r => r !== reason);
    } else {
      updated = [...current, reason];
    }
    onFilterChange('refundReasonType', updated.length > 0 ? updated.join(',') : undefined);
  };

  return (
    <ComponentCard title="Filters &amp; Search">
      <div className="space-y-4">
        {/* Search Bar Row */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search by Refund Code, Payment Code, Patient Name..."
              value={filters.searchTerm || ''}
              onChange={(e) => onFilterChange('searchTerm', e.target.value || undefined)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent pl-10 pr-4 text-sm focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <FilterIcon />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          <button
            onClick={onResetFilters}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <RefreshIcon />
            Reset
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Date From */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Date From
              </label>
              <input
                type="date"
                value={filters.from || ''}
                onChange={(e) => onDateRangeChange(e.target.value, filters.to || '')}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Date To
              </label>
              <input
                type="date"
                value={filters.to || ''}
                onChange={(e) => onDateRangeChange(filters.from || '', e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Min Amount */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Min Amount
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.minAmount ?? ''}
                onChange={(e) => onFilterChange('minAmount', e.target.value ? Number(e.target.value) : undefined)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Max Amount */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Max Amount
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.maxAmount ?? ''}
                onChange={(e) => onFilterChange('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Status
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {REFUND_STATUS_OPTIONS.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(value)}
                      onChange={() => handleStatusToggle(value)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700 shadow-sm dark:bg-gray-700 dark:text-gray-300">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Refund Method Filter */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Refund Method
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {REFUND_METHOD_OPTIONS.map(({ value, label, icon }) => (
                  <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMethods.includes(value)}
                      onChange={() => handleMethodToggle(value)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700 shadow-sm dark:bg-gray-700 dark:text-gray-300">
                      {icon} {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Refund Reason Filter */}
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Reason
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {REFUND_REASON_OPTIONS.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedReasons.includes(value)}
                      onChange={() => handleReasonToggle(value)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700 shadow-sm dark:bg-gray-700 dark:text-gray-300">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ComponentCard>
  );
};

export default RefundFilters;
