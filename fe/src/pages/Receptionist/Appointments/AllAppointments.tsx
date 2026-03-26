import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import receptionistService from '../../../services/receptionistService';
import type { ReceptionistAppointmentListDTO } from '../../../services/receptionistService';
import type { RebookData } from './CreateAppointment';
import {
  StatusBadge,
  PaymentBadge,
  EmptyState,
  Pagination,
  QueueBadge,
  ConfirmDialog,
  Toast,
} from './SharedComponents';
import { TableSkeleton } from '../../../components/ui/skeleton/Skeleton';
import { useDebounce } from '../../../hooks/useDebounce';
import ActionMenu from './ActionMenu';
import { ALL_STATUSES } from './constants';
import {
  ConfirmAppointmentModal,
  RescheduleModal,
  CancelAppointmentModal,
} from './PendingActionModals';
import { CheckInModal, SendReminderModal } from './ConfirmedActionModals';
import { NotifyDoctorModal, MarkNoShowModal } from './CheckedInActionModals';
import { ViewInProgressModal } from './InProgressActionModals';
import {
  CollectPaymentModal,
  ReceiptActionsModal,
  CreateFollowUpModal,
} from './CompletedActionModals';
import { ViewReasonModal, RebookModal } from './CancelledNoShowActionModals';
import {
  createPrescriptionPayment,
  initMomoPayment,
  getPaymentQr,
  markPaymentCash,
  getReceptionistPayment,
} from '../../../services/paymentService';
import type { PaymentDTO } from '../../../services/paymentService';

interface AllAppointmentsProps {
  onViewDetail: (id: number) => void;
  onCreateNew: () => void;
  onRebook?: (data: RebookData) => void;
}

export default function AllAppointments({
  onViewDetail,
  onCreateNew,
  onRebook,
}: AllAppointmentsProps) {
  const navigate = useNavigate();
  // Data
  const [appointments, setAppointments] = useState<
    ReceptionistAppointmentListDTO[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('appointmentDate');
  const [sortDir, setSortDir] = useState('DESC');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Selection for bulk actions
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [cancelDialog, setCancelDialog] = useState<{
    ids: number[];
    open: boolean;
  }>({ ids: [], open: false });
  const [cancelReason, setCancelReason] = useState('');
  const [bulkAction, setBulkAction] = useState('');

  // Modal states for PENDING actions
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    appointment: ReceptionistAppointmentListDTO | null;
  }>({ open: false, appointment: null });
  const [rescheduleModal, setRescheduleModal] = useState<{
    open: boolean;
    appointment: ReceptionistAppointmentListDTO | null;
  }>({ open: false, appointment: null });
  const [cancelModal, setCancelModal] = useState<{
    open: boolean;
    appointment: ReceptionistAppointmentListDTO | null;
  }>({ open: false, appointment: null });

  // Modal states for CONFIRMED actions
  const [checkInModal, setCheckInModal] = useState<{
    open: boolean;
    appointment: ReceptionistAppointmentListDTO | null;
  }>({ open: false, appointment: null });
  const [reminderModal, setReminderModal] = useState<{
    open: boolean;
    appointment: ReceptionistAppointmentListDTO | null;
  }>({ open: false, appointment: null });

  // Modal states for CHECKED_IN actions
  const [notifyDoctorModal, setNotifyDoctorModal] = useState<{
    open: boolean;
    appointment: ReceptionistAppointmentListDTO | null;
  }>({ open: false, appointment: null });
  const [noShowModal, setNoShowModal] = useState<{
    open: boolean;
    appointment: ReceptionistAppointmentListDTO | null;
  }>({ open: false, appointment: null });

  // Modal states for IN_PROGRESS actions
  const [viewInProgressModal, setViewInProgressModal] = useState<{
    open: boolean;
    appointment: ReceptionistAppointmentListDTO | null;
  }>({ open: false, appointment: null });

  // Modal states for COMPLETED actions
  const [collectPaymentModal, setCollectPaymentModal] = useState<{
    open: boolean;
    appointment: ReceptionistAppointmentListDTO | null;
  }>({ open: false, appointment: null });
  const [receiptModal, setReceiptModal] = useState<{
    open: boolean;
    appointment: ReceptionistAppointmentListDTO | null;
  }>({ open: false, appointment: null });
  const [followUpModal, setFollowUpModal] = useState<{
    open: boolean;
    appointment: ReceptionistAppointmentListDTO | null;
  }>({ open: false, appointment: null });

  // Modal states for CANCELLED/NO_SHOW actions
  const [viewReasonModal, setViewReasonModal] = useState<{
    open: boolean;
    appointment: ReceptionistAppointmentListDTO | null;
  }>({ open: false, appointment: null });
  const [rebookModal, setRebookModal] = useState<{
    open: boolean;
    appointment: ReceptionistAppointmentListDTO | null;
  }>({ open: false, appointment: null });

  // Rx Payment modal states
  const [rxPaymentModalOpen, setRxPaymentModalOpen] = useState(false);
  const [rxPaymentAppointment, setRxPaymentAppointment] = useState<ReceptionistAppointmentListDTO | null>(null);
  const [rxPaymentStep, setRxPaymentStep] = useState<'select-method' | 'cash-form' | 'momo-qr' | 'success'>('select-method');
  const [rxPaymentLoading, setRxPaymentLoading] = useState(false);
  const [rxInitLoading, setRxInitLoading] = useState(false);
  const [rxPaymentId, setRxPaymentId] = useState<number | null>(null);
  const [rxPaymentDetail, setRxPaymentDetail] = useState<PaymentDTO | null>(null);
  const [rxQrDataUrl, setRxQrDataUrl] = useState('');
  const [rxCashReceived, setRxCashReceived] = useState('');
  const [rxMomoStatus, setRxMomoStatus] = useState<'idle' | 'waiting' | 'success' | 'failed' | 'expired'>('idle');
  const [rxQrCountdown, setRxQrCountdown] = useState(0);
  const rxPollingRef = useRef<ReturnType<typeof setInterval>>(null);
  const rxCountdownRef = useRef<ReturnType<typeof setInterval>>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await receptionistService.getAppointments({
        search: debouncedSearch || undefined,
        statuses: statusFilter.length > 0 ? statusFilter : undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        sortBy,
        sortDir,
        pageNumber: page,
        pageSize,
      });
      setAppointments(data?.content || []);
      setTotalElements(data?.totalElements || 0);
      setTotalPages(data?.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    statusFilter,
    dateFrom,
    dateTo,
    sortBy,
    sortDir,
    page,
    pageSize,
  ]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Save filter state to session
  useEffect(() => {
    sessionStorage.setItem(
      'apt_filters',
      JSON.stringify({
        search,
        statusFilter,
        dateFrom,
        dateTo,
        sortBy,
        sortDir,
        page,
        pageSize,
      })
    );
  }, [search, statusFilter, dateFrom, dateTo, sortBy, sortDir, page, pageSize]);

  // Restore filter state
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('apt_filters');
      if (saved) {
        const f = JSON.parse(saved);
        if (f.search) setSearch(f.search);
        if (f.statusFilter) setStatusFilter(f.statusFilter);
        if (f.dateFrom) setDateFrom(f.dateFrom);
        if (f.dateTo) setDateTo(f.dateTo);
        if (f.sortBy) setSortBy(f.sortBy);
        if (f.sortDir) setSortDir(f.sortDir);
        if (f.pageSize) setPageSize(f.pageSize);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // ==================== SELECTION ====================
  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set());
    } else {
      setSelected(new Set(appointments.map((a) => a.id)));
    }
    setSelectAll(!selectAll);
  };

  // ==================== ACTIONS ====================
  const handleAction = async (
    action: string,
    apt: ReceptionistAppointmentListDTO
  ) => {
    switch (action) {
      case 'VIEW':
        if (apt.status === 'IN_PROGRESS') {
          setViewInProgressModal({ open: true, appointment: apt });
        } else {
          onViewDetail(apt.id);
        }
        break;
      case 'CONFIRM':
        setConfirmModal({ open: true, appointment: apt });
        break;
      case 'CHECK_IN':
        setCheckInModal({ open: true, appointment: apt });
        break;
      case 'CANCEL':
        setCancelModal({ open: true, appointment: apt });
        break;
      case 'RESCHEDULE':
        setRescheduleModal({ open: true, appointment: apt });
        break;
      case 'SEND_REMINDER':
        setReminderModal({ open: true, appointment: apt });
        break;
      case 'PRINT_SLIP':
        try {
          setActionLoading(apt.id);
          const blob = await receptionistService.printCheckInSlip(apt.id);
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        } catch {
          setToast({ message: 'Failed to generate slip', type: 'error' });
        } finally {
          setActionLoading(null);
        }
        break;
      case 'MARK_NO_SHOW':
        setNoShowModal({ open: true, appointment: apt });
        break;
      case 'CREATE_FOLLOW_UP':
        setFollowUpModal({ open: true, appointment: apt });
        break;
      case 'REBOOK':
        setRebookModal({ open: true, appointment: apt });
        break;
      case 'VIEW_REASON':
        setViewReasonModal({ open: true, appointment: apt });
        break;
      case 'COLLECT_PAYMENT':
        // Guard: if already paid, show receipt instead
        if (apt.paymentStatus === 'PAID') {
          setReceiptModal({ open: true, appointment: apt });
        } else {
          setCollectPaymentModal({ open: true, appointment: apt });
        }
        break;
      case 'RECEIPT':
        setReceiptModal({ open: true, appointment: apt });
        break;
      case 'VIEW_QUEUE':
        navigate('/receptionist/queue');
        break;
      case 'NOTIFY_DOCTOR':
        setNotifyDoctorModal({ open: true, appointment: apt });
        break;
      case 'COLLECT_RX_PAYMENT':
        setRxPaymentAppointment(apt);
        setRxPaymentModalOpen(true);
        break;
      default:
        onViewDetail(apt.id);
    }
  };

  // ==================== BULK ACTIONS ====================
  const handleBulkAction = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    switch (bulkAction) {
      case 'confirm':
        try {
          setLoading(true);
          const result = await receptionistService.bulkConfirm(ids);
          setToast({
            message: `${result.successCount} confirmed, ${result.failCount} failed`,
            type: result.failCount > 0 ? 'info' : 'success',
          });
          setAppointments((prev) =>
            prev.map((a) =>
              ids.includes(a.id) ? { ...a, status: 'CONFIRMED' } : a
            )
          );
          setSelected(new Set());
        } catch {
          setToast({ message: 'Bulk confirm failed', type: 'error' });
        }
        break;
      case 'reminder':
        try {
          setLoading(true);
          const result = await receptionistService.bulkSendReminders(ids);
          setToast({
            message: `${result.successCount} reminders sent (quota: ${result.quotaRemaining}/${result.quotaLimit})`,
            type: 'success',
          });
          setSelected(new Set());
        } catch {
          setToast({ message: 'Bulk reminder failed', type: 'error' });
        } finally {
          setLoading(false);
        }
        break;
      case 'cancel':
        setCancelDialog({ ids, open: true });
        break;
      case 'export':
        handleExport();
        break;
    }
    setBulkAction('');
  };

  const handleCancelConfirm = async () => {
    if (!cancelReason.trim()) {
      setToast({ message: 'Cancellation reason is required', type: 'error' });
      return;
    }
    try {
      setLoading(true);
      const result = await receptionistService.bulkCancel(
        cancelDialog.ids,
        cancelReason
      );
      setToast({
        message: `${result.successCount} cancelled`,
        type: 'success',
      });
      setAppointments((prev) =>
        prev.map((a) =>
          cancelDialog.ids.includes(a.id) ? { ...a, status: 'CANCELLED' } : a
        )
      );
      setCancelDialog({ ids: [], open: false });
      setCancelReason('');
      setSelected(new Set());
    } catch {
      setToast({ message: 'Cancellation failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await receptionistService.exportAppointments({
        statuses: statusFilter.length > 0 ? statusFilter : undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        format: 'CSV',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appointments_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ message: 'Export failed', type: 'error' });
    }
  };

  // =========== RX PAYMENT: INIT ON OPEN ===========
  useEffect(() => {
    if (!rxPaymentModalOpen || !rxPaymentAppointment?.prescriptionId) {
      setRxPaymentStep('select-method');
      setRxPaymentDetail(null);
      setRxPaymentId(null);
      setRxQrDataUrl('');
      setRxCashReceived('');
      setRxMomoStatus('idle');
      setRxQrCountdown(0);
      if (rxPollingRef.current) clearInterval(rxPollingRef.current);
      if (rxCountdownRef.current) clearInterval(rxCountdownRef.current);
      return;
    }
    const init = async () => {
      try {
        setRxInitLoading(true);
        const payment = await createPrescriptionPayment({
          prescriptionId: rxPaymentAppointment.prescriptionId!,
          paymentMethod: 'CASH',
        });
        setRxPaymentDetail(payment);
        setRxPaymentId(payment.id);
      } catch (err: unknown) {
        const error = err as { response?: { status?: number } };
        if (error?.response?.status === 409) {
          setToast({ message: 'Prescription already paid', type: 'error' });
        } else {
          setToast({ message: 'Failed to initialize prescription payment', type: 'error' });
        }
        setRxPaymentModalOpen(false);
      } finally {
        setRxInitLoading(false);
      }
    };
    init();
    return () => {
      if (rxPollingRef.current) clearInterval(rxPollingRef.current);
      if (rxCountdownRef.current) clearInterval(rxCountdownRef.current);
    };
  }, [rxPaymentModalOpen, rxPaymentAppointment]); // eslint-disable-line react-hooks/exhaustive-deps

  // =========== RX PAYMENT HANDLERS ===========
  const rxTotalAmount = rxPaymentDetail?.totalAmount || rxPaymentDetail?.amount || 0;
  const rxChange = rxCashReceived ? Math.max(0, parseFloat(rxCashReceived) - rxTotalAmount) : 0;

  const handleRxPayCash = () => {
    setRxPaymentStep('cash-form');
  };

  const handleRxConfirmCash = async () => {
    if (!rxPaymentId) return;
    setRxPaymentLoading(true);
    try {
      const received = parseFloat(rxCashReceived) || 0;
      await markPaymentCash(rxPaymentId, {
        amountReceived: received,
        changeGiven: Math.max(0, received - rxTotalAmount),
      });
      setRxPaymentStep('success');
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error?.response?.status === 409) {
        setToast({ message: 'Payment already collected', type: 'error' });
        setRxPaymentModalOpen(false);
      } else {
        const msg = err instanceof Error ? err.message : 'Cash payment failed. Please try again.';
        setToast({ message: msg, type: 'error' });
      }
    } finally {
      setRxPaymentLoading(false);
    }
  };

  const handleRxPayMomo = async () => {
    if (!rxPaymentId) return;
    setRxPaymentLoading(true);
    try {
      setRxMomoStatus('waiting');
      const initResult = await initMomoPayment(rxPaymentId);
      if (initResult.qrCodeUrl) {
        setRxQrDataUrl(initResult.qrCodeUrl);
      } else if (initResult.payUrl) {
        try {
          const qrResult = await getPaymentQr(rxPaymentId);
          setRxQrDataUrl(qrResult.qrDataUrl || '');
        } catch {
          setRxQrDataUrl('');
        }
      }
      setRxPaymentStep('momo-qr');
      // Start countdown (5 min)
      setRxQrCountdown(300);
      if (rxCountdownRef.current) clearInterval(rxCountdownRef.current);
      rxCountdownRef.current = setInterval(() => {
        setRxQrCountdown(prev => {
          if (prev <= 1) {
            if (rxCountdownRef.current) clearInterval(rxCountdownRef.current);
            setRxMomoStatus('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      // Start polling
      rxStartPolling();
    } catch {
      setToast({ message: 'Failed to initialize MoMo payment', type: 'error' });
      setRxMomoStatus('failed');
    } finally {
      setRxPaymentLoading(false);
    }
  };

  const rxStartPolling = useCallback(() => {
    if (rxPollingRef.current) clearInterval(rxPollingRef.current);
    rxPollingRef.current = setInterval(async () => {
      if (!rxPaymentId) return;
      try {
        const pd: PaymentDTO = await getReceptionistPayment(rxPaymentId);
        if (pd.status === 'PAID' || pd.paymentStatus === 'PAID') {
          setRxMomoStatus('success');
          setRxPaymentDetail(pd);
          if (rxPollingRef.current) clearInterval(rxPollingRef.current);
          if (rxCountdownRef.current) clearInterval(rxCountdownRef.current);
          setTimeout(() => setRxPaymentStep('success'), 1500);
        } else if (['FAILED', 'CANCELLED', 'EXPIRED'].includes(pd.status)) {
          setRxMomoStatus('failed');
          if (rxPollingRef.current) clearInterval(rxPollingRef.current);
          if (rxCountdownRef.current) clearInterval(rxCountdownRef.current);
        }
      } catch { /* continue polling */ }
    }, 3000);
  }, [rxPaymentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRxSuccessClose = () => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === rxPaymentAppointment?.id ? { ...a, prescriptionPaymentStatus: 'PAID' } : a
      )
    );
    setRxPaymentModalOpen(false);
    setToast({ message: 'Prescription payment collected successfully!', type: 'success' });
  };

  const rxFormatCurrency = (amount: number | undefined | null) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortDir('ASC');
    }
    setPage(0);
  };

  const SortIcon = ({ field }: { field: string }) => (
    <span className='ml-1 text-gray-400'>
      {sortBy === field ? (sortDir === 'ASC' ? '↑' : '↓') : '↕'}
    </span>
  );

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
    setPage(0);
  };

  return (
    <div className='space-y-4'>
      {/* Filters */}
      <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
          {/* Search */}
          <div className='relative'>
            <svg
              className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
            <input
              type='text'
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder='Search code, patient, phone...'
              className='w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent'
            />
          </div>
          {/* Date from */}
          <input
            type='date'
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(0);
            }}
            className='px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500'
            placeholder='From date'
          />
          {/* Date to */}
          <input
            type='date'
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(0);
            }}
            className='px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500'
            placeholder='To date'
          />
          {/* Clear filters */}
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter([]);
              setDateFrom('');
              setDateTo('');
              setPage(0);
              sessionStorage.removeItem('apt_filters');
            }}
            className='px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
          >
            Clear filters
          </button>
        </div>
        {/* Status pills */}
        <div className='flex flex-wrap gap-2 mt-3'>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => toggleStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter.includes(s)
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className='bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl px-4 py-3 flex items-center justify-between'>
          <span className='text-sm font-medium text-brand-700 dark:text-brand-300'>
            {selected.size} selected
          </span>
          <div className='flex items-center gap-2'>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className='px-3 py-1.5 rounded-lg border border-brand-300 dark:border-brand-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white'
            >
              <option value=''>Select action...</option>
              <option value='confirm'>Confirm selected</option>
              <option value='reminder'>Send reminders</option>
              <option value='cancel'>Cancel selected</option>
              <option value='export'>Export selected</option>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction}
              className='px-4 py-1.5 bg-brand-500 text-white rounded-lg text-sm hover:bg-brand-600 disabled:opacity-50 transition-colors'
            >
              Apply
            </button>
            <button
              onClick={() => {
                setSelected(new Set());
                setSelectAll(false);
              }}
              className='px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden'>
        {loading && !appointments.length ? (
          <TableSkeleton rows={pageSize} cols={9} />
        ) : appointments.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50 dark:bg-gray-900/50'>
                  <tr>
                    <th className='px-3 py-3 text-left'>
                      <input
                        type='checkbox'
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className='w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500'
                      />
                    </th>
                    <th
                      className='px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase cursor-pointer'
                      onClick={() => handleSort('appointmentCode')}
                    >
                      Code <SortIcon field='appointmentCode' />
                    </th>
                    <th
                      className='px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase cursor-pointer'
                      onClick={() => handleSort('appointmentDate')}
                    >
                      Date/Time <SortIcon field='appointmentDate' />
                    </th>
                    <th className='px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase'>
                      Patient
                    </th>
                    <th className='px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase'>
                      Doctor / Room
                    </th>
                    <th className='px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase'>
                      Type
                    </th>
                    <th
                      className='px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase cursor-pointer'
                      onClick={() => handleSort('status')}
                    >
                      Status <SortIcon field='status' />
                    </th>
                    <th className='px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase'>
                      Queue
                    </th>
                    <th className='px-3 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase'>
                      Fee
                    </th>
                    <th className='px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase'>
                      Payment
                    </th>
                    <th className='px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase'>
                      Rx Payment
                    </th>
                    <th className='px-3 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase min-w-[220px]'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                  {appointments.map((apt) => (
                    <tr
                      key={apt.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selected.has(apt.id) ? 'bg-brand-50 dark:bg-brand-900/10' : ''}`}
                    >
                      <td className='px-3 py-3'>
                        <input
                          type='checkbox'
                          checked={selected.has(apt.id)}
                          onChange={() => toggleSelect(apt.id)}
                          className='w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500'
                        />
                      </td>
                      <td className='px-3 py-3'>
                        <button
                          onClick={() => onViewDetail(apt.id)}
                          className='text-sm font-mono text-brand-600 dark:text-brand-400 hover:underline'
                        >
                          {apt.appointmentCode || `#${apt.id}`}
                        </button>
                      </td>
                      <td className='px-3 py-3'>
                        <div className='text-sm text-gray-900 dark:text-white'>
                          {apt.appointmentDate}
                        </div>
                        <div className='text-xs text-gray-500 dark:text-gray-400'>
                          {apt.startTime} – {apt.endTime}
                        </div>
                      </td>
                      <td className='px-3 py-3'>
                        <div className='text-sm font-medium text-gray-900 dark:text-white'>
                          {apt.patientName}
                        </div>
                        <div className='text-xs text-gray-500 dark:text-gray-400'>
                          {apt.maskedPhone}
                        </div>
                      </td>
                      <td className='px-3 py-3'>
                        <div className='text-sm text-gray-900 dark:text-white'>
                          {apt.doctorName}
                        </div>
                        <div className='text-xs text-gray-500 dark:text-gray-400'>
                          {apt.doctorSpecialization}
                        </div>
                      </td>
                      <td className='px-3 py-3 text-sm text-gray-600 dark:text-gray-400'>
                        {apt.appointmentType || 'Consultation'}
                      </td>
                      <td className='px-3 py-3'>
                        <StatusBadge status={apt.status} />
                      </td>
                      <td className='px-3 py-3 text-center'>
                        <QueueBadge number={apt.queueNumber} />
                      </td>
                      <td className='px-3 py-3 text-right text-sm text-gray-900 dark:text-white'>
                        {apt.fee ? `${apt.fee.toLocaleString()} VND` : '—'}
                      </td>
                      <td className='px-3 py-3 text-center'>
                        <PaymentBadge status={apt.paymentStatus} />
                      </td>
                      <td className='px-3 py-3 text-center'>
                        {apt.prescriptionId ? (
                          <PaymentBadge status={apt.prescriptionPaymentStatus} />
                        ) : (
                          <span className='text-xs text-gray-400'>—</span>
                        )}
                      </td>
                      <td className='px-3 py-3'>
                        {actionLoading === apt.id ? (
                          <div className='w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto' />
                        ) : (
                          <ActionMenu
                            appointment={apt}
                            onAction={handleAction}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(0);
              }}
            />
          </>
        )}
      </div>

      {/* Cancel dialog */}
      <ConfirmDialog
        isOpen={cancelDialog.open}
        title='Cancel Appointment'
        message={`Cancel ${cancelDialog.ids.length} appointment(s)? This action requires a reason.`}
        confirmLabel='Cancel Appointment'
        variant='danger'
        onConfirm={handleCancelConfirm}
        onCancel={() => {
          setCancelDialog({ ids: [], open: false });
          setCancelReason('');
        }}
      >
        <textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder='Enter cancellation reason (required)...'
          className='w-full mt-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none'
          rows={3}
        />
      </ConfirmDialog>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── CANCELLED/NO_SHOW Action Modals ── */}
      <ViewReasonModal
        isOpen={viewReasonModal.open}
        appointment={viewReasonModal.appointment}
        onClose={() => setViewReasonModal({ open: false, appointment: null })}
      />
      <RebookModal
        isOpen={rebookModal.open}
        appointment={rebookModal.appointment}
        onClose={() => setRebookModal({ open: false, appointment: null })}
        onRebook={(data) => {
          if (onRebook) {
            onRebook(data);
          } else {
            onCreateNew();
          }
        }}
      />

      {/* ── COMPLETED Action Modals ── */}
      <CollectPaymentModal
        isOpen={collectPaymentModal.open}
        appointment={collectPaymentModal.appointment}
        onClose={() =>
          setCollectPaymentModal({ open: false, appointment: null })
        }
        onSuccess={(msg) => {
          setToast({ message: msg, type: 'success' });
        }}
        onError={(msg) => setToast({ message: msg, type: 'error' })}
        onRefresh={() => {
          setAppointments((prev) =>
            prev.map((a) =>
              a.id === collectPaymentModal.appointment?.id
                ? { ...a, paymentStatus: 'PAID' }
                : a
            )
          );
        }}
      />
      <ReceiptActionsModal
        isOpen={receiptModal.open}
        appointment={receiptModal.appointment}
        onClose={() => setReceiptModal({ open: false, appointment: null })}
        onError={(msg) => setToast({ message: msg, type: 'error' })}
      />
      <CreateFollowUpModal
        isOpen={followUpModal.open}
        appointment={followUpModal.appointment}
        onClose={() => setFollowUpModal({ open: false, appointment: null })}
        onSuccess={(msg) => {
          setToast({ message: msg, type: 'success' });
        }}
        onError={(msg) => setToast({ message: msg, type: 'error' })}
      />

      {/* ── IN_PROGRESS Action Modals ── */}
      <ViewInProgressModal
        isOpen={viewInProgressModal.open}
        appointment={viewInProgressModal.appointment}
        onClose={() =>
          setViewInProgressModal({ open: false, appointment: null })
        }
      />

      {/* ── CHECKED_IN Action Modals ── */}
      <NotifyDoctorModal
        isOpen={notifyDoctorModal.open}
        appointment={notifyDoctorModal.appointment}
        onClose={() => setNotifyDoctorModal({ open: false, appointment: null })}
        onSuccess={(msg) => {
          setToast({ message: msg, type: 'success' });
        }}
        onError={(msg) => setToast({ message: msg, type: 'error' })}
      />
      <MarkNoShowModal
        isOpen={noShowModal.open}
        appointment={noShowModal.appointment}
        onClose={() => setNoShowModal({ open: false, appointment: null })}
        onSuccess={(msg) => {
          setToast({ message: msg, type: 'success' });
          setAppointments((prev) =>
            prev.map((a) =>
              a.id === noShowModal.appointment?.id
                ? { ...a, status: 'NO_SHOW' }
                : a
            )
          );
        }}
        onError={(msg) => setToast({ message: msg, type: 'error' })}
      />

      {/* ── CONFIRMED Action Modals ── */}
      <CheckInModal
        isOpen={checkInModal.open}
        appointment={checkInModal.appointment}
        onClose={() => setCheckInModal({ open: false, appointment: null })}
        onSuccess={(msg) => {
          setToast({ message: msg, type: 'success' });
          setAppointments((prev) =>
            prev.map((a) =>
              a.id === checkInModal.appointment?.id
                ? { ...a, status: 'CHECKED_IN' }
                : a
            )
          );
        }}
        onError={(msg) => setToast({ message: msg, type: 'error' })}
      />
      <SendReminderModal
        isOpen={reminderModal.open}
        appointment={reminderModal.appointment}
        onClose={() => setReminderModal({ open: false, appointment: null })}
        onSuccess={(msg) => {
          setToast({ message: msg, type: 'success' });
        }}
        onError={(msg) => setToast({ message: msg, type: 'error' })}
      />

      {/* ── PENDING Action Modals ── */}
      <ConfirmAppointmentModal
        isOpen={confirmModal.open}
        appointment={confirmModal.appointment}
        onClose={() => setConfirmModal({ open: false, appointment: null })}
        onSuccess={(msg) => {
          setToast({ message: msg, type: 'success' });
          setAppointments((prev) =>
            prev.map((a) =>
              a.id === confirmModal.appointment?.id
                ? { ...a, status: 'CONFIRMED' }
                : a
            )
          );
        }}
        onError={(msg) => setToast({ message: msg, type: 'error' })}
      />
      <RescheduleModal
        isOpen={rescheduleModal.open}
        appointment={rescheduleModal.appointment}
        onClose={() => {
          setRescheduleModal({ open: false, appointment: null });
          fetchAppointments();
        }}
        onSuccess={(msg) => {
          setToast({ message: msg, type: 'success' });
          setAppointments((prev) =>
            prev.map((a) =>
              a.id === rescheduleModal.appointment?.id
                ? { ...a, status: 'RESCHEDULED' }
                : a
            )
          );
        }}
        onError={(msg) => setToast({ message: msg, type: 'error' })}
      />
      <CancelAppointmentModal
        isOpen={cancelModal.open}
        appointment={cancelModal.appointment}
        onClose={() => setCancelModal({ open: false, appointment: null })}
        onSuccess={(msg) => {
          setToast({ message: msg, type: 'success' });
          setAppointments((prev) =>
            prev.map((a) =>
              a.id === cancelModal.appointment?.id
                ? { ...a, status: 'CANCELLED' }
                : a
            )
          );
        }}
        onError={(msg) => setToast({ message: msg, type: 'error' })}
      />

      {/* Rx Payment Modal */}
      {rxPaymentModalOpen && rxPaymentAppointment && (
        <div className='fixed inset-0 z-[99999] flex items-center justify-center p-4'>
          <div className='absolute inset-0 bg-black/50 backdrop-blur-sm' onClick={() => rxPaymentStep !== 'success' && setRxPaymentModalOpen(false)} />
          <div className='relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden'>
            {/* Header */}
            <div className='bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center'>
                    <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                    </svg>
                  </div>
                  <div>
                    <h3 className='text-lg font-bold text-white'>Collect Prescription Payment</h3>
                    <p className='text-emerald-100 text-xs'>{rxPaymentAppointment.appointmentCode}</p>
                  </div>
                </div>
                {rxPaymentStep !== 'success' && (
                  <button onClick={() => setRxPaymentModalOpen(false)} className='text-white/80 hover:text-white transition-colors'>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Init loading */}
            {rxInitLoading && (
              <div className='px-6 py-12 text-center'>
                <div className='w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3' />
                <p className='text-sm text-gray-500 dark:text-gray-400'>Initializing prescription payment...</p>
              </div>
            )}

            {/* Step: Method Selection */}
            {!rxInitLoading && rxPaymentStep === 'select-method' && (
              <div className='px-6 py-5 space-y-4'>
                <div className='bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='text-sm font-semibold text-gray-900 dark:text-white'>{rxPaymentAppointment.patientName}</p>
                      <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>{rxPaymentAppointment.doctorName} &bull; {rxPaymentAppointment.doctorSpecialization}</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-lg font-bold text-emerald-600 dark:text-emerald-400'>{rxFormatCurrency(rxTotalAmount)}</p>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>Amount due</p>
                    </div>
                  </div>
                </div>
                <div className='space-y-2'>
                  <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>Choose payment method</p>
                  <div className='grid grid-cols-2 gap-3'>
                    <button
                      onClick={handleRxPayCash}
                      className='p-4 rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:border-green-400 dark:hover:border-green-600 transition-all group'
                    >
                      <div className='text-center'>
                        <div className='w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform'>
                          <svg className='w-6 h-6 text-green-600 dark:text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' />
                          </svg>
                        </div>
                        <p className='text-sm font-bold text-green-700 dark:text-green-300'>Cash</p>
                        <p className='text-xs text-green-600/70 dark:text-green-400/70 mt-0.5'>Instant processing</p>
                      </div>
                    </button>
                    <button
                      onClick={() => { handleRxPayMomo(); }}
                      className='p-4 rounded-xl border-2 border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-900/20 hover:border-pink-400 dark:hover:border-pink-600 transition-all group'
                    >
                      <div className='text-center'>
                        <div className='w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform'>
                          <svg className='w-6 h-6 text-pink-600 dark:text-pink-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' />
                          </svg>
                        </div>
                        <p className='text-sm font-bold text-pink-700 dark:text-pink-300'>MoMo</p>
                        <p className='text-xs text-pink-600/70 dark:text-pink-400/70 mt-0.5'>QR code scan</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Cash Form */}
            {!rxInitLoading && rxPaymentStep === 'cash-form' && (
              <div className='px-6 py-5 space-y-4'>
                <button onClick={() => setRxPaymentStep('select-method')} className='flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                  </svg>
                  Back
                </button>
                <div className='bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center'>
                  <p className='text-xs text-green-600 dark:text-green-400 font-medium uppercase'>Amount Due</p>
                  <p className='text-3xl font-bold text-green-700 dark:text-green-300 mt-1'>{rxFormatCurrency(rxTotalAmount)}</p>
                </div>
                <div className='space-y-3'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Amount Received</label>
                    <input
                      type='number'
                      value={rxCashReceived}
                      onChange={e => setRxCashReceived(e.target.value)}
                      placeholder={rxTotalAmount.toLocaleString()}
                      className='w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-transparent'
                    />
                  </div>
                  {rxCashReceived && parseFloat(rxCashReceived) > 0 && (
                    <div className='flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg'>
                      <span className='text-sm text-amber-700 dark:text-amber-300'>Change</span>
                      <span className='text-lg font-bold text-amber-700 dark:text-amber-300'>{rxFormatCurrency(rxChange)}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleRxConfirmCash}
                  disabled={rxPaymentLoading || !rxCashReceived || parseFloat(rxCashReceived) < rxTotalAmount}
                  className='w-full py-3 text-sm font-bold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/25'
                >
                  {rxPaymentLoading ? (
                    <span className='flex items-center justify-center gap-2'>
                      <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                      Processing...
                    </span>
                  ) : (
                    `Confirm Cash Payment — ${rxFormatCurrency(rxTotalAmount)}`
                  )}
                </button>
              </div>
            )}

            {/* Step: MoMo QR */}
            {!rxInitLoading && rxPaymentStep === 'momo-qr' && (
              <div className='px-6 py-5 space-y-4'>
                <button onClick={() => { setRxPaymentStep('select-method'); setRxMomoStatus('idle'); if (rxPollingRef.current) clearInterval(rxPollingRef.current); if (rxCountdownRef.current) clearInterval(rxCountdownRef.current); }} className='flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                  </svg>
                  Back
                </button>
                <div className='text-center'>
                  <p className='text-xs text-pink-600 dark:text-pink-400 font-medium uppercase'>Scan to Pay</p>
                  <p className='text-2xl font-bold text-gray-900 dark:text-white mt-1'>{rxFormatCurrency(rxTotalAmount)}</p>
                </div>

                {/* QR waiting */}
                {rxMomoStatus === 'waiting' && rxQrDataUrl && (
                  <div className='space-y-3'>
                    <div className='bg-white dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600 flex justify-center'>
                      <img src={rxQrDataUrl} alt='MoMo QR' className='w-48 h-48 object-contain' />
                    </div>
                    <div className='flex justify-between items-center text-sm'>
                      <span className='text-gray-500 dark:text-gray-400'>Expires in</span>
                      <span className={`font-mono font-bold ${rxQrCountdown < 60 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                        {Math.floor(rxQrCountdown / 60)}:{String(rxQrCountdown % 60).padStart(2, '0')}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 justify-center'>
                      <div className='w-2 h-2 bg-pink-500 rounded-full animate-pulse' />
                      <span className='text-xs text-gray-500 dark:text-gray-400'>Waiting for payment...</span>
                    </div>
                  </div>
                )}

                {/* MoMo loading */}
                {(rxMomoStatus === 'idle' || (rxMomoStatus === 'waiting' && !rxQrDataUrl)) && (
                  <div className='text-center py-8'>
                    <div className='w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3' />
                    <p className='text-sm text-gray-500 dark:text-gray-400'>Generating QR code...</p>
                  </div>
                )}

                {/* MoMo success */}
                {rxMomoStatus === 'success' && (
                  <div className='text-center py-6'>
                    <div className='w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3'>
                      <svg className='w-8 h-8 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                      </svg>
                    </div>
                    <p className='text-lg font-bold text-green-600'>Payment Received!</p>
                  </div>
                )}

                {/* MoMo expired */}
                {rxMomoStatus === 'expired' && (
                  <div className='text-center py-6 space-y-3'>
                    <div className='w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto'>
                      <svg className='w-7 h-7 text-orange-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                    </div>
                    <p className='text-sm font-bold text-orange-600'>QR Code Expired</p>
                    <div className='flex justify-center gap-2'>
                      <button onClick={() => handleRxPayMomo()} disabled={rxPaymentLoading} className='px-4 py-2 text-xs font-semibold text-white bg-pink-500 rounded-lg hover:bg-pink-600 disabled:opacity-50'>
                        {rxPaymentLoading ? 'Refreshing...' : 'New QR Code'}
                      </button>
                      <button onClick={() => { setRxPaymentStep('cash-form'); setRxMomoStatus('idle'); if (rxPollingRef.current) clearInterval(rxPollingRef.current); }} className='px-4 py-2 text-xs font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600'>
                        Switch to Cash
                      </button>
                    </div>
                  </div>
                )}

                {/* MoMo failed */}
                {rxMomoStatus === 'failed' && (
                  <div className='text-center py-6 space-y-3'>
                    <div className='w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto'>
                      <svg className='w-7 h-7 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                      </svg>
                    </div>
                    <p className='text-sm font-bold text-red-600'>Payment Failed</p>
                    <div className='flex justify-center gap-2'>
                      <button onClick={() => handleRxPayMomo()} disabled={rxPaymentLoading} className='px-4 py-2 text-xs font-semibold text-white bg-pink-500 rounded-lg hover:bg-pink-600 disabled:opacity-50'>
                        Retry MoMo
                      </button>
                      <button onClick={() => { setRxPaymentStep('cash-form'); setRxMomoStatus('idle'); }} className='px-4 py-2 text-xs font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600'>
                        Switch to Cash
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step: Success */}
            {rxPaymentStep === 'success' && (
              <div className='px-6 py-8 text-center space-y-4'>
                <div className='w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto'>
                  <svg className='w-10 h-10 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                  </svg>
                </div>
                <div>
                  <h4 className='text-xl font-bold text-gray-900 dark:text-white'>Prescription Payment Collected!</h4>
                  <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                    {rxFormatCurrency(rxTotalAmount)} received via {rxPaymentStep === 'success' && rxPaymentDetail?.paymentMethod === 'MOMO' ? 'MoMo' : 'Cash'}
                  </p>
                </div>
                <div className='bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3'>
                  <div className='grid grid-cols-2 gap-2 text-sm'>
                    <div className='text-left'>
                      <p className='text-gray-500 dark:text-gray-400'>Patient</p>
                      <p className='font-medium text-gray-900 dark:text-white'>{rxPaymentAppointment.patientName}</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-gray-500 dark:text-gray-400'>Code</p>
                      <p className='font-mono font-medium text-gray-900 dark:text-white'>{rxPaymentAppointment.appointmentCode}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleRxSuccessClose}
                  className='w-full py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors'
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
