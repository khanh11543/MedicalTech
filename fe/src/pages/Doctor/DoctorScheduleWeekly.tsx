import { useState, useMemo, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import Toast from '../../components/common/Toast';
import { useToast } from '../../hooks/useToast';
import doctorScheduleService, {
  TimeSlotDTO,
  getDayShortName,
  getDayName,
  DoctorScheduleDTO,
  ScheduleExceptionDTO,
  ExceptionType,
} from '../../services/doctorScheduleService';

export default function DoctorScheduleWeekly() {
  const { toast, showToast, dismissToast } = useToast();

  // Data states
  const [timeSlots, setTimeSlots] = useState<TimeSlotDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSchedules, setHasSchedules] = useState(false);
  const [checkingSchedules, setCheckingSchedules] = useState(true);
  const [schedulesPerDay, setSchedulesPerDay] = useState<{
    [key: number]: boolean;
  }>({});

  // UI states
  const [editingSlot, setEditingSlot] = useState<TimeSlotDTO | null>(null);
  const [addingSlotDate, setAddingSlotDate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    startTime: '09:00',
    endTime: '10:00',
  });

  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDangerous: false,
    onConfirm: () => {},
  });

  // Create schedule modal state
  const [showCreateScheduleModal, setShowCreateScheduleModal] = useState(false);
  const [scheduleFormData, setScheduleFormData] = useState({
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    maxPatients: 20,
  });

  // View schedules modal state
  const [showViewSchedulesModal, setShowViewSchedulesModal] = useState(false);
  const [schedulesList, setSchedulesList] = useState<DoctorScheduleDTO[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [scheduleFilter, setScheduleFilter] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
  });

  // Create schedule exception modal state
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionType, setExceptionType] = useState<ExceptionType>('OFF');
  const [exceptionFormData, setExceptionFormData] = useState({
    exceptionDate: new Date().toISOString().split('T')[0],
    reason: '',
    startTime: '09:00',
    endTime: '17:00',
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

  // Check if doctor has weekly schedules on component mount
  useEffect(() => {
    const checkSchedules = async () => {
      try {
        setCheckingSchedules(true);
        const schedules = await doctorScheduleService.getDoctorSchedules();
        setHasSchedules(schedules.length > 0);

        // Build a map of which days have schedules
        const daysMap: { [key: number]: boolean } = {};
        for (let i = 0; i < 7; i++) {
          daysMap[i] = schedules.some((s) => s.dayOfWeek === i);
        }
        setSchedulesPerDay(daysMap);
      } catch (err) {
        console.error('Error checking schedules:', err);
        setHasSchedules(false);
        setSchedulesPerDay({});
      } finally {
        setCheckingSchedules(false);
      }
    };

    checkSchedules();
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
    setConfirmModal({
      title: 'Delete Time Slot',
      message:
        'Are you sure you want to delete this time slot? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          setSubmitting(true);
          await doctorScheduleService.deleteTimeSlot(slotId);
          setTimeSlots((prev) => prev.filter((slot) => slot.id !== slotId));
          showToast('Time slot deleted successfully', 'success');
          setShowConfirmModal(false);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to delete time slot';
          showToast(errorMessage, 'error');
          console.error('Error deleting time slot:', err);
        } finally {
          setSubmitting(false);
        }
      },
    });
    setShowConfirmModal(true);
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

    setConfirmModal({
      title: 'Generate Schedules',
      message: `You are about to generate ${totalSlots} schedule(s) from your time slots. This will create actual appointment slots based on your time slot configuration. This action cannot be undone.`,
      confirmText: 'Generate',
      cancelText: 'Cancel',
      isDangerous: false,
      onConfirm: async () => {
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
          setShowConfirmModal(false);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to generate schedules';
          showToast(errorMessage, 'error');
          console.error('Error generating schedules:', err);
        } finally {
          setSubmitting(false);
        }
      },
    });
    setShowConfirmModal(true);
  };

  // Handle create schedule
  const handleCreateSchedule = async () => {
    if (scheduleFormData.startTime >= scheduleFormData.endTime) {
      showToast('Start time must be before end time', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await doctorScheduleService.createDoctorSchedule({
        dayOfWeek: scheduleFormData.dayOfWeek,
        startTime: scheduleFormData.startTime,
        endTime: scheduleFormData.endTime,
        slotDuration: scheduleFormData.slotDuration,
        maxPatients: scheduleFormData.maxPatients,
        isActive: true,
      });

      // Update schedules per day map
      setSchedulesPerDay((prev) => ({
        ...prev,
        [scheduleFormData.dayOfWeek]: true,
      }));

      setHasSchedules(true);
      setShowCreateScheduleModal(false);
      setScheduleFormData({
        dayOfWeek: 0,
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30,
        maxPatients: 20,
      });
      showToast('Schedule created successfully', 'success');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create schedule';
      showToast(errorMessage, 'error');
      console.error('Error creating schedule:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle open view schedules modal
  const handleOpenViewSchedules = async () => {
    try {
      setLoadingSchedules(true);
      const schedules = await doctorScheduleService.getDoctorSchedules();
      setSchedulesList(schedules);
      setShowViewSchedulesModal(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch schedules';
      showToast(errorMessage, 'error');
      console.error('Error fetching schedules:', err);
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Handle create schedule exception
  const handleCreateException = async () => {
    if (!exceptionFormData.exceptionDate) {
      showToast('Please select an exception date', 'error');
      return;
    }

    if (!exceptionFormData.reason.trim()) {
      showToast('Please enter a reason for this exception', 'error');
      return;
    }

    if (exceptionType !== 'OFF') {
      if (!exceptionFormData.startTime || !exceptionFormData.endTime) {
        showToast('Please fill in start and end times', 'error');
        return;
      }

      if (exceptionFormData.startTime >= exceptionFormData.endTime) {
        showToast('Start time must be before end time', 'error');
        return;
      }
    }

    try {
      setSubmitting(true);
      const dto: Omit<ScheduleExceptionDTO, 'id' | 'doctorId'> = {
        exceptionDate: exceptionFormData.exceptionDate,
        exceptionType,
        reason: exceptionFormData.reason,
      };

      if (exceptionType !== 'OFF') {
        dto.startTime = exceptionFormData.startTime;
        dto.endTime = exceptionFormData.endTime;
      }

      await doctorScheduleService.addScheduleException(dto);

      setShowExceptionModal(false);
      setExceptionFormData({
        exceptionDate: new Date().toISOString().split('T')[0],
        reason: '',
        startTime: '09:00',
        endTime: '17:00',
      });
      setExceptionType('OFF');
      showToast('Schedule exception created successfully', 'success');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create exception';
      showToast(errorMessage, 'error');
      console.error('Error creating exception:', err);
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
          <div className='flex flex-col sm:flex-row gap-3 flex-wrap'>
            <button
              onClick={() => setShowExceptionModal(true)}
              disabled={checkingSchedules}
              className='px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2'
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
                  d='M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              Exception
            </button>
            <button
              onClick={handleOpenViewSchedules}
              disabled={checkingSchedules}
              className='px-4 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2'
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
                  d='M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z'
                />
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                />
              </svg>
              View Schedules
            </button>
            <button
              onClick={() => setShowCreateScheduleModal(true)}
              disabled={checkingSchedules}
              className='px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2'
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
                  d='M12 6v12m6-6H6'
                />
              </svg>
              Create Schedule
            </button>
            <button
              onClick={handleGenerateSchedules}
              disabled={checkingSchedules || totalSlots === 0 || submitting}
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
        </div>

        {/* Schedule Status */}
        {hasSchedules && (
          <div className='rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-900/10 p-4'>
            <p className='text-sm font-medium text-blue-900 dark:text-blue-200 mb-3'>
              Weekly Schedule Status
            </p>
            <div className='flex flex-wrap gap-2'>
              {[
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
              ].map((day, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    schedulesPerDay[index]
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {day}
                  {schedulesPerDay[index] && (
                    <svg
                      className='w-3 h-3'
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path
                        fillRule='evenodd'
                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                        clipRule='evenodd'
                      />
                    </svg>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

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
                    className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 max-h-[100vh] overflow-auto no-scrollbar'
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

      {/* Create Schedule Modal */}
      {showCreateScheduleModal && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
          <div className='bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200'>
            {/* Header */}
            <div className='bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900/50 px-6 py-4'>
              <div className='flex items-start gap-3'>
                <div className='p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex-shrink-0'>
                  <svg
                    className='w-5 h-5 text-blue-600 dark:text-blue-400'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth='1.5'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M12 6v12m6-6H6'
                    />
                  </svg>
                </div>
                <div>
                  <h3 className='text-lg font-bold text-blue-900 dark:text-blue-200'>
                    Create Weekly Schedule
                  </h3>
                  <p className='text-sm text-blue-700 dark:text-blue-300 mt-1'>
                    Create a schedule for a specific day of the week
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className='px-6 py-4 space-y-4'>
              {/* Day of Week - Now with status indicator */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Day of Week
                </label>
                <select
                  value={scheduleFormData.dayOfWeek}
                  onChange={(e) =>
                    setScheduleFormData({
                      ...scheduleFormData,
                      dayOfWeek: parseInt(e.target.value),
                    })
                  }
                  disabled={submitting}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  {[
                    'Sunday',
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                  ].map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                      {schedulesPerDay[index] ? ' (Already created)' : ''}
                    </option>
                  ))}
                </select>
                {schedulesPerDay[scheduleFormData.dayOfWeek] && (
                  <p className='text-xs text-orange-600 dark:text-orange-400 mt-2'>
                    This day already has a schedule. Creating a new one will
                    replace it.
                  </p>
                )}
              </div>

              {/* Time Range */}
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Start Time
                  </label>
                  <input
                    type='time'
                    value={scheduleFormData.startTime}
                    onChange={(e) =>
                      setScheduleFormData({
                        ...scheduleFormData,
                        startTime: e.target.value,
                      })
                    }
                    disabled={submitting}
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    End Time
                  </label>
                  <input
                    type='time'
                    value={scheduleFormData.endTime}
                    onChange={(e) =>
                      setScheduleFormData({
                        ...scheduleFormData,
                        endTime: e.target.value,
                      })
                    }
                    disabled={submitting}
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>

              {/* Slot Duration */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Slot Duration (minutes)
                </label>
                <input
                  type='number'
                  min='15'
                  max='120'
                  step='15'
                  value={scheduleFormData.slotDuration}
                  onChange={(e) =>
                    setScheduleFormData({
                      ...scheduleFormData,
                      slotDuration: parseInt(e.target.value),
                    })
                  }
                  disabled={submitting}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              {/* Max Patients */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Max Patients
                </label>
                <input
                  type='number'
                  min='1'
                  max='100'
                  value={scheduleFormData.maxPatients}
                  onChange={(e) =>
                    setScheduleFormData({
                      ...scheduleFormData,
                      maxPatients: parseInt(e.target.value),
                    })
                  }
                  disabled={submitting}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            </div>

            {/* Footer */}
            <div className='px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end'>
              <button
                onClick={() => setShowCreateScheduleModal(false)}
                disabled={submitting}
                className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSchedule}
                disabled={submitting}
                className='px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
              >
                {submitting && (
                  <svg
                    className='w-4 h-4 animate-spin'
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
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                )}
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Schedules Modal */}
      {showViewSchedulesModal && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
          <div className='bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[80vh] overflow-y-auto'>
            {/* Header */}
            <div className='bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0'>
              <div className='flex items-center justify-between'>
                <div className='flex items-start gap-3'>
                  <div className='p-2 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0'>
                    <svg
                      className='w-5 h-5 text-gray-700 dark:text-gray-300'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth='1.5'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className='text-lg font-bold text-gray-900 dark:text-white'>
                      My Weekly Schedules
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                      Your recurring schedule configuration
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewSchedulesModal(false)}
                  className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                >
                  <svg
                    className='w-6 h-6'
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
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-16'>
              <div className='grid grid-cols-2 gap-4'>
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

            {/* Content */}
            <div className='px-6 py-4'>
              {loadingSchedules ? (
                <div className='flex flex-col items-center justify-center py-12'>
                  <svg
                    className='w-12 h-12 text-gray-400 animate-spin mb-4'
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
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                  <p className='text-gray-600 dark:text-gray-400'>
                    Loading schedules...
                  </p>
                </div>
              ) : schedulesList.length === 0 ? (
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
                      d='M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5'
                    />
                  </svg>
                  <p className='text-gray-600 dark:text-gray-400'>
                    No schedules found. Create one to get started.
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

            {/* Footer */}
            <div className='px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end sticky bottom-0'>
              <button
                onClick={() => setShowViewSchedulesModal(false)}
                className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Schedule Exception Modal */}
      {showExceptionModal && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
          <div className='bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200'>
            {/* Header */}
            <div className='bg-purple-50 dark:bg-purple-950/30 border-b border-purple-200 dark:border-purple-900/50 px-6 py-4'>
              <div className='flex items-start gap-3'>
                <div className='p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex-shrink-0'>
                  <svg
                    className='w-5 h-5 text-purple-600 dark:text-purple-400'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth='1.5'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
                <div>
                  <h3 className='text-lg font-bold text-purple-900 dark:text-purple-200'>
                    Create Schedule Exception
                  </h3>
                  <p className='text-sm text-purple-700 dark:text-purple-300 mt-1'>
                    Add special conditions to your weekly schedule
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className='px-6 py-6 space-y-6'>
              {/* Exception Type Selection */}
              <div>
                <label className='block text-sm font-semibold text-gray-900 dark:text-white mb-3'>
                  Exception Type
                </label>
                <div className='space-y-2'>
                  <label className='flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'>
                    <input
                      type='radio'
                      name='exceptionType'
                      value='OFF'
                      checked={exceptionType === 'OFF'}
                      onChange={(e) =>
                        setExceptionType(e.target.value as ExceptionType)
                      }
                      className='w-4 h-4 text-red-600'
                    />
                    <div className='ml-3 flex-1'>
                      <p className='text-sm font-medium text-gray-900 dark:text-white'>
                        Day Off
                      </p>
                      <p className='text-xs text-gray-600 dark:text-gray-400'>
                        No work on this day
                      </p>
                    </div>
                  </label>

                  <label className='flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'>
                    <input
                      type='radio'
                      name='exceptionType'
                      value='MODIFIED'
                      checked={exceptionType === 'MODIFIED'}
                      onChange={(e) =>
                        setExceptionType(e.target.value as ExceptionType)
                      }
                      className='w-4 h-4 text-yellow-600'
                    />
                    <div className='ml-3 flex-1'>
                      <p className='text-sm font-medium text-gray-900 dark:text-white'>
                        Modified Schedule
                      </p>
                      <p className='text-xs text-gray-600 dark:text-gray-400'>
                        Work a part of the day (different hours)
                      </p>
                    </div>
                  </label>

                  <label className='flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'>
                    <input
                      type='radio'
                      name='exceptionType'
                      value='EXTRA'
                      checked={exceptionType === 'EXTRA'}
                      onChange={(e) =>
                        setExceptionType(e.target.value as ExceptionType)
                      }
                      className='w-4 h-4 text-green-600'
                    />
                    <div className='ml-3 flex-1'>
                      <p className='text-sm font-medium text-gray-900 dark:text-white'>
                        Extra Hours
                      </p>
                      <p className='text-xs text-gray-600 dark:text-gray-400'>
                        Work the whole day with extra hours
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Exception Date */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Exception Date
                </label>
                <input
                  type='date'
                  value={exceptionFormData.exceptionDate}
                  onChange={(e) =>
                    setExceptionFormData({
                      ...exceptionFormData,
                      exceptionDate: e.target.value,
                    })
                  }
                  disabled={submitting}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                />
              </div>

              {/* Reason */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Reason
                </label>
                <textarea
                  rows={3}
                  value={exceptionFormData.reason}
                  onChange={(e) =>
                    setExceptionFormData({
                      ...exceptionFormData,
                      reason: e.target.value,
                    })
                  }
                  disabled={submitting}
                  placeholder='Why is this exception needed?'
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                />
              </div>

              {/* Time Range (conditionally shown) */}
              {exceptionType !== 'OFF' && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3'>
                    {exceptionType === 'MODIFIED'
                      ? 'Working Hours'
                      : 'Extra Working Hours'}
                  </label>
                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <label className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                        Start Time
                      </label>
                      <input
                        type='time'
                        value={exceptionFormData.startTime}
                        onChange={(e) =>
                          setExceptionFormData({
                            ...exceptionFormData,
                            startTime: e.target.value,
                          })
                        }
                        disabled={submitting}
                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                        End Time
                      </label>
                      <input
                        type='time'
                        value={exceptionFormData.endTime}
                        onChange={(e) =>
                          setExceptionFormData({
                            ...exceptionFormData,
                            endTime: e.target.value,
                          })
                        }
                        disabled={submitting}
                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className='px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end'>
              <button
                onClick={() => setShowExceptionModal(false)}
                disabled={submitting}
                className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Cancel
              </button>
              <button
                onClick={handleCreateException}
                disabled={submitting}
                className='px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
              >
                {submitting && (
                  <svg
                    className='w-4 h-4 animate-spin'
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
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                )}
                Create Exception
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
          <div className='bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200'>
            {/* Header */}
            <div
              className={`px-6 py-4 border-b ${
                confirmModal.isDangerous
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50'
                  : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50'
              }`}
            >
              <div className='flex items-start gap-3'>
                {confirmModal.isDangerous ? (
                  <div className='p-2 bg-red-100 dark:bg-red-900/50 rounded-lg flex-shrink-0'>
                    <svg
                      className='w-5 h-5 text-red-600 dark:text-red-400'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth='1.5'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M12 9v3.75m-9.303 1.677A9 9 0 0 1 21 12a9 9 0 0 1-18 0c0-5.577 4.03-10.205 9.303-11.423'
                      />
                    </svg>
                  </div>
                ) : (
                  <div className='p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex-shrink-0'>
                    <svg
                      className='w-5 h-5 text-blue-600 dark:text-blue-400'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth='1.5'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.9.813-2.612.812-3.441.763m5.753.917c1.745-1.559 4.592-1.559 6.337 0 1.746 1.56 1.746 4.094 0 5.653-1.745 1.56-4.592 1.56-6.337 0m-15.598-6.59c-1.745-1.559-1.745-4.093 0-5.653 1.746-1.56 4.593-1.56 6.338 0m5.753.917c-.9-.813-2.612-.812-3.441-.763'
                      />
                    </svg>
                  </div>
                )}
                <div className='flex-1'>
                  <h3
                    className={`text-lg font-bold ${
                      confirmModal.isDangerous
                        ? 'text-red-900 dark:text-red-200'
                        : 'text-blue-900 dark:text-blue-200'
                    }`}
                  >
                    {confirmModal.title}
                  </h3>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className='px-6 py-4'>
              <p className='text-gray-700 dark:text-gray-300 text-sm leading-relaxed'>
                {confirmModal.message}
              </p>
            </div>

            {/* Footer */}
            <div className='px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end'>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {confirmModal.cancelText}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                disabled={submitting}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  confirmModal.isDangerous
                    ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                    : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
                }`}
              >
                {submitting && (
                  <svg
                    className='w-4 h-4 animate-spin'
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
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                )}
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
