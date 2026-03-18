import { useState, useEffect } from 'react';
import {
  AppointmentDTO,
  RescheduleDTO,
} from '../../services/appointmentService';
import appointmentService from '../../services/appointmentService';
import { TimeSlotDTO } from '../../services/doctorScheduleService';

// Animation styles
const animationStyles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
`;

interface RescheduleModalProps {
  isOpen: boolean;
  appointment: AppointmentDTO | null;
  onClose: () => void;
  onReschedule: (data: RescheduleDTO) => Promise<void>;
  isLoading?: boolean;
}

export default function RescheduleModal({
  isOpen,
  appointment,
  onClose,
  onReschedule,
  isLoading = false,
}: RescheduleModalProps) {
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  // Available slots state
  const [availableSlots, setAvailableSlots] = useState<TimeSlotDTO[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Fetch available slots when modal opens
  useEffect(() => {
    if (isOpen && appointment) {
      fetchAvailableSlots();
    }
  }, [isOpen, appointment]);

  const fetchAvailableSlots = async () => {
    if (!appointment?.id) return;

    try {
      setSlotsLoading(true);
      setSlotsError(null);
      // Fetch slots for default range (today to +7 days)
      const slots = await appointmentService.getAvailableSlotsForReschedule(
        appointment.id
      );

      // Filter to only include future slots (both date and time must be in future)
      const now = new Date();
      const futureSlots = slots.filter((slot) => {
        // Parse the slot date
        const slotDateTime = new Date(`${slot.slotDate}T${slot.startTime}`);

        // Compare with current time
        return slotDateTime > now;
      });

      setAvailableSlots(futureSlots);

      // Show warning if backend returned slots but all were filtered out as past
      if (slots.length > 0 && futureSlots.length === 0) {
        setSlotsError(
          'No future available slots found in the returned results.'
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load available slots';
      setSlotsError(errorMessage);
      console.error('Error fetching available slots:', err);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleSelectSlot = (slot: TimeSlotDTO) => {
    // Convert LocalDate and LocalTime from backend to form values
    const startTime =
      typeof slot.startTime === 'string'
        ? slot.startTime.substring(0, 5) // HH:mm format
        : slot.startTime;
    const endTime =
      typeof slot.endTime === 'string'
        ? slot.endTime.substring(0, 5) // HH:mm format
        : slot.endTime;

    setNewDate(slot.slotDate);
    setNewStartTime(startTime);
    setNewEndTime(endTime);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!newDate) {
      setError('Please select a new date');
      return;
    }
    if (!newStartTime) {
      setError('Please select a start time');
      return;
    }
    if (!newEndTime) {
      setError('Please select an end time');
      return;
    }

    // Validate time format
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newStartTime)) {
      setError('Invalid start time format (use HH:mm)');
      return;
    }
    if (!timeRegex.test(newEndTime)) {
      setError('Invalid end time format (use HH:mm)');
      return;
    }

    // Validate end time is after start time
    const startMinutes =
      parseInt(newStartTime.split(':')[0]) * 60 +
      parseInt(newStartTime.split(':')[1]);
    const endMinutes =
      parseInt(newEndTime.split(':')[0]) * 60 +
      parseInt(newEndTime.split(':')[1]);
    if (endMinutes <= startMinutes) {
      setError('End time must be after start time');
      return;
    }

    // Validate date is in the future
    const selectedDate = new Date(newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setError('Please select a future date');
      return;
    }

    try {
      setLocalLoading(true);
      const rescheduleData: RescheduleDTO = {
        newDate,
        newStartTime,
        newEndTime,
        reason: reason || '',
      };
      await onReschedule(rescheduleData);
      // Reset form on success
      setNewDate('');
      setNewStartTime('');
      setNewEndTime('');
      setReason('');
      setSlotsError(null);
      setAvailableSlots([]);
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to reschedule appointment';
      setError(errorMessage);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleClose = () => {
    if (!localLoading && !isLoading) {
      setNewDate('');
      setNewStartTime('');
      setNewEndTime('');
      setReason('');
      setError(null);
      setSlotsError(null);
      setAvailableSlots([]);
      onClose();
    }
  };

  if (!isOpen || !appointment) {
    return null;
  }

  return (
    <>
      <style>{animationStyles}</style>
      <div className='fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn'>
        <div className='bg-white max-h-[90vh] overflow-auto no-scrollbar dark:bg-gray-900 rounded-xl shadow-2xl shadow-gray-600 max-w-md w-full mx-4 animate-slideUp'>
          {/* Header */}
          <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Reschedule Appointment
            </h2>
            <button
              onClick={handleClose}
              disabled={localLoading || isLoading}
              className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50'
            >
              <svg
                className='w-6 h-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className='px-6 py-4 space-y-4'>
            {/* Appointment Info */}
            <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm'>
              <p className='text-gray-700 dark:text-gray-300'>
                <span className='font-medium'>Current: </span>
                {new Date(appointment.appointmentDate).toLocaleDateString(
                  'en-US',
                  {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }
                )}{' '}
                at {appointment.startTime}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400'>
                {error}
              </div>
            )}

            {/* Available Slots Section */}
            <div className='border-t border-gray-200 dark:border-gray-700 pt-4'>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='text-sm font-medium text-gray-900 dark:text-white'>
                  Available Slots
                </h3>
                {slotsLoading && (
                  <div className='flex items-center gap-2'>
                    <div className='w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                      Loading...
                    </span>
                  </div>
                )}
              </div>

              {slotsError ? (
                <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-700 dark:text-yellow-400'>
                  {slotsError}
                </div>
              ) : availableSlots.length > 0 ? (
                <div className='max-h-48 overflow-y-auto no-scrollbar space-y-2'>
                  {availableSlots.map((slot, idx) => {
                    const slotDate = new Date(slot.slotDate);
                    const dateStr = slotDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      weekday: 'short',
                    });
                    const startTime =
                      typeof slot.startTime === 'string'
                        ? slot.startTime.substring(0, 5)
                        : slot.startTime;
                    const endTime =
                      typeof slot.endTime === 'string'
                        ? slot.endTime.substring(0, 5)
                        : slot.endTime;

                    const isSelected =
                      newDate === slot.slotDate &&
                      newStartTime === startTime &&
                      newEndTime === endTime;

                    return (
                      <button
                        key={idx}
                        type='button'
                        onClick={() => handleSelectSlot(slot)}
                        className={`w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                        }`}
                      >
                        <div className='flex items-center justify-between'>
                          <span className='font-medium'>{dateStr}</span>
                          <span>
                            {startTime} - {endTime}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : !slotsLoading ? (
                <div className='text-center py-3 text-sm text-gray-500 dark:text-gray-400'>
                  No available slots found. You may enter times manually below.
                </div>
              ) : null}
            </div>

            {/* New Date */}
            <div>
              <label
                htmlFor='newDate'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
              >
                New Date <span className='text-red-500'>*</span>
              </label>
              <input
                type='date'
                id='newDate'
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                disabled={localLoading || isLoading}
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* New Start Time */}
            <div>
              <label
                htmlFor='newStartTime'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
              >
                Start Time <span className='text-red-500'>*</span>
              </label>
              <input
                type='time'
                id='newStartTime'
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                disabled={localLoading || isLoading}
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            {/* New End Time */}
            <div>
              <label
                htmlFor='newEndTime'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
              >
                End Time <span className='text-red-500'>*</span>
              </label>
              <input
                type='time'
                id='newEndTime'
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                disabled={localLoading || isLoading}
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            {/* Reason */}
            <div>
              <label
                htmlFor='reason'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
              >
                Reason for Reschedule
              </label>
              <textarea
                id='reason'
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={localLoading || isLoading}
                rows={3}
                placeholder="Optional: Explain why you're rescheduling"
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
              />
            </div>

            {/* Actions */}
            <div className='flex gap-3 pt-4'>
              <button
                type='button'
                onClick={handleClose}
                disabled={localLoading || isLoading}
                className='flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={localLoading || isLoading}
                className='flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
              >
                {localLoading || isLoading ? (
                  <>
                    <svg
                      className='w-4 h-4 animate-spin'
                      fill='none'
                      stroke='currentColor'
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
                    Rescheduling...
                  </>
                ) : (
                  'Reschedule'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
