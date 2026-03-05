import React, { useState } from 'react';
import ComponentCard from "../../../components/common/ComponentCard";

interface PaymentExportProps {
  onExport: (format: string, filters: any) => void;
  isLoading: boolean;
  filters: any;
}

const PaymentExport: React.FC<PaymentExportProps> = ({
  onExport,
  isLoading,
  filters,
}) => {
  const [selectedFormat, setSelectedFormat] = useState('');

  const exportFormats = [
    { value: 'EXCEL', label: 'Excel (.xlsx)', icon: '' },
    { value: 'CSV', label: 'CSV (.csv)', icon: '' },
    { value: 'PDF', label: 'PDF (.pdf)', icon: '' },
    { value: 'JSON', label: 'JSON (.json)', icon: '' },
  ];

  const handleExport = () => {
    if (selectedFormat) {
      onExport(selectedFormat, filters);
      setSelectedFormat('');
    }
  };

  return (
    <ComponentCard title="Export Data">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Export Format
          </label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select format...</option>
            {exportFormats.map((format) => (
              <option key={format.value} value={format.value}>
                {format.label}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>Current filters will be applied to the exported data:</p>
          <ul className="mt-1 ml-4 list-disc">
            {filters.search && <li>Search: {filters.search}</li>}
            {filters.status.length > 0 && <li>Status: {filters.status.join(', ')}</li>}
            {filters.method.length > 0 && <li>Method: {filters.method.join(', ')}</li>}
            {filters.from && filters.to && (
              <li>Date range: {filters.from} to {filters.to}</li>
            )}
          </ul>
        </div>

        <button
          onClick={handleExport}
          disabled={!selectedFormat || isLoading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Exporting...' : `Export as ${selectedFormat}`}
        </button>
      </div>
    </ComponentCard>
  );
};

export default PaymentExport;