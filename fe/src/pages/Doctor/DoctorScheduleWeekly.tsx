import { useState, useMemo, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import Toast from '../../components/common/Toast';
import { useToast } from '../../hooks/useToast';
import doctorScheduleService, {
  TimeSlotDTO,
  getDayShortName,
} from '../../services/doctorScheduleService';

export default function DoctorScheduleWeekly() {
  const { toast, showToast, dismissToast } = useToast();

  // Data states
  const [timeSlots, setTimeSlots] = useState<TimeSlotDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI states
  const [editingSlot, setEditingSlot] = useState<TimeSlotDTO | null>(null);
  const [addingSlotDate, setAddingSlotDate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    startTime: '09:00',
    endTime: '10:00',
  });

  // Calculate next week dates
  const nextWeekInfo = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();

    // Calculate current week's Sunday
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - dayOfWeek);
    currentWeekStart.setHours(0, 0, 0, 0);

    // Calculate next week's Sunday
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(currentWeekStart.getDate() + 7);

    // Build dates for next week
    const dates: {
      dayOfWeek: number;
      date: Date;
      dateStr: string;
      label: string;
    }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(nextWeekStart);
      date.setDate(nextWeekStart.getDate() + i);
      dates.push({
        dayOfWeek: i,
        date,
        dateStr: date.toISOString().split('T')[0],
        label: `${getDayShortName(i)} ${date.getDate()}`,
      });
    }

    return { nextWeekStart, dates };
  }, []);

  // Fetch time slots for next week
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const startDate = nextWeekInfo.dates[0].dateStr;
        const endDate = nextWeekInfo.dates[6].dateStr;
        const slotsData = await doctorScheduleService.listTimeSlots(
          startDate,
          endDate
        );
        setTimeSlots(slotsData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch time slots';
        setError(errorMessage);
        console.error('Error fetching time slots:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [nextWeekInfo]);

  // Group time slots by date
  const slotsByDate = useMemo(() => {
    const grouped: { [key: string]: TimeSlotDTO[] } = {};
    nextWeekInfo.dates.forEach((dateInfo) => {
      grouped[dateInfo.dateStr] = timeSlots.filter(
        (slot) => slot.slotDate === dateInfo.dateStr
      );
    });
    return grouped;
  }, [timeSlots, nextWeekInfo]);

  // Total slots count
  const totalSlots = useMemo(() => timeSlots.length, [timeSlots]);

  // Handle add time slot
  const handleAddTimeSlot = async (dateStr: string) => {
    if (!formData.startTime || !formData.endTime) {
      showToast('Please fill in start and end times', 'error');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      showToast('Start time must be before end time', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const newSlot = await doctorScheduleService.createTimeSlot({
        slotDate: dateStr,
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: 'AVAILABLE',
      });

      setTimeSlots((prev) => [...prev, newSlot]);
      setAddingSlotDate(null);
      setFormData({ startTime: '09:00', endTime: '10:00' });
      showToast('Time slot added successfully', 'success');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to add time slot';
      showToast(errorMessage, 'error');
      console.error('Error adding time slot:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update time slot
  const handleUpdateTimeSlot = async (slotId: number) => {
    if (!formData.startTime || !formData.endTime) {
      showToast('Please fill in start and end times', 'error');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      showToast('Start time must be before end time', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const updatedSlot = await doctorScheduleService.updateTimeSlot(slotId, {
        startTime: formData.startTime,
        endTime: formData.endTime,
      });

      setTimeSlots((prev) =>
        prev.map((slot) => (slot.id === slotId ? updatedSlot : slot))
      );
      setEditingSlot(null);
      setFormData({ startTime: '09:00', endTime: '10:00' });
      showToast('Time slot updated successfully', 'success');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update time slot';
      showToast(errorMessage, 'error');
      console.error('Error updating time slot:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete time slot
  const handleDeleteTimeSlot = async (slotId: number) => {
    if (!window.confirm('Are you sure you want to delete this time slot?'))
      return;

    try {
      setSubmitting(true);
      await doctorScheduleService.deleteTimeSlot(slotId);
      setTimeSlots((prev) => prev.filter((slot) => slot.id !== slotId));
      showToast('Time slot deleted successfully', 'success');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete time slot';
      showToast(errorMessage, 'error');
      console.error('Error deleting time slot:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle generate schedules
  const handleGenerateSchedules = async () => {
    if (totalSlots === 0) {
      showToast(
        'Please add at least one time slot before generating schedules',
        'error'
      );
      return;
    }

    if (
      !window.confirm(
        `Generate schedules from ${totalSlots} time slots? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setSubmitting(true);
      const startDate = nextWeekInfo.dates[0].dateStr;
      const endDate = nextWeekInfo.dates[6].dateStr;

      const result = await doctorScheduleService.generateTimeSlots({
        startDate,
        endDate,
        overwriteExisting: false,
      });

      showToast(
        result.message || 'Schedules generated successfully',
        'success'
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to generate schedules';
      showToast(errorMessage, 'error');
      console.error('Error generating schedules:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle retry
  const handleRetry = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = nextWeekInfo.dates[0].dateStr;
      const endDate = nextWeekInfo.dates[6].dateStr;
      const slotsData = await doctorScheduleService.listTimeSlots(
        startDate,
        endDate
      );
      setTimeSlots(slotsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch time slots';
      setError(errorMessage);
      console.error('Error fetching time slots:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title='Weekly Schedule | Doctor Panel'
        description='Manage your weekly time slots'
      />
      <PageBreadcrumb pageTitle='Weekly Schedule' />

      <div className='space-y-6'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
              Weekly Time Slots
            </h2>
            <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
              Add time slots for the next week ({nextWeekInfo.dates[0].dateStr}{' '}
              to {nextWeekInfo.dates[6].dateStr})
            </p>
          </div>
          <button
            onClick={handleGenerateSchedules}
            disabled={totalSlots === 0 || submitting}
            className='px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2'
          >
            <svg
              className='w-5 h-5'
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
            Generate Schedules
          </button>
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
                  Failed to Load Time Slots
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
                Loading time slots...
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Summary Stats */}
            <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                    Total Time Slots for Next Week
                  </p>
                  <p className='mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400'>
                    {totalSlots}
                  </p>
                </div>
                <div className='p-3 bg-blue-100 rounded-lg dark:bg-blue-900/30'>
                  <svg
                    className='w-8 h-8 text-blue-600 dark:text-blue-400'
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
                </div>
              </div>
            </div>

            {/* Weekly Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              {nextWeekInfo.dates.map((dateInfo) => {
                const daySlots = slotsByDate[dateInfo.dateStr] || [];
                return (
                  <div
                    key={dateInfo.dateStr}
                    className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6'
                  >
                    {/* Day Header */}
                    <div className='mb-4'>
                      <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                        {dateInfo.label}
                      </p>
                      <p className='text-xs text-gray-500 dark:text-gray-500 mt-1'>
                        {daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Time Slots List */}
                    <div className='space-y-2 mb-4'>
                      {daySlots.length > 0 ? (
                        daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            className='flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900/40'
                          >
                            <div>
                              <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                                {slot.startTime} - {slot.endTime}
                              </p>
                              <p className='text-xs text-gray-500 dark:text-gray-400 capitalize'>
                                {slot.status?.toLowerCase()}
                              </p>
                            </div>
                            <div className='flex gap-1'>
                              <button
                                onClick={() => {
                                  setEditingSlot(slot);
                                  setFormData({
                                    startTime: slot.startTime,
                                    endTime: slot.endTime,
                                  });
                                }}
                                className='p-2 hover:bg-blue-200 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded transition-colors'
                                title='Edit'
                              >
                                <svg
                                  xmlns='http://www.w3.org/2000/svg'
                                  fill='none'
                                  viewBox='0 0 24 24'
                                  stroke-width='1.5'
                                  stroke='currentColor'
                                  className='w-4'
                                >
                                  <path
                                    stroke-linecap='round'
                                    stroke-linejoin='round'
                                    d='m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10'
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteTimeSlot(slot.id || 0)
                                }
                                disabled={submitting}
                                className='p-2 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded transition-colors disabled:opacity-50'
                                title='Delete'
                              >
                                <svg
                                  xmlns='http://www.w3.org/2000/svg'
                                  fill='none'
                                  viewBox='0 0 24 24'
                                  stroke-width='1.5'
                                  stroke='currentColor'
                                  className='w-4'
                                >
                                  <path
                                    stroke-linecap='round'
                                    stroke-linejoin='round'
                                    d='m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0'
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className='text-xs text-gray-400 dark:text-gray-600 italic'>
                          No time slots
                        </p>
                      )}
                    </div>

                    {/* Add/Edit Form */}
                    {(addingSlotDate === dateInfo.dateStr ||
                      editingSlot?.slotDate === dateInfo.dateStr) && (
                      <div className='border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3'>
                        <div className='grid grid-cols-2 gap-2'>
                          <div>
                            <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>
                              Start
                            </label>
                            <input
                              type='time'
                              value={formData.startTime}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  startTime: e.target.value,
                                })
                              }
                              className='w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none'
                              disabled={submitting}
                            />
                          </div>
                          <div>
                            <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>
                              End
                            </label>
                            <input
                              type='time'
                              value={formData.endTime}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  endTime: e.target.value,
                                })
                              }
                              className='w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none'
                              disabled={submitting}
                            />
                          </div>
                        </div>
                        <div className='flex gap-2'>
                          <button
                            onClick={() => {
                              if (editingSlot) {
                                handleUpdateTimeSlot(editingSlot.id || 0);
                              } else {
                                handleAddTimeSlot(dateInfo.dateStr);
                              }
                            }}
                            disabled={submitting}
                            className='flex-1 px-3 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition-colors'
                          >
                            {submitting
                              ? '...'
                              : editingSlot
                                ? 'Update'
                                : 'Add'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingSlot(null);
                              setAddingSlotDate(null);
                              setFormData({
                                startTime: '09:00',
                                endTime: '10:00',
                              });
                            }}
                            disabled={submitting}
                            className='flex-1 px-3 py-2 text-xs font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors'
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Add Button */}
                    {addingSlotDate !== dateInfo.dateStr && !editingSlot && (
                      <button
                        onClick={() => {
                          setAddingSlotDate(dateInfo.dateStr);
                          setFormData({ startTime: '09:00', endTime: '10:00' });
                        }}
                        className='w-full px-3 py-2 text-sm font-medium border border-dashed border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 rounded transition-colors'
                      >
                        + Add Time Slot
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Helper Text */}
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
                    How to use:
                  </h4>
                  <ul className='text-sm text-blue-800 dark:text-blue-300 space-y-1'>
                    <li>1. Add time slots for each day of the week</li>
                    <li>2. Review all slots are correct</li>
                    <li>3. Click "Generate Schedules" to finalize</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Loading Overlay for form submission */}
        {submitting && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
            <div className='flex flex-col items-center gap-4'>
              <svg
                className='w-12 h-12 animate-spin text-white'
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
              <p className='text-white font-medium'>Processing...</p>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
