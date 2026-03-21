import { useState, useMemo, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import Toast from '../../components/common/Toast';
import { useToast } from '../../hooks/useToast';
import HistoryAppointmentTable from '../../components/tables/HistoryAppointmentTable';
import AppointmentSummaryModal from '../../components/modals/AppointmentSummaryModal';
import AppointmentDetailModal from '../../components/modals/AppointmentDetailModal';
import MedicalRecordModal from '../../components/modals/MedicalRecordModal';
import appointmentService, {
  AppointmentDTO,
} from '../../services/appointmentService';

export default function DoctorAppointmentsHistory() {
  // Toast notification
  const { toast, showToast, dismissToast } = useToast();

  // Data fetching states
  const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // Modal states
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [medicalRecordModalOpen, setMedicalRecordModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentDTO | null>(null);

  // Fetch appointments from API
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await appointmentService.getDoctorAppointmentHistory({
          pageNumber: 0,
          pageSize: 100,
        });
        // Filter to only show completed, cancelled, no-show, and rescheduled appointments
        const historyAppointments =
          response.content?.filter((apt) =>
            ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'].includes(
              apt.status
            )
          ) || [];
        setAppointments(historyAppointments);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to fetch appointment history';
        setError(errorMessage);
        console.error('Error fetching appointment history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Process data: search filter, status filter, date range filter
  const processedAppointments = useMemo(() => {
    let result = [...appointments];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (apt) =>
          apt.patientName.toLowerCase().includes(query) ||
          apt.patientEmail.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter) {
      result = result.filter((apt) => apt.status === statusFilter);
    }

    // Date range filter
    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter);
      result = result.filter((apt) => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate >= fromDate;
      });
    }

    if (dateToFilter) {
      const toDate = new Date(dateToFilter);
      toDate.setHours(23, 59, 59, 999); // End of day
      result = result.filter((apt) => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate <= toDate;
      });
    }

    return result;
  }, [appointments, searchQuery, statusFilter, dateFromFilter, dateToFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter(
      (apt) => apt.status === 'COMPLETED'
    ).length;
    const cancelled = appointments.filter(
      (apt) => apt.status === 'CANCELLED'
    ).length;
    const noShow = appointments.filter(
      (apt) => apt.status === 'NO_SHOW'
    ).length;

    return { total, completed, cancelled, noShow };
  }, [appointments]);

  const handleRetry = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentService.getDoctorAppointmentHistory({
        pageNumber: 0,
        pageSize: 100,
      });
      const historyAppointments =
        response.content?.filter((apt) =>
          ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'].includes(
            apt.status
          )
        ) || [];
      setAppointments(historyAppointments);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch appointment history';
      setError(errorMessage);
      console.error('Error fetching appointment history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (appointment: AppointmentDTO) => {
    setSelectedAppointment(appointment);
    setSummaryModalOpen(true);
  };

  const handleViewMedicalRecord = (appointment: AppointmentDTO) => {
    setSelectedAppointment(appointment);
    setMedicalRecordModalOpen(true);
  };

  const handleCreateFollowUp = (appointment: AppointmentDTO) => {
    showToast(
      `Follow-up request noted for ${appointment.patientName}. Please coordinate with reception to schedule the follow-up appointment.`,
      'success'
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDateFromFilter('');
    setDateToFilter('');
  };

  return (
    <>
      <PageMeta
        title='Appointment History | Doctor Panel'
        description='View your past appointments'
      />
      <PageBreadcrumb pageTitle='Appointment History' />

      <div className='space-y-6'>
        {/* Header Section */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
              Appointment History
            </h2>
            <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
              View your completed, cancelled, and no-show appointments
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
                Loading appointment history...
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
                  Failed to Load Appointment History
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
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                      Total History
                    </p>
                    <p className='mt-2 text-3xl font-bold text-gray-900 dark:text-white'>
                      {stats.total}
                    </p>
                  </div>
                  <div className='p-3 bg-blue-100 rounded-lg dark:bg-blue-900/30'>
                    <svg
                      className='w-6 h-6 text-blue-600 dark:text-blue-400'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth='1.5'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5'
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                      Completed
                    </p>
                    <p className='mt-2 text-3xl font-bold text-green-600 dark:text-green-400'>
                      {stats.completed}
                    </p>
                  </div>
                  <div className='p-3 bg-green-100 rounded-lg dark:bg-green-900/30'>
                    <svg
                      className='w-6 h-6 text-green-600 dark:text-green-400'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth='1.5'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                      Cancelled
                    </p>
                    <p className='mt-2 text-3xl font-bold text-red-600 dark:text-red-400'>
                      {stats.cancelled}
                    </p>
                  </div>
                  <div className='p-3 bg-red-100 rounded-lg dark:bg-red-900/30'>
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
                        d='M6 18L18 6M6 6l12 12'
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                      No Show
                    </p>
                    <p className='mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400'>
                      {stats.noShow}
                    </p>
                  </div>
                  <div className='p-3 bg-yellow-100 rounded-lg dark:bg-yellow-900/30'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke-width='1.5'
                      stroke='currentColor'
                      className='w-6 h-6 text-yellow-600 dark:text-yellow-400'
                    >
                      <path
                        stroke-linecap='round'
                        stroke-linejoin='round'
                        d='M15.182 16.318A4.486 4.486 0 0 0 12.016 15a4.486 4.486 0 0 0-3.198 1.318M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z'
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4'>
              <div className='flex flex-col gap-4'>
                {/* Search and Status Row */}
                <div className='flex flex-col sm:flex-row gap-3'>
                  <div className='flex-1'>
                    <input
                      type='text'
                      placeholder='Search by patient name or email...'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className='px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value=''>All Status</option>
                    <option value='COMPLETED'>Completed</option>
                    <option value='CANCELLED'>Cancelled</option>
                    <option value='NO_SHOW'>No Show</option>
                    <option value='RESCHEDULED'>Rescheduled</option>
                  </select>
                </div>

                {/* Date Range and Reset Row */}
                <div className='flex flex-col sm:flex-row gap-3'>
                  <div className='flex-1 sm:flex-none'>
                    <input
                      type='date'
                      value={dateFromFilter}
                      onChange={(e) => setDateFromFilter(e.target.value)}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <div className='flex-1 sm:flex-none'>
                    <input
                      type='date'
                      value={dateToFilter}
                      onChange={(e) => setDateToFilter(e.target.value)}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <button
                    onClick={handleResetFilters}
                    className='px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors'
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* History Table */}
            {processedAppointments.length > 0 ? (
              <HistoryAppointmentTable
                appointments={processedAppointments}
                onViewDetail={handleViewDetail}
                onViewMedicalRecord={handleViewMedicalRecord}
                onCreateFollowUp={handleCreateFollowUp}
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
                  No appointment history found
                </p>
                <p className='text-sm text-gray-500 dark:text-gray-500'>
                  Try adjusting your filters to find what you're looking for
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AppointmentSummaryModal
        appointmentId={selectedAppointment?.id ?? null}
        isOpen={summaryModalOpen}
        onClose={() => {
          setSummaryModalOpen(false);
          setSelectedAppointment(null);
        }}
      />
      <AppointmentDetailModal
        appointmentId={selectedAppointment?.id ?? null}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedAppointment(null);
        }}
      />
      <MedicalRecordModal
        appointment={selectedAppointment}
        isOpen={medicalRecordModalOpen}
        onClose={() => {
          setMedicalRecordModalOpen(false);
          setSelectedAppointment(null);
        }}
      />

      {/* Toast Notifications */}
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
