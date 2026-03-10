import React from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Badge from '../../../components/ui/badge/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import * as revenueService from '../../../services/revenueService';

export interface DrillDownConfig {
  title: string;
  date?: string;
  method?: string;
  doctorId?: number;
  appointmentType?: string;
  startDate: string;
  endDate: string;
}

interface DrillDownDrawerProps {
  config: DrillDownConfig | null;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'success',
  PENDING: 'warning',
  FAILED: 'error',
  CANCELLED: 'error',
  REFUNDED: 'info',
};

const DrillDownDrawer: React.FC<DrillDownDrawerProps> = ({ config, onClose }) => {
  const [page, setPage] = React.useState(0);
  const pageSize = 15;

  React.useEffect(() => {
    setPage(0);
  }, [config]);

  const { data, isLoading } = useQuery({
    queryKey: ['revenue-drilldown', config, page],
    queryFn: async () => {
      if (!config) throw new Error('No config');
      return await revenueService.getDrillDownTransactions({
        date: config.date,
        method: config.method,
        doctorId: config.doctorId,
        appointmentType: config.appointmentType,
        startDate: config.startDate,
        endDate: config.endDate,
        page,
        size: pageSize,
      });
    },
    enabled: !!config,
  });

  if (!config) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[99999] bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-[99999] w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl transform transition-transform overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white inline-flex items-center gap-2"><MagnifyingGlassIcon className="h-5 w-5" /> {config.title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {config.startDate && config.endDate
                ? `${dayjs(config.startDate).format('DD/MM/YYYY')} — ${dayjs(config.endDate).format('DD/MM/YYYY')}`
                : ''}
              {config.date && ` | Date: ${dayjs(config.date).format('DD/MM/YYYY')}`}
              {config.method && ` | Method: ${revenueService.PAYMENT_METHOD_LABELS[config.method] || config.method}`}
              {config.appointmentType && ` | Type: ${revenueService.APPOINTMENT_TYPE_LABELS[config.appointmentType] || config.appointmentType}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-gray-400">Loading transactions...</div>
            </div>
          ) : !data?.content?.length ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-gray-400">No transactions found</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Transaction</TableCell>
                    <TableCell isHeader>Date</TableCell>
                    <TableCell isHeader>Patient</TableCell>
                    <TableCell isHeader>Doctor</TableCell>
                    <TableCell isHeader>Amount</TableCell>
                    <TableCell isHeader>Method</TableCell>
                    <TableCell isHeader>Status</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.content.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <span className="font-mono text-xs text-blue-600">{tx.transactionCode}</span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {dayjs(tx.paymentDate).format('DD/MM/YYYY HH:mm')}
                      </TableCell>
                      <TableCell className="text-sm">{tx.patientName}</TableCell>
                      <TableCell className="text-sm">{tx.doctorName}</TableCell>
                      <TableCell className="font-medium text-sm">
                        {revenueService.formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {revenueService.PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod}
                      </TableCell>
                      <TableCell>
                        <Badge size="sm" color={(STATUS_COLORS[tx.status] || 'light') as any}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <span className="text-sm text-gray-500">
              Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, data.totalElements)} of{' '}
              {data.totalElements}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {page + 1} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages - 1}
                className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Summary Footer */}
        {data && data.content.length > 0 && (
          <div className="px-6 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 text-center">
            Total {data.totalElements} transactions • Showing essential fields only (no PHI over-exposure)
          </div>
        )}
      </div>
    </>
  );
};

export default DrillDownDrawer;
