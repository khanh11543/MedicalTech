import React, { useState, useEffect } from 'react';
import * as refundService from '../../../services/refundService';

interface CreateRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentId: number, data: refundService.CreateRefundDTO) => void;
  isLoading: boolean;
  payment?: {
    id: number;
    transactionCode: string;
    amount: number;
    netAmount: number;
    currency: string;
    paymentMethod: string;
    patientName: string;
    patientEmail: string;
    existingRefundTotal?: number;
  };
}

const CreateRefundModal: React.FC<CreateRefundModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  payment,
}) => {
  const [form, setForm] = useState<{
    refundAmount: number;
    refundReasonType: refundService.RefundReason | '';
    refundReason: string;
    refundMethod: string;
    refundType: string;
    isPartial: boolean;
  }>({
    refundAmount: 0,
    refundReasonType: '',
    refundReason: '',
    refundMethod: 'ORIGINAL_METHOD',
    refundType: 'MANUAL',
    isPartial: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const refundableAmount = payment
    ? payment.netAmount - (payment.existingRefundTotal || 0)
    : 0;

  useEffect(() => {
    if (payment && isOpen) {
      setForm(prev => ({
        ...prev,
        refundAmount: refundableAmount,
        isPartial: false,
      }));
      setErrors({});
    }
  }, [payment, isOpen, refundableAmount]);

  if (!isOpen || !payment) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.refundReasonType) {
      newErrors.refundReasonType = 'Refund reason is required';
    }

    if (form.refundReasonType === 'OTHER' && !form.refundReason.trim()) {
      newErrors.refundReason = 'Note is required when reason is "Other"';
    }

    if (form.refundAmount <= 0) {
      newErrors.refundAmount = 'Refund amount must be greater than 0';
    }

    if (form.refundAmount > refundableAmount) {
      newErrors.refundAmount = `Cannot exceed refundable amount (${refundService.formatCurrency(refundableAmount, payment.currency)})`;
    }

    if (form.isPartial && !form.refundReason.trim()) {
      newErrors.refundReason = 'Note is required for partial refund';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit(payment.id, {
      refundAmount: form.refundAmount,
      refundReason: form.refundReason || refundService.getRefundReasonLabel(form.refundReasonType as refundService.RefundReason),
      refundReasonType: form.refundReasonType || undefined,
      refundMethod: form.refundMethod,
      refundType: form.refundType,
      notes: form.refundReason || undefined,
    });
  };

  const handlePartialToggle = (isPartial: boolean) => {
    setForm(prev => ({
      ...prev,
      isPartial,
      refundAmount: isPartial ? prev.refundAmount : refundableAmount,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium mb-1 text-gray-900 dark:text-white">
          Create Refund Request
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Payment: <span className="font-mono font-medium">{payment.transactionCode}</span> — {payment.patientName}
        </p>

        {/* Payment Summary */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4 text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-gray-500">Original Amount:</span>
            <span className="font-medium">{refundService.formatCurrency(payment.amount, payment.currency)}</span>
          </div>
          {(payment.existingRefundTotal || 0) > 0 && (
            <div className="flex justify-between mb-1 text-orange-600">
              <span>Already Refunded:</span>
              <span className="font-medium">-{refundService.formatCurrency(payment.existingRefundTotal || 0, payment.currency)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-1 mt-1">
            <span className="font-medium text-gray-700 dark:text-gray-300">Refundable:</span>
            <span className="font-bold text-green-600">{refundService.formatCurrency(refundableAmount, payment.currency)}</span>
          </div>
        </div>

        {refundableAmount <= 0 ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
            This payment has been fully refunded. No further refund is possible.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Refund Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Refund Type
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="refundType"
                    checked={!form.isPartial}
                    onChange={() => handlePartialToggle(false)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm">Full Refund ({refundService.formatCurrency(refundableAmount, payment.currency)})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="refundType"
                    checked={form.isPartial}
                    onChange={() => handlePartialToggle(true)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm">Partial Refund</span>
                </label>
              </div>
            </div>

            {/* Refund Amount (if partial) */}
            {form.isPartial && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Refund Amount *
                </label>
                <input
                  type="number"
                  value={form.refundAmount}
                  onChange={(e) => setForm(prev => ({ ...prev, refundAmount: Number(e.target.value) }))}
                  max={refundableAmount}
                  min={1}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    errors.refundAmount ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max: {refundService.formatCurrency(refundableAmount, payment.currency)}
                </p>
                {errors.refundAmount && (
                  <p className="text-xs text-red-500 mt-1">{errors.refundAmount}</p>
                )}
              </div>
            )}

            {/* Refund Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Refund Reason *
              </label>
              <select
                value={form.refundReasonType}
                onChange={(e) => setForm(prev => ({ ...prev, refundReasonType: e.target.value as refundService.RefundReason }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.refundReasonType ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Select reason...</option>
                {refundService.REFUND_REASON_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.refundReasonType && (
                <p className="text-xs text-red-500 mt-1">{errors.refundReasonType}</p>
              )}
            </div>

            {/* Reason Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Note {(form.refundReasonType === 'OTHER' || form.isPartial) ? '*' : '(optional)'}
              </label>
              <textarea
                value={form.refundReason}
                onChange={(e) => setForm(prev => ({ ...prev, refundReason: e.target.value }))}
                placeholder="Describe the reason for refund..."
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.refundReason ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.refundReason && (
                <p className="text-xs text-red-500 mt-1">{errors.refundReason}</p>
              )}
            </div>

            {/* Refund Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Refund Method
              </label>
              <select
                value={form.refundMethod}
                onChange={(e) => setForm(prev => ({ ...prev, refundMethod: e.target.value as refundService.RefundMethod }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {refundService.REFUND_METHOD_OPTIONS.map(({ value, label, icon }) => (
                  <option key={value} value={value}>{icon} {label}</option>
                ))}
              </select>
            </div>

            {/* Refund Processing Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Processing Type
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="processingType"
                    checked={form.refundType === 'MANUAL'}
                    onChange={() => setForm(prev => ({ ...prev, refundType: 'MANUAL' }))}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm">Manual</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="processingType"
                    checked={form.refundType === 'AUTO'}
                    onChange={() => setForm(prev => ({ ...prev, refundType: 'AUTO' }))}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm">Automatic</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          {refundableAmount > 0 && (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : `Create Refund (${refundService.formatCurrency(form.refundAmount, payment.currency)})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateRefundModal;
