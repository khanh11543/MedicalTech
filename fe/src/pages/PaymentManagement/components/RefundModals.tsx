import React, { useState } from 'react';
import * as refundService from '../../../services/refundService';

// ==================== Approve Refund Modal ====================
interface ApproveRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: refundService.ApproveRefundDTO) => void;
  isLoading: boolean;
  refund: refundService.RefundDTO | null;
}

export const ApproveRefundModal: React.FC<ApproveRefundModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  refund,
}) => {
  const [approvalNotes, setApprovalNotes] = useState('');

  if (!isOpen || !refund) return null;

  const handleSubmit = () => {
    onSubmit({ approvalNotes: approvalNotes || undefined, sendNotification: true });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-1 text-gray-900 dark:text-white">
          Approve Refund Request
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {refund.refundCode} — {refundService.formatCurrency(refund.refundAmount, refund.currency)}
        </p>

        {/* Refund Summary */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-4 text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Patient:</span>
            <span className="font-medium">{refund.patientName}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Amount:</span>
            <span className="font-bold text-red-600">{refundService.formatCurrency(refund.refundAmount, refund.currency)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Reason:</span>
            <span>{refundService.getRefundReasonLabel(refund.refundReasonType)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Method:</span>
            <span>{refundService.getRefundMethodIcon(refund.refundMethod)} {refundService.getRefundMethodLabel(refund.refundMethod)}</span>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-600 rounded-lg p-3 mb-4 text-sm text-amber-700 dark:text-amber-400">
          <strong>Note:</strong> Approving will move this refund to APPROVED status.
          It will then need to be processed (auto or manual) to complete.
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Approval Notes (optional)
          </label>
          <textarea
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="Add any notes for this approval..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Approving...' : '✅ Approve Refund'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== Reject Refund Modal ====================
interface RejectRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: refundService.RejectRefundDTO) => void;
  isLoading: boolean;
  refund: refundService.RefundDTO | null;
}

export const RejectRefundModal: React.FC<RejectRefundModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  refund,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const [error, setError] = useState('');

  if (!isOpen || !refund) return null;

  const handleSubmit = () => {
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }
    setError('');
    onSubmit({ rejectionReason, sendNotification });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-1 text-gray-900 dark:text-white">
          Reject Refund Request
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {refund.refundCode} — {refundService.formatCurrency(refund.refundAmount, refund.currency)}
        </p>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-lg p-3 mb-4 text-sm text-red-700 dark:text-red-400">
          <strong>Warning:</strong> Rejecting this refund is permanent. The status will become REJECTED (read-only).
          The patient may be notified if the option below is checked.
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rejection Reason *
            </label>
            <select
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                setError('');
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white ${
                error ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <option value="">Select reason...</option>
              <option value="OUTSIDE_REFUND_POLICY">Outside refund policy window</option>
              <option value="INVALID_REQUEST">Invalid refund request</option>
              <option value="SERVICE_ALREADY_PROVIDED">Service already provided</option>
              <option value="INSUFFICIENT_EVIDENCE">Insufficient evidence</option>
              <option value="DUPLICATE_REQUEST">Duplicate refund request</option>
              <option value="OTHER">Other</option>
            </select>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          {rejectionReason === 'OTHER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Reason *
              </label>
              <textarea
                value={rejectionReason === 'OTHER' ? '' : rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Describe why this refund is rejected..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sendNotification"
              checked={sendNotification}
              onChange={(e) => setSendNotification(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-red-600"
            />
            <label htmlFor="sendNotification" className="text-sm text-gray-700 dark:text-gray-300">
              Notify patient about rejection
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Rejecting...' : '🚫 Reject Refund'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== Process Refund Modal ====================
interface ProcessRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: refundService.ProcessRefundDTO) => void;
  isLoading: boolean;
  refund: refundService.RefundDTO | null;
}

export const ProcessRefundModal: React.FC<ProcessRefundModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  refund,
}) => {
  const [processType, setProcessType] = useState<'auto' | 'manual'>('auto');
  const [manualMethod, setManualMethod] = useState<string>('CASH');
  const [transactionReference, setTransactionReference] = useState('');
  const [processingNotes, setProcessingNotes] = useState('');
  const [confirmCashHandover, setConfirmCashHandover] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen || !refund) return null;

  const isManualMethod = manualMethod === 'CASH' || processType === 'manual';

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (processType === 'manual') {
      if (!transactionReference.trim()) {
        newErrors.transactionReference = 'Reference/receipt number is required for manual refund';
      }
      if (!processingNotes.trim()) {
        newErrors.processingNotes = 'Notes are required for manual refund';
      }
      if (manualMethod === 'CASH' && !confirmCashHandover) {
        newErrors.confirmCashHandover = 'Please confirm cash has been handed to the patient';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (processType === 'manual') {
      onSubmit({
        refundMethod: manualMethod,
        refundType: 'MANUAL',
        transactionReference,
        processingNotes,
        cashierConfirmed: manualMethod === 'CASH' ? confirmCashHandover : undefined,
        sendNotification: true,
      });
    } else {
      onSubmit({
        refundType: 'AUTO',
        sendNotification: true,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium mb-1 text-gray-900 dark:text-white">
          Process Refund
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {refund.refundCode} — {refundService.formatCurrency(refund.refundAmount, refund.currency)} to {refund.patientName}
        </p>

        {/* Current Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4 text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Refund Method:</span>
            <span>{refundService.getRefundMethodIcon(refund.refundMethod)} {refundService.getRefundMethodLabel(refund.refundMethod)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Reason:</span>
            <span>{refundService.getRefundReasonLabel(refund.refundReasonType)}</span>
          </div>
        </div>

        <div className="space-y-4">
            {/* Process Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Processing Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setProcessType('auto')}
                  className={`p-3 rounded-lg border-2 text-left ${
                    processType === 'auto'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium">⚡ Auto Refund</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Process via payment gateway. System handles completion.
                  </div>
                </button>
                <button
                  onClick={() => setProcessType('manual')}
                  className={`p-3 rounded-lg border-2 text-left ${
                    processType === 'manual'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium">🖐 Manual Refund</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Cash at counter, bank transfer, or manual MoMo.
                  </div>
                </button>
              </div>
            </div>
          </div>

        {/* Manual refund fields */}
        {processType === 'manual' && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Refund Method
              </label>
              <select
                value={manualMethod}
                onChange={(e) => setManualMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="CASH">💵 Cash</option>
                <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                <option value="MOMO">📱 MoMo (manual)</option>
                <option value="VNPAY">💳 VNPay</option>
                <option value="ZALOPAY">📲 ZaloPay</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reference / Receipt No. *
              </label>
              <input
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder={isManualMethod ? "Cash receipt number..." : "Bank transfer reference..."}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.transactionReference ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.transactionReference && (
                <p className="text-xs text-red-500 mt-1">{errors.transactionReference}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes *
              </label>
              <textarea
                value={processingNotes}
                onChange={(e) => setProcessingNotes(e.target.value)}
                placeholder="Describe the manual refund process..."
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.processingNotes ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.processingNotes && (
                <p className="text-xs text-red-500 mt-1">{errors.processingNotes}</p>
              )}
            </div>

            {/* Cash-specific confirmation */}
            {(manualMethod === 'CASH' || refund.refundMethod === 'CASH') && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-600 rounded-lg p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmCashHandover}
                    onChange={(e) => setConfirmCashHandover(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-amber-600"
                  />
                  <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                    I confirm that the cash amount of {refundService.formatCurrency(refund.refundAmount, refund.currency)} has been handed to the patient
                  </span>
                </label>
                {errors.confirmCashHandover && (
                  <p className="text-xs text-red-500 mt-1">{errors.confirmCashHandover}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Auto processing info */}
        {processType === 'auto' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600 rounded-lg p-3 mt-4 text-sm text-blue-700 dark:text-blue-400">
            <strong>Auto Refund:</strong> The system will send a refund request to the payment gateway.
            Status will change to PROCESSING. If it fails, you can retry or switch to manual refund.
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading
              ? 'Processing...'
              : processType === 'auto'
                  ? '⚡ Start Auto Refund'
                  : '🖐 Process Manual Refund'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== Retry Refund Modal ====================
interface RetryRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: refundService.RetryRefundDTO) => void;
  isLoading: boolean;
  refund: refundService.RefundDTO | null;
}

export const RetryRefundModal: React.FC<RetryRefundModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  refund,
}) => {
  const [retryMethod, setRetryMethod] = useState<'SAME' | 'MANUAL'>('SAME');
  const [notes, setNotes] = useState('');

  if (!isOpen || !refund) return null;

  const handleSubmit = () => {
    if (retryMethod === 'MANUAL') {
      onSubmit({
        refundType: 'MANUAL',
        notes: notes || undefined,
        sendNotification: true,
      });
    } else {
      onSubmit({
        notes: notes || undefined,
        sendNotification: true,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-1 text-gray-900 dark:text-white">
          Retry Failed Refund
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {refund.refundCode} — {refundService.formatCurrency(refund.refundAmount, refund.currency)}
        </p>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 mb-4 text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Previous Attempts:</span>
            <span className="font-medium text-red-600">{refund.retryCount} failed</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Original Method:</span>
            <span>{refundService.getRefundMethodIcon(refund.refundMethod)} {refundService.getRefundMethodLabel(refund.refundMethod)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Retry Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setRetryMethod('SAME')}
                className={`p-3 rounded-lg border-2 text-left ${
                  retryMethod === 'SAME'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="text-sm font-medium">🔄 Same Method</div>
                <div className="text-xs text-gray-500 mt-1">Retry via gateway</div>
              </button>
              <button
                onClick={() => setRetryMethod('MANUAL')}
                className={`p-3 rounded-lg border-2 text-left ${
                  retryMethod === 'MANUAL'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="text-sm font-medium">🖐 Switch to Manual</div>
                <div className="text-xs text-gray-500 mt-1">Process manually</div>
              </button>
            </div>
          </div>

          {retryMethod === 'MANUAL' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe the retry reason..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 disabled:opacity-50"
          >
            {isLoading ? 'Retrying...' : '🔄 Retry Refund'}
          </button>
        </div>
      </div>
    </div>
  );
};
