import React from 'react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../../components/ui/table";
import Badge from "../../../components/ui/badge/Badge";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as refundService from '../../../services/refundService';

dayjs.extend(relativeTime);

interface RefundTableProps {
  refunds: refundService.RefundDTO[];
  loading?: boolean;
  onViewRefund: (refundId: number) => void;
  onApproveRefund: (refund: refundService.RefundDTO) => void;
  onRejectRefund: (refund: refundService.RefundDTO) => void;
  onProcessRefund: (refund: refundService.RefundDTO) => void;
  onRetryRefund: (refund: refundService.RefundDTO) => void;
  emptyMessage?: string;
}

const RefundTable: React.FC<RefundTableProps> = ({
  refunds,
  loading = false,
  onViewRefund,
  onApproveRefund,
  onRejectRefund,
  onProcessRefund,
  onRetryRefund,
  emptyMessage = "No refund requests found",
}) => {

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="p-8 text-center text-gray-500">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded dark:bg-gray-700" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!refunds || refunds.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="p-8 text-center text-gray-500">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Refund Code
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Original Payment
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Patient
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Amount
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Method
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Reason
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Status
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Requested
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {refunds.map((refund) => (
              <TableRow key={refund.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                {/* Refund Code */}
                <TableCell className="px-5 py-4 text-start">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewRefund(refund.id)}
                      className="font-mono text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400"
                    >
                      {refund.refundCode}
                    </button>
                    {refund.urgent && (
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" title="Urgent: overdue or failed multiple times">
                        🔥 URGENT
                      </span>
                    )}
                    {refund.refundType === 'MANUAL' && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        Manual
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Original Payment */}
                <TableCell className="px-5 py-4 text-start">
                  <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                    {refund.paymentCode}
                  </span>
                  <div className="text-xs text-gray-400">{refund.appointmentCode}</div>
                </TableCell>

                {/* Patient */}
                <TableCell className="px-5 py-4 text-start">
                  <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {refund.patientName}
                  </div>
                  <div className="text-xs text-gray-400">{refund.doctorName}</div>
                </TableCell>

                {/* Amount */}
                <TableCell className="px-5 py-4 text-start">
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">
                    {refundService.formatCurrency(refund.refundAmount, refund.currency)}
                  </span>
                  <div className="text-xs text-gray-400">
                    / {refundService.formatCurrency(refund.originalAmount, refund.currency)}
                  </div>
                </TableCell>

                {/* Method */}
                <TableCell className="px-5 py-4 text-start">
                  <span className="text-sm">
                    {refundService.getRefundMethodIcon(refund.refundMethod)}{' '}
                    {refundService.getRefundMethodLabel(refund.refundMethod)}
                  </span>
                </TableCell>

                {/* Reason */}
                <TableCell className="px-5 py-4 text-start">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {refundService.getRefundReasonLabel(refund.refundReasonType)}
                  </span>
                </TableCell>

                {/* Status */}
                <TableCell className="px-5 py-4 text-start">
                  <Badge
                    size="sm"
                    color={refundService.getRefundStatusColor(refund.status) as any}
                  >
                    {refundService.getRefundStatusIcon(refund.status)} {refund.status}
                  </Badge>
                  {refund.retryCount > 0 && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      Retried {refund.retryCount}x
                    </div>
                  )}
                </TableCell>

                {/* Requested */}
                <TableCell className="px-5 py-4 text-start">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {dayjs(refund.requestedDate).format('DD/MM/YYYY')}
                  </div>
                  <div className="text-xs text-gray-400">
                    {dayjs(refund.requestedDate).format('HH:mm')} ({dayjs(refund.requestedDate).fromNow()})
                  </div>
                  <div className="text-xs text-gray-400">
                    by {refund.requestedByName}
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="px-5 py-4 text-start">
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => onViewRefund(refund.id)}
                      className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      title="View Detail"
                    >
                      👁 View
                    </button>

                    {refund.status === 'REQUESTED' && (
                      <>
                        <button
                          onClick={() => onApproveRefund(refund)}
                          className="rounded px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                          title="Approve"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => onRejectRefund(refund)}
                          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          title="Reject"
                        >
                          🚫 Reject
                        </button>
                      </>
                    )}

                    {refund.status === 'APPROVED' && (
                      <button
                        onClick={() => onProcessRefund(refund)}
                        className="rounded px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
                        title="Process"
                      >
                        ⚙️ Process
                      </button>
                    )}

                    {refund.status === 'FAILED' && (
                      <button
                        onClick={() => onRetryRefund(refund)}
                        className="rounded px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
                        title="Retry"
                      >
                        🔄 Retry
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RefundTable;
