import { useState, useMemo, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import Toast from '../../components/common/Toast';
import { useToast } from '../../hooks/useToast';
import PendingConfirmationTable from '../../components/tables/PendingConfirmationTable';
import RescheduleModal from '../../components/modals/RescheduleModal';
import CancelModal from '../../components/modals/CancelModal';
import appointmentService, {
  AppointmentDTO,
  CancelDTO,
  RescheduleDTO,
  AppointmentStatus,
} from '../../services/appointmentService';

export default function DoctorAppointmentsPending() {
  // Toast notification
  const { toast, showToast, dismissToast } = useToast();

  // Data fetching states
  const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [overdueDaysOnly, setOverdueDaysOnly] = useState(false);

  // Reschedule modal states
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] =
    useState<AppointmentDTO | null>(null);

  // Cancel modal states
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] =
    useState<AppointmentDTO | null>(null);

  // Fetch appointments from API
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentService.getDoctorAppointments({
        status: AppointmentStatus.PENDING,
        pageNumber: 0,
        pageSize: 100,
      });
      setAppointments(response.content || []);
    } catch (err) {
      const axiosErr = err as any;
      const errorMessage =
        axiosErr?.response?.data?.message ||
        axiosErr?.response?.data?.error ||
        (err instanceof Error ? err.message : 'Failed to fetch pending appointments');
      setError(errorMessage);
      console.error('Error fetching pending appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Calculate hours since created
  const calculateHoursSinceCreated = (createdAt: string): number => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    return diffHours;
  };

  // Process data: search filter, overdue filter
  const processedAppointments = useMemo(() => {
    let result = [...appointments];

    // Search filter - search across multiple fields
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (apt) =>
          apt.patientName.toLowerCase().includes(query) ||
          apt.patientEmail.toLowerCase().includes(query) ||
          apt.patientPhone.toLowerCase().includes(query) ||
          apt.doctorName.toLowerCase().includes(query) ||
          apt.appointmentCode.toLowerCase().includes(query) ||
          (apt.reasonForVisit &&
            apt.reasonForVisit.toLowerCase().includes(query)) ||
          (apt.symptoms && apt.symptoms.toLowerCase().includes(query))
      );
    }

    // Overdue filter (> 24 hours)
    if (overdueDaysOnly) {
      result = result.filter(
        (apt) => calculateHoursSinceCreated(apt.createdAt) > 24
      );
    }

    return result;
  }, [appointments, searchQuery, overdueDaysOnly]);

  // Statistics
  const stats = useMemo(() => {
    const total = appointments.length;
    const overdue = appointments.filter(
      (apt) => calculateHoursSinceCreated(apt.createdAt) > 24
    ).length;

    return { total, overdue };
  }, [appointments]);

  const handleRetry = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentService.getDoctorAppointments({
        status: AppointmentStatus.PENDING,
        pageNumber: 0,
        pageSize: 100,
      });
      setAppointments(response.content || []);
    } catch (err) {
      const axiosErr = err as any;
      const errorMessage =
        axiosErr?.response?.data?.message ||
        axiosErr?.response?.data?.error ||
        (err instanceof Error ? err.message : 'Failed to fetch pending appointments');
      setError(errorMessage);
      console.error('Error fetching pending appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (appointment: AppointmentDTO) => {
    try {
      await appointmentService.confirmAppointment(appointment.id);
      showToast(`Appointment confirmed successfully`, 'success');
      // Remove from list
      setAppointments(appointments.filter((apt) => apt.id !== appointment.id));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to confirm appointment';
      showToast(errorMessage, 'error');
    }
  };

  const handleCancel = (appointment: AppointmentDTO) => {
    setAppointmentToCancel(appointment);
    setIsCancelModalOpen(true);
  };

  const handleCloseCancelModal = () => {
    setIsCancelModalOpen(false);
    setAppointmentToCancel(null);
  };

  const handleCancelSubmit = async (data: CancelDTO) => {
    if (!appointmentToCancel) return;

    try {
      await appointmentService.cancelAppointmentAsDoctor(
        appointmentToCancel.id,
        data
      );
      showToast(`Appointment cancelled successfully`, 'success');
      // Remove from list
      setAppointments(
        appointments.filter((apt) => apt.id !== appointmentToCancel.id)
      );
      handleCloseCancelModal();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to cancel appointment';
      showToast(errorMessage, 'error');
    }
  };

  const handleReschedule = async (appointment: AppointmentDTO) => {
    setAppointmentToReschedule(appointment);
    setIsRescheduleModalOpen(true);
  };

  const handleCloseRescheduleModal = () => {
    setIsRescheduleModalOpen(false);
    setAppointmentToReschedule(null);
    fetchAppointments();
  };

  const handleRescheduleSubmit = async (data: RescheduleDTO) => {
    if (!appointmentToReschedule) return;

    try {
      setRescheduleLoading(true);
      await appointmentService.rescheduleAppointment(
        appointmentToReschedule.id,
        data
      );
      showToast(
        `Appointment rescheduled successfully to ${data.newDate} at ${data.newStartTime}`,
        'success'
      );
      // Remove from list
      setAppointments(
        appointments.filter((apt) => apt.id !== appointmentToReschedule.id)
      );
      handleCloseRescheduleModal();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to reschedule appointment';
      showToast(errorMessage, 'error');
    } finally {
      setRescheduleLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title='Pending Confirm Appointments | Doctor Panel'
        description='Manage appointments pending your confirmation'
      />
      <PageBreadcrumb pageTitle='Pending Confirmations' />

      <div className='space-y-6'>
        {/* Header Section */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
              Pending Confirmations
            </h2>
            <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
              Review and confirm appointment requests
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-24'>
            <div className='flex flex-col items-center justify-center gap-4'>
              <svg
                className='w-12 h-12 animate-spin text-blue-600 dark:text-blue-400'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
              <p className='text-lg font-medium text-gray-600 dark:text-gray-400'>
                Loading pending appointments...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className='rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 p-6'>
            <div className='flex gap-4'>
              <div className='flex-shrink-0'>
                <svg
                  className='w-6 h-6 text-red-600 dark:text-red-400'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth='1.5'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
              <div className='flex-1'>
                <h3 className='text-lg font-semibold text-red-900 dark:text-red-200 mb-2'>
                  Failed to Load Pending Appointments
                </h3>
                <p className='text-sm text-red-800 dark:text-red-300 mb-4'>
                  {error}
                </p>
                <button
                  onClick={handleRetry}
                  className='inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors dark:bg-red-700 dark:hover:bg-red-600'
                >
                  <svg
                    className='w-4 h-4'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth='1.5'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.995-1.039M5.25 12a6.75 6.75 0 1111.07-3.938'
                    />
                  </svg>
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content (visible when not loading) */}
        {!loading && !error && (
          <>
            {/* Summary Stats */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                      Total Pending
                    </p>
                    <p className='mt-2 text-3xl font-bold text-gray-900 dark:text-white'>
                      {stats.total}
                    </p>
                  </div>
                  <div className='p-3 bg-yellow-100 rounded-lg dark:bg-yellow-900/30'>
                    <svg
                      className='w-6 h-6 text-yellow-600 dark:text-yellow-400'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth='1.5'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M12 6v6h.01m0 0v6m0-6h6m-6 0H6'
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                      Overdue (24h+)
                    </p>
                    <p className='mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400'>
                      {stats.overdue}
                    </p>
                  </div>
                  <div className='p-3 bg-orange-100 rounded-lg dark:bg-orange-900/30'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4'>
              <div className='flex flex-col sm:flex-row gap-3 items-end'>
                <div className='flex-1'>
                  <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                    Search
                  </label>
                  <input
                    type='text'
                    placeholder='Search by patient name or email...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    id='overdue-filter'
                    checked={overdueDaysOnly}
                    onChange={(e) => setOverdueDaysOnly(e.target.checked)}
                    className='w-4 h-4 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800'
                  />
                  <label
                    htmlFor='overdue-filter'
                    className='text-sm text-gray-700 dark:text-gray-300 cursor-pointer'
                  >
                    Show Overdue Only
                  </label>
                </div>
              </div>
            </div>
            {/* Pending Appointments Table */}
            {processedAppointments.length > 0 ? (
              <PendingConfirmationTable
                appointments={processedAppointments}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                onReschedule={handleReschedule}
              />
            ) : (
              <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-12 text-center'>
                <svg
                  className='w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth='1.5'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z'
                  />
                </svg>
                <p className='text-lg font-medium text-gray-600 dark:text-gray-400 mb-2'>
                  No pending confirmations
                </p>
                <p className='text-sm text-gray-500 dark:text-gray-500'>
                  All appointment requests have been processed
                </p>
              </div>
            )}
          </>
        )}

        {/* Toast Notifications */}
        <Toast toast={toast} onDismiss={dismissToast} />

        {/* Reschedule Modal */}
        <RescheduleModal
          appointment={appointmentToReschedule}
          isOpen={isRescheduleModalOpen}
          onClose={handleCloseRescheduleModal}
          onReschedule={handleRescheduleSubmit}
          isLoading={rescheduleLoading}
        />

        {/* Cancel Modal */}
        <CancelModal
          appointment={appointmentToCancel}
          isOpen={isCancelModalOpen}
          onClose={handleCloseCancelModal}
          onCancel={handleCancelSubmit}
          isLoading={rescheduleLoading}
        />
      </div>
    </>
  );
}
