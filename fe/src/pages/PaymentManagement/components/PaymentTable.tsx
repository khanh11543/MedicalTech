import React from 'react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../../components/ui/table";
import Badge from "../../../components/ui/badge/Badge";
import dayjs from 'dayjs';

// Types
interface PaymentDTO {
  id: number;
  transactionCode: string;
  paymentDate: string;
  patientName: string;
  doctorName: string;
  appointmentCode: string;
  amount: number;
  paymentMethod: string;
  status: 'PENDING' | 'PAID' | 'INITIATED' | 'PROCESSING' | 'FAILED' | 'REFUNDED' | 'CANCELLED' | 'EXPIRED';
  paymentStatus: string;
  currency: string;
}

interface PaymentTableProps {
  payments: PaymentDTO[];
  loading?: boolean;
  selectedPayments: number[];
  onSelectPayment: (paymentId: number, checked: boolean) => void;
  onViewPayment: (paymentId: number) => void;
  onPrintReceipt: (paymentId: number) => void;
  showSelection?: boolean;
  emptyMessage?: string;
}

const PaymentTable: React.FC<PaymentTableProps> = ({
  payments,
  loading = false,
  selectedPayments,
  onSelectPayment,
  onViewPayment,
  onPrintReceipt,
  showSelection = true,
  emptyMessage = "No payments found",
}) => {
  // Status badge color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'PAID': return 'success';
      case 'INITIATED': return 'info';
      case 'PROCESSING': return 'info';
      case 'FAILED': return 'error';
      case 'REFUNDED': return 'info';
      case 'CANCELLED': return 'light';
      case 'EXPIRED': return 'light';
      default: return 'light';
    }
  };

  // Payment method icon mapping
  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH': return '💵';
      case 'MOMO': return '📱';
      default: return '💳';
    }
  };

  // Payment method label
  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH': return 'Cash';
      case 'MOMO': return 'MoMo';
      default: return method;
    }
  };

  // Check if all visible payments are selected
  // const allSelected = payments.length > 0 && payments.every(payment =>
  //   selectedPayments.includes(payment.id)
  // );

  // Check if some payments are selected (for indeterminate state)
  // const someSelected = payments.some(payment =>
  //   selectedPayments.includes(payment.id)
  // );

  // Handle select all
  // const handleSelectAll = (checked: boolean) => {
  //   onSelectAll(checked);
  // };

  // Handle individual selection
  const handleSelectPayment = (paymentId: number, checked: boolean) => {
    onSelectPayment(paymentId, checked);
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {showSelection && (
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                )}
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  {showSelection && (
                    <TableCell className="px-5 py-4">
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                  )}
                  <TableCell className="px-4 py-3">
                    <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {showSelection && (
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Select
                </TableCell>
              )}
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                ID
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Transaction Code
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Payment Date & Time
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Patient Name
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Doctor Name
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Appointment Code
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Amount
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Payment Method
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Status
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {payments.length === 0 ? (
              <tr>
                <td
                  colSpan={showSelection ? 11 : 10}
                  className="px-5 py-8 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <TableRow
                  key={payment.id}
                  className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {showSelection && (
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <input
                        type="checkbox"
                        checked={selectedPayments.includes(payment.id)}
                        onChange={(e) => handleSelectPayment(payment.id, e.target.checked)}
                        disabled={payment.status !== 'PENDING'}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </TableCell>
                  )}
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {payment.id}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 font-mono">
                    <span className="font-medium">{payment.transactionCode}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    <div className="flex flex-col">
                      <span>{dayjs(payment.paymentDate).format('DD/MM/YYYY')}</span>
                      <span className="text-xs text-gray-400">
                        {dayjs(payment.paymentDate).format('HH:mm')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    <span className="font-medium">{payment.patientName}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    <span className="font-medium">{payment.doctorName}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start">
                    <button
                      onClick={() => onViewPayment(payment.id)}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                    >
                      {payment.appointmentCode}
                    </button>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 text-start text-theme-sm font-medium dark:text-white/90">
                    <div className="flex flex-col">
                      <span>{payment.amount.toLocaleString()}</span>
                      <span className="text-xs text-gray-500">{payment.currency}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getMethodIcon(payment.paymentMethod)}</span>
                      <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                        {getMethodLabel(payment.paymentMethod)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start">
                    <Badge
                      size="sm"
                      color={getStatusColor(payment.status)}
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onViewPayment(payment.id)}
                        className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                        title="View Details"
                      >
                        View
                      </button>
                      <button
                        onClick={() => onPrintReceipt(payment.id)}
                        className="px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition-colors"
                        title="Print Receipt"
                      >
                        Receipt
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PaymentTable;