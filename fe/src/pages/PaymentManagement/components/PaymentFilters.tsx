import React, { useState } from 'react';
import ComponentCard from "../../../components/common/ComponentCard";

interface Filters {
  search: string;
  status: string[];
  method: string[];
  doctorId: number | null;
  patientId: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  from: string | null;
  to: string | null;
}

interface PaymentFiltersProps {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: any) => void;
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

const STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'INITIATED', label: 'Initiated' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'EXPIRED', label: 'Expired' },
];

const METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'MOMO', label: 'MoMo' },
];

const PaymentFilters: React.FC<PaymentFiltersProps> = ({
  filters,
  onFilterChange,
  onDateRangeChange,
  onResetFilters,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleStatusToggle = (status: string) => {
    const current = filters.status;
    if (current.includes(status)) {
      onFilterChange('status', current.filter(s => s !== status));
    } else {
      onFilterChange('status', [...current, status]);
    }
  };

  const handleMethodToggle = (method: string) => {
    const current = filters.method;
    if (current.includes(method)) {
      onFilterChange('method', current.filter(m => m !== method));
    } else {
      onFilterChange('method', [...current, method]);
    }
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
              placeholder="Search by Appointment Code, Patient Name/Email, Doctor Name..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
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
                onChange={(e) => onFilterChange('minAmount', e.target.value ? Number(e.target.value) : null)}
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
                onChange={(e) => onFilterChange('maxAmount', e.target.value ? Number(e.target.value) : null)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Status
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {STATUSES.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(value)}
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

            {/* Payment Method Filter */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Payment Method
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {METHODS.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.method.includes(value)}
                      onChange={() => handleMethodToggle(value)}
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

export default PaymentFilters;