import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import PaymentTable from './components/PaymentTable';
import PaymentFilters from './components/PaymentFilters';
import PaymentStats from './components/PaymentStats';
import PaymentMethodChart from './components/PaymentMethodChart';
import PaymentBulkActions from './components/PaymentBulkActions';
import PaymentExport from './components/PaymentExport';
import * as paymentService from '../../services/paymentService';

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

const PaymentList: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedPayments, setSelectedPayments] = useState<number[]>([]);
  const [showBulkMarkPaidModal, setShowBulkMarkPaidModal] = useState(false);
  const [bulkMarkPaidIds, setBulkMarkPaidIds] = useState<number[]>([]);
  const [bulkPaymentMethod, setBulkPaymentMethod] = useState<string>('CASH');
  const [bulkNotes, setBulkNotes] = useState<string>('');
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: [],
    method: [],
    doctorId: null,
    patientId: null,
    minAmount: null,
    maxAmount: null,
    from: null,
    to: null,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // API calls
  const { data: paymentsData, isLoading, error: paymentsError } = useQuery({
    queryKey: ['payments', filters, pagination],
    queryFn: async () => {
      console.log('Fetching payments with filters:', filters);
      try {
        const params: paymentService.PaymentFilterParams = {
          search: filters.search || undefined,
          status: filters.status.length > 0 ? filters.status.join(',') : undefined,
          paymentMethod: filters.method.length > 0 ? filters.method.join(',') : undefined,
          doctorId: filters.doctorId || undefined,
          patientId: filters.patientId || undefined,
          minAmount: filters.minAmount || undefined,
          maxAmount: filters.maxAmount || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
          pageNumber: pagination.current - 1,
          pageSize: pagination.pageSize,
          sortBy: 'paymentDate',
          sortDir: 'DESC',
        };
        const result = await paymentService.getAllPayments(params);
        console.log('Payments fetched successfully:', result);
        return result;
      } catch (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }
    },
  });

  const { data: statsData, error: statsError } = useQuery({
    queryKey: ['payment-stats', filters.from, filters.to],
    queryFn: async () => {
      console.log('Fetching payment statistics...');
      try {
        const from = filters.from || dayjs().startOf('month').format('YYYY-MM-DD');
        const to = filters.to || dayjs().endOf('month').format('YYYY-MM-DD');
        const result = await paymentService.getPaymentStatistics(from, to);
        console.log('Stats fetched successfully:', result);
        return result;
      } catch (error) {
        console.error('Error fetching stats:', error);
        throw error;
      }
    },
  });

  // Mutations
  const bulkMarkPaidMutation = useMutation({
    mutationFn: (dto: paymentService.BulkMarkPaidDTO) =>
      paymentService.bulkMarkAsPaid(dto),
    onSuccess: () => {
      alert('Payments marked as paid successfully');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
      setSelectedPayments([]);
      setShowBulkMarkPaidModal(false);
      setBulkPaymentMethod('CASH');
      setBulkNotes('');
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to mark payments as paid');
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (params: paymentService.PaymentFilterParams & { format: string }) => {
      const blob = await paymentService.exportPayments(params);
      return { blob, format: params.format };
    },
    onSuccess: ({ blob, format }) => {
      const filename = `payments_export_${dayjs().format('YYYY-MM-DD')}.${format.toLowerCase()}`;
      paymentService.downloadFile(blob, filename);
      alert('Export completed successfully');
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Export failed');
    },
  });

  // Handlers
  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleDateRangeChange = (from: string, to: string) => {
    setFilters(prev => ({ ...prev, from, to }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: [],
      method: [],
      doctorId: null,
      patientId: null,
      minAmount: null,
      maxAmount: null,
      from: null,
      to: null,
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleBulkMarkPaid = (ids?: number[]) => {
    const paymentIds = ids || selectedPayments;
    if (paymentIds.length === 0) {
      alert('Please select payments to mark as paid');
      return;
    }
    setBulkMarkPaidIds(paymentIds);
    setShowBulkMarkPaidModal(true);
  };

  const confirmBulkMarkPaid = () => {
    if (!bulkPaymentMethod) {
      alert('Please select a payment method');
      return;
    }
    bulkMarkPaidMutation.mutate({
      paymentIds: bulkMarkPaidIds,
      paymentMethod: bulkPaymentMethod,
      notes: bulkNotes || undefined,
    });
  };

  const handleExport = (format: string) => {
    const params = {
      search: filters.search || undefined,
      status: filters.status.length > 0 ? filters.status.join(',') : undefined,
      paymentMethod: filters.method.length > 0 ? filters.method.join(',') : undefined,
      doctorId: filters.doctorId || undefined,
      patientId: filters.patientId || undefined,
      minAmount: filters.minAmount || undefined,
      maxAmount: filters.maxAmount || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      format,
    } as paymentService.PaymentFilterParams & { format: string };
    exportMutation.mutate(params);
  };

  const handleSelectPayment = (paymentId: number, checked: boolean) => {
    if (checked) {
      setSelectedPayments(prev => [...prev, paymentId]);
    } else {
      setSelectedPayments(prev => prev.filter(id => id !== paymentId));
    }
  };

  // Stats cards
  const statsCards = useMemo(() => {
    if (!statsData) return null;

    const paymentStats = {
      totalPayments: statsData.monthTransactionCount ?? 0,
      totalAmount: statsData.monthRevenue ?? 0,
      pendingPayments: statsData.pendingCount ?? 0,
      completedPayments: (statsData.monthTransactionCount ?? 0) - (statsData.pendingCount ?? 0) - (statsData.refundCountThisMonth ?? 0),
      failedPayments: statsData.statusCounts?.FAILED ?? 0,
      refundedPayments: statsData.refundCountThisMonth ?? 0,
      todayRevenue: statsData.todayRevenue ?? 0,
      monthlyRevenue: statsData.monthRevenue ?? 0,
    };

    return <PaymentStats stats={paymentStats} isLoading={false} />;
  }, [statsData]);

  // Payment method distribution
  const methodChart = useMemo(() => {
    if (!statsData?.paymentMethodsDistribution) return null;

    const chartData = statsData.paymentMethodsDistribution.map(item => ({
      method: item.method,
      count: item.count ?? Math.round((item.percentage / 100) * (statsData.monthTransactionCount ?? 0)),
      percentage: item.percentage,
    }));

    return <PaymentMethodChart data={chartData} isLoading={false} />;
  }, [statsData]);

  return (
    <>
      <PageMeta
        title="Payment Management | MedicalTech Dashboard"
        description="Manage payments in the MedicalTech system"
      />
      <PageBreadcrumb pageTitle="Payment Management" />

      <div className="space-y-6">
        {/* Error Display */}
        {(paymentsError || statsError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <p className="font-bold mb-2">Error Loading Payment Data</p>
            <div className="text-sm space-y-1">
              {paymentsError && (
                <p>Payments Error: {(paymentsError as any)?.response?.data?.message || (paymentsError as any)?.message || 'Unknown error'}</p>
              )}
              {statsError && (
                <p>Stats Error: {(statsError as any)?.response?.data?.message || (statsError as any)?.message || 'Unknown error'}</p>
              )}
              <p className="mt-2 font-semibold">Troubleshooting:</p>
              <ul className="list-disc ml-5">
                <li>Kiểm tra backend server đang chạy tại: <code className="bg-red-100 px-1">http://localhost:8080</code></li>
                <li>Mở Developer Console (F12) để xem chi tiết lỗi</li>
                <li>Kiểm tra API endpoint: <code className="bg-red-100 px-1">/api/admin/payments</code></li>
              </ul>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !paymentsError && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-pulse">
              <div className="text-lg text-gray-600">Loading payment data...</div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {statsCards}

        {/* Payment Method Distribution */}
        {methodChart}

        {/* Filters */}
        <PaymentFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onDateRangeChange={handleDateRangeChange}
          onResetFilters={handleResetFilters}
        />

        {/* Bulk Actions */}
        <PaymentBulkActions
          selectedIds={selectedPayments}
          onBulkAction={(action: string, ids: number[]) => {
            switch (action) {
              case 'mark_completed':
                handleBulkMarkPaid(ids);
                break;
              case 'mark_failed':
                alert(`Mark ${ids.length} payments as failed not implemented yet`);
                break;
              case 'cancel':
                alert(`Cancel ${ids.length} payments not implemented yet`);
                break;
              case 'send_receipts':
                alert(`Send receipts for ${ids.length} payments not implemented yet`);
                break;
              default:
                break;
            }
          }}
          isLoading={bulkMarkPaidMutation.isPending}
        />

        {/* Payments Table */}
        <ComponentCard title="Payments List">
          {isLoading && (
            <div className="p-8 text-center text-gray-500">
              Loading payments...
            </div>
          )}
          {!isLoading && !paymentsError && (
            <>
              <PaymentTable
                payments={paymentsData?.content || []}
                loading={isLoading}
                selectedPayments={selectedPayments}
                onSelectPayment={handleSelectPayment}
                onViewPayment={(paymentId) => {
                  navigate(`/payment-list/${paymentId}`);
                }}
                onRefundPayment={(paymentId) => {
                  navigate(`/payment-list/${paymentId}`);
                }}
                onPrintReceipt={async (paymentId) => {
                  try {
                    const blob = await paymentService.downloadReceipt(paymentId);
                    paymentService.downloadFile(blob, `receipt_${paymentId}.pdf`);
                  } catch (error: any) {
                    alert(error?.response?.data?.message || 'Failed to download receipt');
                  }
                }}
              />
              {/* Pagination */}
              {paymentsData && paymentsData.totalElements > 0 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-white/[0.05]">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {((pagination.current - 1) * pagination.pageSize) + 1} to {Math.min(pagination.current * pagination.pageSize, paymentsData.totalElements)} of {paymentsData.totalElements} payments
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
                      disabled={pagination.current * pagination.pageSize >= paymentsData.totalElements}
                      className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              {paymentsData && paymentsData.totalElements === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No payments found. Try adjusting your filters.
                </div>
              )}
            </>
          )}
        </ComponentCard>

        {/* Export Section */}
        <PaymentExport
          onExport={handleExport}
          isLoading={exportMutation.isPending}
          filters={filters}
        />
      </div>

      {/* Bulk Mark Paid Modal */}
      {showBulkMarkPaidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              Mark {bulkMarkPaidIds.length} Payment(s) as Paid
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method *
                </label>
                <select
                  value={bulkPaymentMethod}
                  onChange={(e) => setBulkPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="CASH">💵 Cash</option>
                  <option value="MOMO">📱 MoMo</option>
                  <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  placeholder="Add notes for this bulk action..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowBulkMarkPaidModal(false);
                  setBulkPaymentMethod('CASH');
                  setBulkNotes('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkMarkPaid}
                disabled={bulkMarkPaidMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {bulkMarkPaidMutation.isPending ? 'Processing...' : 'Confirm Mark as Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentList;
