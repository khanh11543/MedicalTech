import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import RefundTable from './components/RefundTable';
import RefundFilters from './components/RefundFilters';
import RefundStats from './components/RefundStats';
import { ApproveRefundModal, RejectRefundModal, ProcessRefundModal, RetryRefundModal } from './components/RefundModals';
import * as refundService from '../../services/refundService';

const RefundList: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Filters state
  const [filters, setFilters] = useState<refundService.RefundFilterParams>({
    pageNumber: 0,
    pageSize: 10,
    sortBy: 'requestedDate',
    sortDir: 'DESC',
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // Modal states
  const [approveModal, setApproveModal] = useState<{ open: boolean; refund: refundService.RefundDTO | null }>({ open: false, refund: null });
  const [rejectModal, setRejectModal] = useState<{ open: boolean; refund: refundService.RefundDTO | null }>({ open: false, refund: null });
  const [processModal, setProcessModal] = useState<{ open: boolean; refund: refundService.RefundDTO | null }>({ open: false, refund: null });
  const [retryModal, setRetryModal] = useState<{ open: boolean; refund: refundService.RefundDTO | null }>({ open: false, refund: null });

  // ==================== API Queries ====================
  const { data: refundsData, isLoading, error: refundsError } = useQuery({
    queryKey: ['refunds', filters, pagination],
    queryFn: async () => {
      const params: refundService.RefundFilterParams = {
        ...filters,
        pageNumber: pagination.current - 1,
        pageSize: pagination.pageSize,
      };
      return await refundService.getAllRefunds(params);
    },
  });

  const { data: statsData, error: statsError } = useQuery({
    queryKey: ['refund-stats', filters.from, filters.to],
    queryFn: async () => {
      const from = filters.from || dayjs().startOf('month').format('YYYY-MM-DD');
      const to = filters.to || dayjs().endOf('month').format('YYYY-MM-DD');
      return await refundService.getRefundStatistics(from, to);
    },
  });

  // ==================== Mutations ====================
  const approveMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: refundService.ApproveRefundDTO }) => {
      return await refundService.approveRefund(id, data);
    },
    onSuccess: () => {
      alert('Refund approved successfully');
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      queryClient.invalidateQueries({ queryKey: ['refund-stats'] });
      setApproveModal({ open: false, refund: null });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to approve refund');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: refundService.RejectRefundDTO }) => {
      return await refundService.rejectRefund(id, data);
    },
    onSuccess: () => {
      alert('Refund rejected');
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      queryClient.invalidateQueries({ queryKey: ['refund-stats'] });
      setRejectModal({ open: false, refund: null });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to reject refund');
    },
  });

  const processMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: refundService.ProcessRefundDTO }) => {
      return await refundService.processRefund(id, data);
    },
    onSuccess: () => {
      alert('Refund processing started');
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      queryClient.invalidateQueries({ queryKey: ['refund-stats'] });
      setProcessModal({ open: false, refund: null });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to process refund');
    },
  });

  const retryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: refundService.RetryRefundDTO }) => {
      return await refundService.retryRefund(id, data);
    },
    onSuccess: () => {
      alert('Refund retry initiated');
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      queryClient.invalidateQueries({ queryKey: ['refund-stats'] });
      setRetryModal({ open: false, refund: null });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to retry refund');
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (format: string) => {
      const blob = await refundService.exportRefunds({ ...filters, format });
      return { blob, format };
    },
    onSuccess: ({ blob, format }) => {
      const filename = `refunds_export_${dayjs().format('YYYY-MM-DD')}.${format.toLowerCase()}`;
      refundService.downloadFile(blob, filename);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Export failed');
    },
  });

  // ==================== Handlers ====================
  const handleFilterChange = (key: keyof refundService.RefundFilterParams, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleDateRangeChange = (from: string, to: string) => {
    setFilters(prev => ({ ...prev, from: from || undefined, to: to || undefined }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      pageNumber: 0,
      pageSize: 10,
      sortBy: 'requestedDate',
      sortDir: 'DESC',
    });
    setPagination({ current: 1, pageSize: 10 });
  };

  // Stats component
  const statsComponent = useMemo(() => {
    if (!statsData) return null;
    return <RefundStats stats={statsData} isLoading={false} />;
  }, [statsData]);

  return (
    <>
      <PageMeta
        title="Refund Management | MedicalTech Dashboard"
        description="Manage refund requests and processing"
      />
      <PageBreadcrumb pageTitle="Refund Management" />

      <div className="space-y-6">
        {/* Error Display */}
        {(refundsError || statsError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <p className="font-bold mb-2">Error Loading Refund Data</p>
            <div className="text-sm space-y-1">
              {refundsError && (
                <p>Refunds Error: {(refundsError as any)?.response?.data?.message || (refundsError as any)?.message || 'Unknown error'}</p>
              )}
              {statsError && (
                <p>Stats Error: {(statsError as any)?.response?.data?.message || (statsError as any)?.message || 'Unknown error'}</p>
              )}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {statsComponent}

        {/* Filters */}
        <RefundFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onDateRangeChange={handleDateRangeChange}
          onResetFilters={handleResetFilters}
        />

        {/* Actions Row */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {refundsData
              ? `${refundsData.totalElements} refund(s) found`
              : isLoading
                ? 'Loading...'
                : ''
            }
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate('/payment-list')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
            >
              ← Back to Payments
            </button>
            <button
              onClick={() => exportMutation.mutate('CSV')}
              disabled={exportMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
            >
              {exportMutation.isPending ? 'Exporting...' : '📊 Export CSV'}
            </button>
            <button
              onClick={() => exportMutation.mutate('EXCEL')}
              disabled={exportMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
            >
              {exportMutation.isPending ? 'Exporting...' : '📋 Export Excel'}
            </button>
          </div>
        </div>

        {/* Refund Table */}
        <ComponentCard title="Refund Requests">
          {isLoading && (
            <div className="p-8 text-center text-gray-500">Loading refunds...</div>
          )}
          {!isLoading && !refundsError && (
            <>
              <RefundTable
                refunds={refundsData?.content || []}
                loading={isLoading}
                onViewRefund={(refundId) => navigate(`/refund-list/${refundId}`)}
                onApproveRefund={(refund) => setApproveModal({ open: true, refund })}
                onRejectRefund={(refund) => setRejectModal({ open: true, refund })}
                onProcessRefund={(refund) => setProcessModal({ open: true, refund })}
                onRetryRefund={(refund) => setRetryModal({ open: true, refund })}
              />

              {/* Pagination */}
              {refundsData && refundsData.totalElements > 0 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-white/[0.05]">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {((pagination.current - 1) * pagination.pageSize) + 1} to{' '}
                    {Math.min(pagination.current * pagination.pageSize, refundsData.totalElements)} of{' '}
                    {refundsData.totalElements} refunds
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                      disabled={pagination.current === 1}
                      className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
                      {pagination.current}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                      disabled={pagination.current * pagination.pageSize >= refundsData.totalElements}
                      className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              {refundsData && refundsData.totalElements === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No refund requests found. Try adjusting your filters.
                </div>
              )}
            </>
          )}
        </ComponentCard>
      </div>

      {/* ==================== Modals ==================== */}
      <ApproveRefundModal
        isOpen={approveModal.open}
        onClose={() => setApproveModal({ open: false, refund: null })}
        onSubmit={(data) => {
          if (approveModal.refund) {
            approveMutation.mutate({ id: approveModal.refund.id, data });
          }
        }}
        isLoading={approveMutation.isPending}
        refund={approveModal.refund}
      />

      <RejectRefundModal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, refund: null })}
        onSubmit={(data) => {
          if (rejectModal.refund) {
            rejectMutation.mutate({ id: rejectModal.refund.id, data });
          }
        }}
        isLoading={rejectMutation.isPending}
        refund={rejectModal.refund}
      />

      <ProcessRefundModal
        isOpen={processModal.open}
        onClose={() => setProcessModal({ open: false, refund: null })}
        onSubmit={(data) => {
          if (processModal.refund) {
            processMutation.mutate({ id: processModal.refund.id, data });
          }
        }}
        isLoading={processMutation.isPending}
        refund={processModal.refund}
      />

      <RetryRefundModal
        isOpen={retryModal.open}
        onClose={() => setRetryModal({ open: false, refund: null })}
        onSubmit={(data) => {
          if (retryModal.refund) {
            retryMutation.mutate({ id: retryModal.refund.id, data });
          }
        }}
        isLoading={retryMutation.isPending}
        refund={retryModal.refund}
      />
    </>
  );
};

export default RefundList;
