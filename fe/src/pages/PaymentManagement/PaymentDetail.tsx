import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import * as paymentService from '../../services/paymentService';

// Import types from service
type PaymentDetailDTO = paymentService.PaymentDetailDTO;
type PaymentHistoryDTO = paymentService.PaymentHistoryDTO;
type MarkPaidDTO = paymentService.MarkPaidDTO;
type CancelPaymentDTO = paymentService.CancelPaymentDTO;
type RetryPaymentDTO = paymentService.RetryPaymentDTO;
type SendReceiptDTO = paymentService.SendReceiptDTO;

// Local form interface for refund
interface RefundFormDTO {
  amount: number;
  reason: string;
  refundMethod: string;
  sendNotification: boolean;
}

const PaymentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  // Modals state
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [showSendReceiptModal, setShowSendReceiptModal] = useState(false);

  // Form states
  const [markPaidForm, setMarkPaidForm] = useState<MarkPaidDTO>({});
  const [refundForm, setRefundForm] = useState<RefundFormDTO>({
    amount: 0,
    reason: '',
    refundMethod: 'ORIGINAL',
    sendNotification: true,
  });
  const [cancelForm, setCancelForm] = useState<CancelPaymentDTO>({
    reason: '',
    notes: '',
  });
  const [retryForm, setRetryForm] = useState<RetryPaymentDTO>({
    sendVia: 'EMAIL',
  });
  const [sendReceiptForm, setSendReceiptForm] = useState<Partial<SendReceiptDTO>>({});

  // API calls
  const { data: paymentDetail, isLoading } = useQuery({
    queryKey: ['payment-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Payment ID is required');
      return await paymentService.getPaymentDetail(Number(id));
    },
    enabled: !!id,
  });

  const { data: paymentHistory } = useQuery({
    queryKey: ['payment-history', id],
    queryFn: async () => {
      if (!id) throw new Error('Payment ID is required');
      return await paymentService.getPaymentHistory(Number(id));
    },
    enabled: !!id && activeTab === 'history',
  });

  // Mutations
  const markAsPaidMutation = useMutation({
    mutationFn: async (data: MarkPaidDTO) => {
      if (!id) throw new Error('Payment ID is required');
      return await paymentService.markPaymentAsPaid(Number(id), data);
    },
    onSuccess: () => {
      alert('Payment marked as paid successfully');
      queryClient.invalidateQueries({ queryKey: ['payment-detail'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setShowMarkPaidModal(false);
      setMarkPaidForm({});
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to mark payment as paid');
    },
  });

  const refundMutation = useMutation({
    mutationFn: async (data: RefundFormDTO) => {
      if (!id) throw new Error('Payment ID is required');
      const refundData: paymentService.RefundDTO = {
        refundAmount: data.amount,
        refundReason: data.reason,
        notes: `Refund method: ${data.refundMethod}${data.sendNotification ? ' | Notification sent' : ''}`,
      };
      return await paymentService.refundPayment(Number(id), refundData);
    },
    onSuccess: () => {
      alert('Refund processed successfully');
      queryClient.invalidateQueries({ queryKey: ['payment-detail'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setShowRefundModal(false);
      setRefundForm({
        amount: 0,
        reason: '',
        refundMethod: 'ORIGINAL',
        sendNotification: true,
      });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to process refund');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (data: CancelPaymentDTO) => {
      if (!id) throw new Error('Payment ID is required');
      return await paymentService.cancelPayment(Number(id), data);
    },
    onSuccess: () => {
      alert('Payment cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['payment-detail'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setShowCancelModal(false);
      setCancelForm({ reason: '', notes: '' });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to cancel payment');
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (data: RetryPaymentDTO) => {
      if (!id) throw new Error('Payment ID is required');
      return await paymentService.retryPayment(Number(id), data);
    },
    onSuccess: () => {
      alert('Payment retry initiated successfully');
      queryClient.invalidateQueries({ queryKey: ['payment-detail'] });
      setShowRetryModal(false);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to retry payment');
    },
  });

  const downloadReceiptMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Payment ID is required');
      return await paymentService.downloadReceipt(Number(id));
    },
    onSuccess: (blob) => {
      const filename = `receipt_${paymentDetail?.transactionCode || id}.pdf`;
      paymentService.downloadFile(blob, filename);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to download receipt');
    },
  });

  const sendReceiptMutation = useMutation({
    mutationFn: async (data: SendReceiptDTO) => {
      if (!id) throw new Error('Payment ID is required');
      return await paymentService.sendReceipt(Number(id), data);
    },
    onSuccess: () => {
      alert('Receipt sent successfully');
      setShowSendReceiptModal(false);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to send receipt');
    },
  });

  // Handlers
  const handleMarkAsPaid = () => {
    if (!markPaidForm.paymentMethod) {
      alert('Please select payment method');
      return;
    }
    markAsPaidMutation.mutate(markPaidForm);
  };

  const handleRefund = () => {
    if (!refundForm.reason || refundForm.amount <= 0) {
      alert('Please fill in all required fields');
      return;
    }
    if (refundForm.amount > (paymentDetail?.netAmount || 0)) {
      alert('Refund amount cannot exceed payment amount');
      return;
    }
    refundMutation.mutate(refundForm);
  };

  const handleCancel = () => {
    if (!cancelForm.reason) {
      alert('Please provide a reason for cancellation');
      return;
    }
    cancelMutation.mutate(cancelForm);
  };

  const handleRetry = () => {
    retryMutation.mutate(retryForm);
  };

  const handleSendReceipt = () => {
    const email = sendReceiptForm.email || paymentDetail?.patientEmail;
    if (!email) {
      alert('No email address available');
      return;
    }
    sendReceiptMutation.mutate({ email });
  };

  // Use helper functions from service
  const getStatusColor = paymentService.getStatusColor;
  const getMethodIcon = paymentService.getPaymentMethodIcon;

  if (isLoading) {
    return (
      <>
        <PageMeta
          title="Payment Detail | MedicalTech Dashboard"
          description="View detailed payment information and manage payment actions"
        />
        <PageBreadcrumb pageTitle="Payment Detail" />
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </>
    );
  }

  if (!paymentDetail) {
    return (
      <>
        <PageMeta
          title="Payment Detail | MedicalTech Dashboard"
          description="View detailed payment information and manage payment actions"
        />
        <PageBreadcrumb pageTitle="Payment Detail" />
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">Payment not found</div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Payment Detail | MedicalTech Dashboard"
        description="View detailed payment information and manage payment actions"
      />
      <PageBreadcrumb pageTitle={`Payment Detail - ${paymentDetail.transactionCode}`} />

      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/payment-list')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Back to List
            </button>
            <Badge size="md" color={getStatusColor(paymentDetail.status) as any}>
              {paymentDetail.status}
            </Badge>
          </div>

          <div className="flex space-x-2">
            {paymentDetail.status === 'PENDING' && (
              <button
                onClick={() => setShowMarkPaidModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                Mark as Paid
              </button>
            )}

            {paymentDetail.status === 'PAID' && (
              <button
                onClick={() => {
                  setRefundForm(prev => ({ ...prev, amount: paymentDetail.netAmount }));
                  setShowRefundModal(true);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700"
              >
                Process Refund
              </button>
            )}

            {['PENDING', 'FAILED'].includes(paymentDetail.status) && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Cancel Payment
              </button>
            )}

            {paymentDetail.status === 'FAILED' && (
              <button
                onClick={() => setShowRetryModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Retry Payment
              </button>
            )}

            <button
              onClick={() => downloadReceiptMutation.mutate()}
              disabled={downloadReceiptMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {downloadReceiptMutation.isPending ? 'Downloading...' : 'Download Receipt'}
            </button>

            <button
              onClick={() => setShowSendReceiptModal(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Send Receipt
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment Details
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              History
            </button>
          </nav>
        </div>

        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transaction Info Card */}
            <ComponentCard title="Transaction Info">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction Code:</span>
                  <span className="font-mono font-medium">{paymentDetail.transactionCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <Badge color={getStatusColor(paymentDetail.status) as any}>
                    {paymentDetail.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Date:</span>
                  <span>{dayjs(paymentDetail.paymentDate).format('DD/MM/YYYY HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span>{dayjs(paymentDetail.createdDate).format('DD/MM/YYYY HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated:</span>
                  <span>{dayjs(paymentDetail.lastUpdated).format('DD/MM/YYYY HH:mm')}</span>
                </div>
              </div>
            </ComponentCard>

            {/* Payment Details Card */}
            <ComponentCard title="Payment Details">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {paymentDetail.amount.toLocaleString()} {paymentDetail.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Currency:</span>
                  <span>{paymentDetail.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getMethodIcon(paymentDetail.paymentMethod)}</span>
                    <span>{paymentDetail.paymentMethod.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction Fee:</span>
                  <span>{paymentDetail.transactionFee?.toLocaleString() || 0} {paymentDetail.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Net Amount:</span>
                  <span className="font-medium">
                    {paymentDetail.netAmount.toLocaleString()} {paymentDetail.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax:</span>
                  <span>{paymentDetail.tax?.toLocaleString() || 0} {paymentDetail.currency}</span>
                </div>
              </div>
            </ComponentCard>

            {/* Patient Info Card */}
            <ComponentCard title="Patient Info">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium">{paymentDetail.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span>{paymentDetail.patientEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <span>{paymentDetail.patientPhone}</span>
                </div>
                <div className="mt-4">
                  <button className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100">
                    View Patient Profile
                  </button>
                </div>
              </div>
            </ComponentCard>

            {/* Doctor Info Card */}
            <ComponentCard title="Doctor Info">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium">{paymentDetail.doctorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Specialization:</span>
                  <span>{paymentDetail.doctorSpecialization}</span>
                </div>
                <div className="mt-4">
                  <button className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100">
                    View Doctor Profile
                  </button>
                </div>
              </div>
            </ComponentCard>

            {/* Appointment Info Card */}
            <ComponentCard title="Appointment Info">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Appointment Code:</span>
                  <span className="font-mono font-medium">{paymentDetail.appointmentCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date & Time:</span>
                  <span>{dayjs(paymentDetail.appointmentDate).format('DD/MM/YYYY HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span>{paymentDetail.appointmentType}</span>
                </div>
                <div className="mt-4">
                  <button className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100">
                    View Appointment Detail
                  </button>
                </div>
              </div>
            </ComponentCard>

            {/* Payment Gateway Info Card */}
            {paymentDetail.gatewayName && (
              <ComponentCard title="Payment Gateway Info">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gateway Name:</span>
                    <span>{paymentDetail.gatewayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transaction ID:</span>
                    <span className="font-mono text-sm">{paymentDetail.gatewayTransactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gateway Status:</span>
                    <span>{paymentDetail.gatewayStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Response:</span>
                    <span className="text-sm">{paymentDetail.gatewayResponse}</span>
                  </div>
                </div>
              </ComponentCard>
            )}

            {/* Refund Info Card */}
            {(paymentDetail.isRefunded || paymentDetail.status === 'REFUNDED' || paymentDetail.refundAmount) && (
              <ComponentCard title="✅ Refund Info">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Refund Amount:</span>
                    <span className="font-medium text-red-600">
                      {paymentDetail.refundAmount?.toLocaleString() || 0} {paymentDetail.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Refund Date:</span>
                    <span>{paymentDetail.refundDate ? dayjs(paymentDetail.refundDate).format('DD/MM/YYYY HH:mm') : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Refund Reason:</span>
                    <span>{paymentDetail.refundReason || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Refunded By:</span>
                    <span>{paymentDetail.refundedBy || paymentDetail.refundedByName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Refund Status:</span>
                    <Badge color={paymentDetail.refundStatus === 'COMPLETED' ? 'success' : 'warning'}>
                      {paymentDetail.refundStatus || 'REFUNDED'}
                    </Badge>
                  </div>
                </div>
              </ComponentCard>
            )}

            {/* Notes Card */}
            <ComponentCard title="Notes" className="lg:col-span-2">
              <div className="space-y-4">
                {paymentDetail.adminNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {paymentDetail.adminNotes}
                    </div>
                  </div>
                )}
                {paymentDetail.patientNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient Notes
                    </label>
                    <div className="p-3 bg-blue-50 rounded-md">
                      {paymentDetail.patientNotes}
                    </div>
                  </div>
                )}
              </div>
            </ComponentCard>
          </div>
        )}

        {activeTab === 'history' && (
          <ComponentCard title="Payment History">
            <div className="space-y-4">
              {paymentHistory?.events?.map((event, index) => (
                <div key={event.id || index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      (event.eventType || event.event) === 'CREATED' ? 'bg-gray-100' :
                      (event.eventType || event.event) === 'REFUND_PROCESSED' ? 'bg-red-100' :
                      (event.newValue) === 'PAID' ? 'bg-green-100' :
                      (event.newValue) === 'CANCELLED' ? 'bg-orange-100' :
                      'bg-blue-100'
                    }`}>
                      <span className={`text-sm font-medium ${
                        (event.eventType || event.event) === 'CREATED' ? 'text-gray-600' :
                        (event.eventType || event.event) === 'REFUND_PROCESSED' ? 'text-red-600' :
                        (event.newValue) === 'PAID' ? 'text-green-600' :
                        (event.newValue) === 'CANCELLED' ? 'text-orange-600' :
                        'text-blue-600'
                      }`}>
                        {(event.eventType || event.event) === 'CREATED' ? '📝' :
                         (event.eventType || event.event) === 'REFUND_PROCESSED' ? '💰' :
                         (event.newValue) === 'PAID' ? '✅' :
                         (event.newValue) === 'CANCELLED' ? '❌' :
                         (event.newValue) === 'EXPIRED' ? '⏰' : '🔄'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        {event.description}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {dayjs(event.eventTime || event.timestamp).format('DD/MM/YYYY HH:mm:ss')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {event.previousValue && event.newValue && (
                        <span className="text-xs text-gray-500">
                          <Badge color={getStatusColor(event.previousValue) as any} size="sm">
                            {event.previousValue}
                          </Badge>
                          {' → '}
                          <Badge color={getStatusColor(event.newValue) as any} size="sm">
                            {event.newValue}
                          </Badge>
                        </span>
                      )}
                    </div>
                    {(event.performedByName || event.user) && (
                      <p className="text-xs text-gray-500 mt-1">
                        By: {event.performedByName || event.user}
                      </p>
                    )}
                    {event.metadata && typeof event.metadata === 'object' && 'refundAmount' in event.metadata && (
                      <p className="text-xs text-red-500 mt-1">
                        Refund Amount: {Number(event.metadata.refundAmount).toLocaleString()} VND
                      </p>
                    )}
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  No history events found
                </div>
              )}
            </div>
          </ComponentCard>
        )}
      </div>

      {/* Mark as Paid Modal */}
      {showMarkPaidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Mark Payment as Paid</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={markPaidForm.paymentMethod || ''}
                  onChange={(e) => setMarkPaidForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select method</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="E_WALLET">E-Wallet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={markPaidForm.notes || ''}
                  onChange={(e) => setMarkPaidForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowMarkPaidModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsPaid}
                disabled={markAsPaidMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {markAsPaidMutation.isPending ? 'Processing...' : 'Mark as Paid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Process Refund</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Amount *
                </label>
                <input
                  type="number"
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  max={paymentDetail.netAmount}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max: {paymentDetail.netAmount.toLocaleString()} {paymentDetail.currency}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Reason *
                </label>
                <textarea
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Method
                </label>
                <select
                  value={refundForm.refundMethod}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, refundMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ORIGINAL">Original Payment Method</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sendNotification"
                  checked={refundForm.sendNotification}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, sendNotification: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="sendNotification" className="text-sm text-gray-700">
                  Send notification to patient
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={refundMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 disabled:opacity-50"
              >
                {refundMutation.isPending ? 'Processing...' : 'Process Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Cancel Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason *
                </label>
                <select
                  value={cancelForm.reason}
                  onChange={(e) => setCancelForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select reason</option>
                  <option value="PATIENT_REQUEST">Patient Request</option>
                  <option value="PAYMENT_ERROR">Payment Error</option>
                  <option value="DUPLICATE_PAYMENT">Duplicate Payment</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={cancelForm.notes || ''}
                  onChange={(e) => setCancelForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Processing...' : 'Cancel Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retry Modal */}
      {showRetryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Retry Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send Method
                </label>
                <select
                  value={retryForm.sendVia}
                  onChange={(e) => setRetryForm((prev: RetryPaymentDTO) => ({ ...prev, sendVia: e.target.value as 'EMAIL' | 'SMS' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowRetryModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRetry}
                disabled={retryMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {retryMutation.isPending ? 'Processing...' : 'Retry Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Receipt Modal */}
      {showSendReceiptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Send Receipt</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={sendReceiptForm.email || paymentDetail.patientEmail || ''}
                  onChange={(e) => setSendReceiptForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="patient@example.com"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowSendReceiptModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReceipt}
                disabled={sendReceiptMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {sendReceiptMutation.isPending ? 'Sending...' : 'Send Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentDetail;