import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import { ApproveRefundModal, RejectRefundModal, ProcessRefundModal, RetryRefundModal } from './components/RefundModals';
import * as refundService from '../../services/refundService';

dayjs.extend(relativeTime);

const RefundDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  // Modal states
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [processModal, setProcessModal] = useState(false);
  const [retryModal, setRetryModal] = useState(false);

  // ==================== API Queries ====================
  const { data: refundDetail, isLoading } = useQuery({
    queryKey: ['refund-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Refund ID is required');
      return await refundService.getRefundDetail(Number(id));
    },
    enabled: !!id,
  });

  // ==================== Mutations ====================
  const approveMutation = useMutation({
    mutationFn: async (data: refundService.ApproveRefundDTO) => {
      if (!id) throw new Error('Refund ID is required');
      return await refundService.approveRefund(Number(id), data);
    },
    onSuccess: () => {
      alert('Refund approved successfully');
      queryClient.invalidateQueries({ queryKey: ['refund-detail'] });
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      setApproveModal(false);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to approve refund');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (data: refundService.RejectRefundDTO) => {
      if (!id) throw new Error('Refund ID is required');
      return await refundService.rejectRefund(Number(id), data);
    },
    onSuccess: () => {
      alert('Refund rejected');
      queryClient.invalidateQueries({ queryKey: ['refund-detail'] });
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      setRejectModal(false);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to reject refund');
    },
  });

  const processMutation = useMutation({
    mutationFn: async (data: refundService.ProcessRefundDTO) => {
      if (!id) throw new Error('Refund ID is required');
      return await refundService.processRefund(Number(id), data);
    },
    onSuccess: () => {
      alert('Refund processing started');
      queryClient.invalidateQueries({ queryKey: ['refund-detail'] });
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      setProcessModal(false);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to process refund');
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (data: refundService.RetryRefundDTO) => {
      if (!id) throw new Error('Refund ID is required');
      return await refundService.retryRefund(Number(id), data);
    },
    onSuccess: () => {
      alert('Refund retry initiated');
      queryClient.invalidateQueries({ queryKey: ['refund-detail'] });
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      setRetryModal(false);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to retry refund');
    },
  });

  // ==================== History Event Helpers ====================
  const getHistoryEventIcon = (eventType: string): string => {
    switch (eventType) {
      case 'REFUND_REQUESTED': return '📋';
      case 'REFUND_APPROVED': return '✅';
      case 'REFUND_REJECTED': return '🚫';
      case 'REFUND_PROCESSING': return '⏳';
      case 'REFUND_COMPLETED': return '💰';
      case 'REFUND_FAILED': return '❌';
      case 'REFUND_AMOUNT_CHANGED': return '💱';
      case 'REFUND_METHOD_CHANGED': return '🔄';
      default: return '📝';
    }
  };

  const getHistoryEventColor = (eventType: string): string => {
    switch (eventType) {
      case 'REFUND_REQUESTED': return 'bg-amber-100 dark:bg-amber-900/30';
      case 'REFUND_APPROVED': return 'bg-green-100 dark:bg-green-900/30';
      case 'REFUND_REJECTED': return 'bg-red-100 dark:bg-red-900/30';
      case 'REFUND_PROCESSING': return 'bg-blue-100 dark:bg-blue-900/30';
      case 'REFUND_COMPLETED': return 'bg-emerald-100 dark:bg-emerald-900/30';
      case 'REFUND_FAILED': return 'bg-red-100 dark:bg-red-900/30';
      case 'REFUND_AMOUNT_CHANGED': return 'bg-purple-100 dark:bg-purple-900/30';
      case 'REFUND_METHOD_CHANGED': return 'bg-indigo-100 dark:bg-indigo-900/30';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  // ==================== Lifecycle Visualization ====================
  const lifecycleSteps = [
    { status: 'REQUESTED', label: 'Requested', icon: '📋' },
    { status: 'APPROVED', label: 'Approved', icon: '✅' },
    { status: 'PROCESSING', label: 'Processing', icon: '⏳' },
    { status: 'COMPLETED', label: 'Completed', icon: '💰' },
  ];

  const getLifecycleStepState = (stepStatus: string): 'completed' | 'current' | 'pending' | 'failed' | 'rejected' => {
    if (!refundDetail) return 'pending';

    const statusOrder = ['REQUESTED', 'APPROVED', 'PROCESSING', 'COMPLETED'];
    const currentIndex = statusOrder.indexOf(refundDetail.status);
    const stepIndex = statusOrder.indexOf(stepStatus);

    if (refundDetail.status === 'REJECTED') {
      return stepStatus === 'REQUESTED' ? 'completed' : stepStatus === 'APPROVED' ? 'rejected' : 'pending';
    }
    if (refundDetail.status === 'FAILED') {
      if (stepIndex < currentIndex) return 'completed';
      if (stepStatus === 'PROCESSING') return 'failed';
      return 'pending';
    }

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  // ==================== Rendering ====================

  if (isLoading) {
    return (
      <>
        <PageMeta title="Refund Detail | MedicalTech Dashboard" description="View refund detail" />
        <PageBreadcrumb pageTitle="Refund Detail" />
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </>
    );
  }

  if (!refundDetail) {
    return (
      <>
        <PageMeta title="Refund Detail | MedicalTech Dashboard" description="View refund detail" />
        <PageBreadcrumb pageTitle="Refund Detail" />
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">Refund not found</div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={`Refund ${refundDetail.refundCode} | MedicalTech Dashboard`}
        description="View refund detail and processing"
      />
      <PageBreadcrumb pageTitle={`Refund Detail - ${refundDetail.refundCode}`} />

      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/refund-list')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Back to Refunds
            </button>
            <Badge size="md" color={refundService.getRefundStatusColor(refundDetail.status) as any}>
              {refundService.getRefundStatusIcon(refundDetail.status)} {refundDetail.status}
            </Badge>
            {refundDetail.urgent && (
              <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                🔥 URGENT
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {refundDetail.status === 'REQUESTED' && (
              <>
                <button
                  onClick={() => setApproveModal(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => setRejectModal(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  🚫 Reject
                </button>
              </>
            )}

            {refundDetail.status === 'APPROVED' && (
              <button
                onClick={() => setProcessModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
              >
                ⚙️ Process Refund
              </button>
            )}

            {refundDetail.status === 'PROCESSING' && refundDetail.refundType === 'MANUAL' && (
              <button
                onClick={() => setProcessModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                ✅ Mark Completed
              </button>
            )}

            {refundDetail.status === 'FAILED' && (
              <button
                onClick={() => setRetryModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
              >
                🔄 Retry Refund
              </button>
            )}

            <button
              onClick={() => navigate(`/admin/payment-list/${refundDetail.paymentId}`)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              View Original Payment
            </button>
          </div>
        </div>

        {/* Lifecycle Progress Bar */}
        <ComponentCard title="Refund Lifecycle">
          <div className="flex items-center justify-between px-4 py-2">
            {lifecycleSteps.map((step, index) => {
              const state = getLifecycleStepState(step.status);
              return (
                <React.Fragment key={step.status}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        state === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : state === 'current'
                            ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                            : state === 'failed'
                              ? 'bg-red-100 dark:bg-red-900/30 ring-2 ring-red-500'
                              : state === 'rejected'
                                ? 'bg-red-100 dark:bg-red-900/30 ring-2 ring-red-500'
                                : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      {state === 'completed' ? '✅' :
                       state === 'failed' ? '❌' :
                       state === 'rejected' ? '🚫' :
                       state === 'current' ? step.icon :
                       '⚪'}
                    </div>
                    <span className={`text-xs mt-1 font-medium ${
                      state === 'completed' ? 'text-green-600' :
                      state === 'current' ? 'text-blue-600' :
                      state === 'failed' || state === 'rejected' ? 'text-red-600' :
                      'text-gray-400'
                    }`}>
                      {state === 'rejected' && step.status === 'APPROVED' ? 'Rejected' : step.label}
                    </span>
                  </div>
                  {index < lifecycleSteps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded ${
                      getLifecycleStepState(lifecycleSteps[index + 1].status) === 'completed' ||
                      getLifecycleStepState(lifecycleSteps[index + 1].status) === 'current'
                        ? 'bg-green-400'
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </ComponentCard>

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
              Refund Details
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              History Timeline
            </button>
          </nav>
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Refund Info */}
            <ComponentCard title="Refund Info">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Refund Code:</span>
                  <span className="font-mono font-medium">{refundDetail.refundCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <Badge color={refundService.getRefundStatusColor(refundDetail.status) as any}>
                    {refundService.getRefundStatusIcon(refundDetail.status)} {refundDetail.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Reason:</span>
                  <span>{refundService.getRefundReasonLabel(refundDetail.refundReasonType as refundService.RefundReason)}</span>
                </div>
                {refundDetail.refundReason && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Note:</span>
                    <span className="text-right max-w-[60%]">{refundDetail.refundReason}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Refund Type:</span>
                  <span>{refundDetail.refundType === 'MANUAL' ? 'Manual' : 'Automatic'}</span>
                </div>
                {refundDetail.retryCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Retry Count:</span>
                    <span className="text-red-600 font-medium">{refundDetail.retryCount} / {refundDetail.maxRetries}</span>
                  </div>
                )}
              </div>
            </ComponentCard>

            {/* Amount Info */}
            <ComponentCard title="Amount Info">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Original Payment:</span>
                  <span className="font-medium">
                    {refundService.formatCurrency(refundDetail.originalAmount, refundDetail.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Refund Amount:</span>
                  <span className="text-2xl font-bold text-red-600">
                    {refundService.formatCurrency(refundDetail.refundAmount, refundDetail.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Refund Percentage:</span>
                  <span className="font-medium text-blue-600">
                    {refundDetail.refundPercentage?.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Refund Method:</span>
                  <span>
                    {refundService.getRefundMethodIcon(refundDetail.refundMethod)}{' '}
                    {refundService.getRefundMethodLabel(refundDetail.refundMethod)}
                  </span>
                </div>
              </div>
            </ComponentCard>

            {/* Patient Info */}
            <ComponentCard title="Patient Info">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium">{refundDetail.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span>{refundDetail.patientEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <span>{refundDetail.patientPhone}</span>
                </div>
                {refundDetail.appointmentCode && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Appointment:</span>
                    <span className="font-mono">{refundDetail.appointmentCode}</span>
                  </div>
                )}
                {refundDetail.doctorName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Doctor:</span>
                    <span>{refundDetail.doctorName}</span>
                  </div>
                )}
              </div>
            </ComponentCard>

            {/* Timeline / People */}
            <ComponentCard title="Timeline & People">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Requested:</span>
                  <div className="text-right">
                    <span>{dayjs(refundDetail.requestedDate).format('DD/MM/YYYY HH:mm')}</span>
                    <div className="text-xs text-gray-400">by {refundDetail.requestedByName}</div>
                  </div>
                </div>
                {refundDetail.approvedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Approved:</span>
                    <div className="text-right">
                      <span>{dayjs(refundDetail.approvedDate).format('DD/MM/YYYY HH:mm')}</span>
                      <div className="text-xs text-gray-400">by {refundDetail.approvedByName}</div>
                    </div>
                  </div>
                )}
                {refundDetail.rejectedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rejected:</span>
                    <div className="text-right">
                      <span className="text-red-600">{dayjs(refundDetail.rejectedDate).format('DD/MM/YYYY HH:mm')}</span>
                      <div className="text-xs text-red-400">by {refundDetail.rejectedByName}</div>
                    </div>
                  </div>
                )}
                {refundDetail.processedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Processed:</span>
                    <div className="text-right">
                      <span>{dayjs(refundDetail.processedDate).format('DD/MM/YYYY HH:mm')}</span>
                      <div className="text-xs text-gray-400">by {refundDetail.processedByName}</div>
                    </div>
                  </div>
                )}
              </div>
            </ComponentCard>

            {/* Rejection Info */}
            {refundDetail.status === 'REJECTED' && refundDetail.rejectionReason && (
              <ComponentCard title="Rejection Details" className="lg:col-span-2">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🚫</span>
                    <div>
                      <h4 className="font-medium text-red-700 dark:text-red-400">This refund was rejected</h4>
                      <p className="text-sm text-red-600 mt-1">{refundDetail.rejectionReason}</p>
                      {refundDetail.rejectedByName && (
                        <p className="text-xs text-red-500 mt-2">
                          Rejected by {refundDetail.rejectedByName} on{' '}
                          {dayjs(refundDetail.rejectedDate).format('DD/MM/YYYY HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </ComponentCard>
            )}

            {/* Manual Refund Details */}
            {refundDetail.refundType === 'MANUAL' && (refundDetail.transactionReference || refundDetail.processingNotes) && (
              <ComponentCard title="Manual Refund Details" className="lg:col-span-2">
                <div className="space-y-3">
                  {refundDetail.transactionReference && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Reference:</span>
                      <span className="font-mono font-medium">{refundDetail.transactionReference}</span>
                    </div>
                  )}
                  {refundDetail.processingNotes && (
                    <div>
                      <span className="text-gray-500">Notes:</span>
                      <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md text-sm">
                        {refundDetail.processingNotes}
                      </div>
                    </div>
                  )}
                  {refundDetail.cashierConfirmed && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cashier Confirmed:</span>
                      <span className="text-green-600 font-medium">✅ Yes</span>
                    </div>
                  )}
                  {refundDetail.evidenceUrl && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Evidence:</span>
                      <a href={refundDetail.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Evidence
                      </a>
                    </div>
                  )}
                </div>
              </ComponentCard>
            )}

            {/* Gateway Info */}
            {refundDetail.gatewayRefundId && (
              <ComponentCard title="Gateway Info" className="lg:col-span-2">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gateway Refund ID:</span>
                    <span className="font-mono text-sm">{refundDetail.gatewayRefundId}</span>
                  </div>
                </div>
              </ComponentCard>
            )}

            {/* Original Payment Reference */}
            <ComponentCard title="Original Payment" className="lg:col-span-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-xs text-gray-500">Payment Code</span>
                  <p className="font-mono text-sm font-medium">{refundDetail.paymentCode}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Amount</span>
                  <p className="text-sm font-medium">{refundService.formatCurrency(refundDetail.originalAmount, refundDetail.currency)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Method</span>
                  <p className="text-sm">{refundDetail.paymentMethod}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Payment Date</span>
                  <p className="text-sm">{refundDetail.paymentDate ? dayjs(refundDetail.paymentDate).format('DD/MM/YYYY HH:mm') : 'N/A'}</p>
                </div>
              </div>
              {refundDetail.transactionId && (
                <div className="mt-2">
                  <span className="text-xs text-gray-500">Transaction ID:</span>
                  <span className="font-mono text-xs ml-2">{refundDetail.transactionId}</span>
                </div>
              )}
              <div className="mt-3">
                <button
                  onClick={() => navigate(`/admin/payment-list/${refundDetail.paymentId}`)}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                >
                  View Payment Detail →
                </button>
              </div>
            </ComponentCard>

            {/* Admin Notes */}
            {refundDetail.notes && (
              <ComponentCard title="Admin Notes" className="lg:col-span-2">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                  {refundDetail.notes}
                </div>
              </ComponentCard>
            )}
          </div>
        )}

        {/* History Timeline Tab */}
        {activeTab === 'history' && (
          <ComponentCard title="Refund History Timeline">
            <div className="space-y-0">
              {(!refundDetail.history || refundDetail.history.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  No history events found
                </div>
              ) : (
                refundDetail.history.map((event, index) => (
                  <div key={event.id || index} className="relative pl-8 pb-6 last:pb-0">
                    {/* Vertical line */}
                    {index < refundDetail.history.length - 1 && (
                      <div className="absolute left-[15px] top-10 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600" />
                    )}
                    {/* Event dot */}
                    <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center text-sm ${getHistoryEventColor(event.eventType)}`}>
                      {getHistoryEventIcon(event.eventType)}
                    </div>
                    {/* Event content */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ml-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                          {event.eventType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-gray-400">
                          {dayjs(event.eventTime).format('DD/MM/YYYY HH:mm:ss')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
                      {event.previousStatus && event.newStatus && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge color="light" size="sm">{event.previousStatus}</Badge>
                          <span className="text-gray-400">→</span>
                          <Badge color={refundService.getRefundStatusColor(event.newStatus as refundService.RefundStatus) as any} size="sm">
                            {event.newStatus}
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <span>By: {event.performedByName}</span>
                        <span>({dayjs(event.eventTime).fromNow()})</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ComponentCard>
        )}
      </div>

      {/* ==================== Modals ==================== */}
      <ApproveRefundModal
        isOpen={approveModal}
        onClose={() => setApproveModal(false)}
        onSubmit={(data) => approveMutation.mutate(data)}
        isLoading={approveMutation.isPending}
        refund={refundDetail}
      />

      <RejectRefundModal
        isOpen={rejectModal}
        onClose={() => setRejectModal(false)}
        onSubmit={(data) => rejectMutation.mutate(data)}
        isLoading={rejectMutation.isPending}
        refund={refundDetail}
      />

      <ProcessRefundModal
        isOpen={processModal}
        onClose={() => setProcessModal(false)}
        onSubmit={(data) => processMutation.mutate(data)}
        isLoading={processMutation.isPending}
        refund={refundDetail}
      />

      <RetryRefundModal
        isOpen={retryModal}
        onClose={() => setRetryModal(false)}
        onSubmit={(data) => retryMutation.mutate(data)}
        isLoading={retryMutation.isPending}
        refund={retryModal ? refundDetail : null}
      />
    </>
  );
};

export default RefundDetail;
