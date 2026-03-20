import React, { useState, useEffect, useMemo } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import BlockSlotModal from '../../components/modals/BlockSlotModal';
import BlockConflictModal from '../../components/modals/BlockConflictModal';
import { useToast } from '../../hooks/useToast';
import doctorScheduleService, {
  TimeSlotDTO,
  BlockSlotResponseDTO,
  ConflictingAppointmentDTO,
} from '../../services/doctorScheduleService';

// ============= Icons =============
const IconCalendar = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
    strokeWidth={1.8}
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
    />
  </svg>
);

const IconFilter = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
    strokeWidth={1.8}
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'
    />
  </svg>
);

const IconLock = ({ className }: { className?: string }) => (
  <svg className={className} fill='currentColor' viewBox='0 0 24 24'>
    <path d='M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm0 20c-4.96 0-9-4.04-9-9s4.04-9 9-9 9 4.04 9 9-4.04 9-9 9zm3.5-9c0 1.933-1.567 3.5-3.5 3.5S8.5 13.933 8.5 12 10.067 8.5 12 8.5s3.5 1.567 3.5 3.5z' />
  </svg>
);

const IconAlertTriangle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
    strokeWidth={1.8}
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M12 9v2m0 4v2m0 0v2m0-6v0m0 0H9m3 0h3m-6-6l.75-1.5m3.5 0l.75 1.5M9 20h6a2 2 0 002-2V8a2 2 0 00-2-2H9a2 2 0 00-2 2v10a2 2 0 002 2z'
    />
  </svg>
);

const IconChevronDown = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
    strokeWidth={2}
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M19 14l-7 7m0 0l-7-7m7 7V3'
    />
  </svg>
);

// ============= Helper Functions =============
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string): string {
  try {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch {
    return timeStr;
  }
}

// ============= Main Component =============
export default function DoctorScheduleBlockSlots() {
  const { showToast } = useToast();

  // State
  const [slots, setSlots] = useState<TimeSlotDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('AVAILABLE');

  // Modal states
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotDTO | null>(null);
  const [conflictingAppointments, setConflictingAppointments] = useState<
    ConflictingAppointmentDTO[]
  >([]);
  const [isBlocking, setIsBlocking] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Load slots on mount and when filters change
  useEffect(() => {
    loadSlots();
  }, [dateFilter]);

  const loadSlots = async () => {
    try {
      setLoading(true);
      const startDate = dateFilter || new Date().toISOString().split('T')[0];
      const endDate = dateFilter
        ? dateFilter
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];

      const allSlots = await doctorScheduleService.listTimeSlots(
        startDate,
        endDate
      );
      setSlots(allSlots);
    } catch (error) {
      console.error('Error loading slots:', error);
      showToast('Failed to load time slots', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter and group slots by date
  const groupedSlots = useMemo(() => {
    let result = [...slots];

    // Status filter
    if (statusFilter) {
      result = result.filter((s) => s.status === statusFilter);
    }

    // Sort by date and time
    result.sort((a, b) => {
      const dateA = new Date(`${a.slotDate}T${a.startTime}`);
      const dateB = new Date(`${b.slotDate}T${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    });

    // Group by date
    const grouped = new Map<string, TimeSlotDTO[]>();
    result.forEach((slot) => {
      if (!grouped.has(slot.slotDate)) {
        grouped.set(slot.slotDate, []);
      }
      grouped.get(slot.slotDate)!.push(slot);
    });

    // Convert to array of {date, slots}
    return Array.from(grouped.entries()).map(([date, dateSlots]) => ({
      date,
      displayDate: formatDate(date),
      slots: dateSlots,
    }));
  }, [slots, statusFilter]);

  // Toggle date expansion
  const toggleDateExpansion = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  // Handle block slot click
  const handleBlockClick = (slot: TimeSlotDTO) => {
    setSelectedSlot(slot);
    setBlockModalOpen(true);
  };

  // Handle block confirmation
  const handleBlockConfirm = async (
    reason: string
  ): Promise<BlockSlotResponseDTO> => {
    if (!selectedSlot) throw new Error('No slot selected');

    try {
      setIsBlocking(true);
      const response = await doctorScheduleService.blockTimeSlot(
        selectedSlot.id || 0,
        reason
      );

      if (response.hasConflicts && response.conflictingAppointments) {
        // Show conflicts
        setConflictingAppointments(response.conflictingAppointments);
        setBlockModalOpen(false);
        setConflictModalOpen(true);
      } else if (response.success) {
        showToast('Time slot blocked successfully', 'success');
        setBlockModalOpen(false);
        await loadSlots();
      }

      return response;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to block slot';
      showToast(message, 'error');
      throw error;
    } finally {
      setIsBlocking(false);
    }
  };

  // Handle conflict resolution - reschedule all and then block
  const handleConflictResolved = async () => {
    if (!selectedSlot) return;

    try {
      setIsBlocking(true);
      // All appointments have been rescheduled by the conflict modal
      // Now attempt to block the slot again
      const response = await doctorScheduleService.blockTimeSlot(
        selectedSlot.id || 0,
        'Blocked after rescheduling appointments'
      );

      if (response.success) {
        showToast(
          'Time slot blocked successfully after rescheduling appointments',
          'success'
        );
        setConflictModalOpen(false);
        setSelectedSlot(null);
        await loadSlots();
      } else {
        showToast('Failed to block slot: ' + response.message, 'error');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to block slot';
      showToast(message, 'error');
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <>
      <PageMeta
        title='Block Slots | Doctor Panel'
        description='Block or manage your time slots'
      />
      <PageBreadcrumb pageTitle='Block Time Slots' />

      <div className='space-y-6'>
        {/* Filters */}
        <div className='bg-white dark:bg-white/[0.05] rounded-xl border border-gray-200 dark:border-gray-700 p-4'>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                <IconCalendar className='w-4 h-4 inline mr-2' />
                Filter by Date
              </label>
              <input
                type='date'
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div className='flex-1'>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                <IconFilter className='w-4 h-4 inline mr-2' />
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='AVAILABLE'>Available Slots</option>
                <option value='BLOCKED'>Blocked Slots</option>
                <option value='BOOKED'>Booked Slots</option>
                <option value=''>All Slots</option>
              </select>
            </div>
          </div>
        </div>

        {/* Slots Table */}
        <div className='rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05]'>
          <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Time Slots (
              {
                slots.filter((s) => !statusFilter || s.status === statusFilter)
                  .length
              }
              )
            </h3>
          </div>

          {loading ? (
            <div className='px-6 py-12 text-center'>
              <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400' />
              <p className='text-gray-600 dark:text-gray-400 mt-2'>
                Loading time slots...
              </p>
            </div>
          ) : groupedSlots.length > 0 ? (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                <thead className='bg-gray-50 dark:bg-gray-800/50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase'>
                      Date
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase'>
                      Time
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase'>
                      Status
                    </th>
                    <th className='px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                  {groupedSlots.map((group) => (
                    <React.Fragment key={group.date}>
                      {/* Date Header Row */}
                      <tr
                        className='hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer bg-gray-100/50 dark:bg-gray-800/20'
                        onClick={() => toggleDateExpansion(group.date)}
                      >
                        <td colSpan={4} className='px-6 py-4'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <IconChevronDown
                                className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
                                  expandedDates.has(group.date)
                                    ? 'rotate-180'
                                    : ''
                                }`}
                              />
                              <span className='font-semibold text-gray-900 dark:text-white'>
                                {group.displayDate}
                              </span>
                              <span className='text-sm text-gray-600 dark:text-gray-400'>
                                ({group.slots.length}{' '}
                                {group.slots.length === 1 ? 'slot' : 'slots'})
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Slot Rows - Shown when date is expanded */}
                      {expandedDates.has(group.date) &&
                        group.slots.map((slot) => (
                          <tr
                            key={slot.id}
                            className='hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors'
                          >
                            <td className='px-6 py-4 text-sm text-gray-600 dark:text-gray-400'>
                              {/* Empty - date already shown in header */}
                            </td>
                            <td className='px-6 py-4 text-sm text-gray-600 dark:text-gray-400'>
                              {formatTime(slot.startTime)} -{' '}
                              {formatTime(slot.endTime)}
                            </td>
                            <td className='px-6 py-4'>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  slot.status === 'AVAILABLE'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                    : slot.status === 'BLOCKED'
                                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                      : slot.status === 'BOOKED'
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                                }`}
                              >
                                {slot.status}
                              </span>
                            </td>
                            <td className='px-6 py-4 text-right'>
                              {slot.status === 'AVAILABLE' ? (
                                <button
                                  onClick={() => handleBlockClick(slot)}
                                  className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors disabled:opacity-50'
                                  disabled={isBlocking}
                                >
                                  Block
                                </button>
                              ) : (
                                <span className='text-gray-400 text-sm'>—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='px-6 py-12 text-center'>
              <IconAlertTriangle className='w-12 h-12 text-gray-400 mx-auto mb-3' />
              <p className='text-gray-600 dark:text-gray-400'>
                {statusFilter === 'AVAILABLE'
                  ? 'No available slots found'
                  : 'No slots found'}
              </p>
              <p className='text-sm text-gray-500 dark:text-gray-500 mt-1'>
                Try adjusting your filters or selecting a different date
              </p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className='rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/5 p-4'>
          <div className='flex gap-3'>
            <IconLock className='w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5' />
            <div className='text-sm text-blue-800 dark:text-blue-300'>
              <p className='font-medium mb-1'>Blocking Time Slots:</p>
              <ul className='space-y-1 text-xs list-disc list-inside'>
                <li>You must provide a reason for blocking each slot</li>
                <li>
                  If a slot has booked appointments, you'll need to reschedule
                  them first
                </li>
                <li>
                  Once blocked, the slot won't be available for new bookings
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Block Slot Modal */}
      {selectedSlot && (
        <BlockSlotModal
          isOpen={blockModalOpen}
          slotDate={formatDate(selectedSlot.slotDate)}
          slotTime={`${formatTime(selectedSlot.startTime)} - ${formatTime(selectedSlot.endTime)}`}
          onConfirm={handleBlockConfirm}
          onConflicts={(conflicts) => {
            setConflictingAppointments(conflicts);
            setBlockModalOpen(false);
            setConflictModalOpen(true);
          }}
          onCancel={() => {
            setBlockModalOpen(false);
            setSelectedSlot(null);
          }}
          isLoading={isBlocking}
        />
      )}

      {/* Conflict Resolution Modal */}
      {selectedSlot && (
        <BlockConflictModal
          isOpen={conflictModalOpen}
          slotDate={formatDate(selectedSlot.slotDate)}
          slotTime={`${formatTime(selectedSlot.startTime)} - ${formatTime(selectedSlot.endTime)}`}
          conflictingAppointments={conflictingAppointments}
          onRescheduleAll={handleConflictResolved}
          onCancel={() => {
            setConflictModalOpen(false);
            setSelectedSlot(null);
            setConflictingAppointments([]);
          }}
          isLoading={isBlocking}
        />
      )}
    </>
  );
}
