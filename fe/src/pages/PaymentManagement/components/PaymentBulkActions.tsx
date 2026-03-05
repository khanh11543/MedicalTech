import React, { useState } from 'react';
import ComponentCard from "../../../components/common/ComponentCard";

interface PaymentBulkActionsProps {
  selectedIds: number[];
  onBulkAction: (action: string, ids: number[]) => void;
  isLoading: boolean;
}

const PaymentBulkActions: React.FC<PaymentBulkActionsProps> = ({
  selectedIds,
  onBulkAction,
  isLoading,
}) => {
  const [selectedAction, setSelectedAction] = useState('');

  const handleBulkAction = () => {
    if (selectedAction && selectedIds.length > 0) {
      onBulkAction(selectedAction, selectedIds);
      setSelectedAction('');
    }
  };

  const actions = [
    { value: 'mark_completed', label: 'Mark as Completed', icon: '' },
    { value: 'mark_failed', label: 'Mark as Failed', icon: '' },
    { value: 'cancel', label: 'Cancel Payments', icon: '' },
    { value: 'send_receipts', label: 'Send Receipts', icon: '' },
  ];

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <ComponentCard title={`Bulk Actions (${selectedIds.length} selected)`}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Action:
          </label>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select action...</option>
            {actions.map((action) => (
              <option key={action.value} value={action.value}>
                {action.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleBulkAction}
          disabled={!selectedAction || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Apply Action'}
        </button>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Selected IDs: {selectedIds.join(', ')}
        </div>
      </div>
    </ComponentCard>
  );
};

export default PaymentBulkActions;