import { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import doctorScheduleService, {
  getDayShortName,
  getDayName,
  DoctorScheduleDTO,
} from '../../services/doctorScheduleService';

export default function DoctorScheduleWeekly() {
  // Data states
  const [schedulesList, setSchedulesList] = useState<DoctorScheduleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduleFilter, setScheduleFilter] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
  });

  // Fetch schedules on component mount
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        setError(null);
        const schedules = await doctorScheduleService.getDoctorSchedules();
        setSchedulesList(schedules);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch schedules';
        setError(errorMessage);
        console.error('Error fetching schedules:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  // Handle retry
  const handleRetry = async () => {
    try {
      setLoading(true);
      setError(null);
      const schedules = await doctorScheduleService.getDoctorSchedules();
      setSchedulesList(schedules);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch schedules';
      setError(errorMessage);
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title='My Schedules | Doctor Panel'
        description='View your weekly schedules'
      />
      <PageBreadcrumb pageTitle='My Schedules' />

      <div className='space-y-6'>
        {/* Header */}
        <div>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
            My Weekly Schedules
          </h2>
          <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
            Your recurring schedule configuration (Read-only)
          </p>
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className='rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 p-6'>
            <div className='flex gap-4'>
              <svg
                className='w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0'
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
              <div className='flex-1'>
                <h3 className='text-lg font-semibold text-red-900 dark:text-red-200 mb-2'>
                  Failed to Load Schedules
                </h3>
                <p className='text-sm text-red-800 dark:text-red-300 mb-4'>
                  {error}
                </p>
                <button
                  onClick={handleRetry}
                  className='inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors'
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

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
                Loading schedules...
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Filters */}
            <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                Filter Schedules
              </h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Start Date
                  </label>
                  <input
                    type='date'
                    value={scheduleFilter.startDate}
                    onChange={(e) =>
                      setScheduleFilter({
                        ...scheduleFilter,
                        startDate: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    End Date
                  </label>
                  <input
                    type='date'
                    value={scheduleFilter.endDate}
                    onChange={(e) =>
                      setScheduleFilter({
                        ...scheduleFilter,
                        endDate: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>
            </div>

            {/* Schedules List */}
            <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6'>
              {schedulesList.length === 0 ? (
                <div className='text-center py-12'>
                  <svg
                    className='w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth='1.5'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0121 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5'
                    />
                  </svg>
                  <p className='text-gray-600 dark:text-gray-400'>
                    No schedules found.
                  </p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {schedulesList.map((schedule) => (
                    <div
                      key={schedule.id}
                      className='rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors'
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-3'>
                            <span className='inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50'>
                              <span className='text-sm font-bold text-blue-600 dark:text-blue-300'>
                                {getDayShortName(schedule.dayOfWeek)}
                              </span>
                            </span>
                            <div>
                              <p className='font-medium text-gray-900 dark:text-white'>
                                {getDayName(schedule.dayOfWeek)}
                              </p>
                              <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                                {schedule.startTime} - {schedule.endTime} •{' '}
                                <span className='text-gray-500 dark:text-gray-500'>
                                  {schedule.slotDuration}min slots
                                </span>{' '}
                                • Max {schedule.maxPatients} patients
                              </p>
                            </div>
                          </div>
                        </div>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            schedule.isActive
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {schedule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className='rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-900/10 p-6'>
              <div className='flex gap-4'>
                <svg
                  className='w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth='1.5'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z'
                  />
                </svg>
                <div>
                  <h4 className='font-semibold text-blue-900 dark:text-blue-200 mb-2'>
                    About your schedules:
                  </h4>
                  <ul className='text-sm text-blue-800 dark:text-blue-300 space-y-1'>
                    <li>
                      • This shows your recurring weekly schedule patterns
                    </li>
                    <li>
                      • Each schedule defines the working hours for a specific
                      day
                    </li>
                    <li>
                      • Patients will see available time slots based on these
                      schedules
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
