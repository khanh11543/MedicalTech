import { useState, useMemo, useEffect } from 'react';
import { AppointmentDTO } from '../../services/appointmentService';

interface ExpandableAppointmentTableProps {
  appointments: AppointmentDTO[];
  onViewDetails?: (appointment: AppointmentDTO) => void;
  onReschedule?: (appointment: AppointmentDTO) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'CHECKED_IN':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'COMPLETED':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

export default function ExpandableAppointmentTable({
  appointments,
  onViewDetails,
  onReschedule,
}: ExpandableAppointmentTableProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is on a menu button or inside a dropdown menu
      const isMenuButton = target.closest('button[class*="w-8 h-8"]');
      const isDropdownMenu = target.closest('[class*="absolute right-0"]');

      if (!isMenuButton && !isDropdownMenu) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group appointments by date
  const groupedAppointments = useMemo(() => {
    const groups: { [key: string]: AppointmentDTO[] } = {};
    appointments.forEach((apt) => {
      if (!groups[apt.appointmentDate]) {
        groups[apt.appointmentDate] = [];
      }
      groups[apt.appointmentDate].push(apt);
    });

    // Sort dates
    return Object.entries(groups)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .reduce(
        (acc, [date, apts]) => {
          acc[date] = apts;
          return acc;
        },
        {} as { [key: string]: AppointmentDTO[] }
      );
  }, [appointments]);

  const toggleDateExpand = (date: string) => {
    setExpandedDates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
  };

  if (appointments.length === 0) {
    return (
      <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]'>
        <div className='px-6 py-12 text-center text-gray-500 dark:text-gray-400'>
          No upcoming appointments
        </div>
      </div>
    );
  }

  return (
    <div
      className={`space-y-2 ${Object.entries(groupedAppointments).length <= 3 ? 'pb-32' : ''}`}
    >
      {Object.entries(groupedAppointments).map(([date, dateAppointments]) => (
        <div
          key={date}
          className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden'
        >
          {/* Date Header */}
          <button
            onClick={() => toggleDateExpand(date)}
            className='w-full px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'
          >
            <div className='flex items-center gap-3'>
              <svg
                className={`w-5 h-5 text-blue-600 dark:text-blue-400 transition-transform ${
                  expandedDates.has(date) ? 'rotate-90' : ''
                }`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                />
              </svg>
              <h3 className='text-lg font-semibold text-gray-800 dark:text-white'>
                {formatDate(date)}
              </h3>
              <span className='ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
                {dateAppointments.length} appointment
                {dateAppointments.length !== 1 ? 's' : ''}
              </span>
            </div>
          </button>

          {/* Expanded Content */}
          {expandedDates.has(date) && (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <tbody
                  className={`divide-y divide-gray-200 dark:divide-gray-800`}
                >
                  {dateAppointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className='hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'
                    >
                      <td className='px-6 py-4'>
                        <div className='flex flex-col gap-1'>
                          <p className='font-medium text-gray-900 dark:text-white'>
                            {appointment.patientName}
                          </p>
                          <p className='text-sm text-gray-600 dark:text-gray-400'>
                            {appointment.patientEmail}
                          </p>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex flex-col gap-1'>
                          <p className='text-sm font-medium text-gray-900 dark:text-white'>
                            {formatTime(appointment.startTime)} -{' '}
                            {formatTime(appointment.endTime)}
                          </p>
                          <p className='text-xs text-gray-600 dark:text-gray-400'>
                            {appointment.patientPhone}
                          </p>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex flex-col gap-1'>
                          <p className='text-sm text-gray-700 dark:text-gray-300 line-clamp-2'>
                            {appointment.reasonForVisit || appointment.symptoms || 'No reason noted'}
                          </p>
                          {appointment.appointmentType && (
                            <span className='text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide'>
                              {appointment.appointmentType.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {appointment.status}
                        </span>
                      </td>
                      <td className='px-6 py-4 text-right'>
                        <div className='relative'>
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === appointment.id
                                  ? null
                                  : appointment.id
                              )
                            }
                            className='inline-flex items-center justify-center w-8 h-8 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors'
                          >
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              fill='none'
                              viewBox='0 0 24 24'
                              strokeWidth='1.5'
                              stroke='currentColor'
                              className='w-5 h-5'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                d='M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z'
                              />
                            </svg>
                          </button>

                          {/* Dropdown Menu */}
                          {openMenuId === appointment.id && (
                            <div
                              onMouseDown={(e) => e.stopPropagation()}
                              className='absolute right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-48'
                            >
                              <button
                                onClick={() => {
                                  if (onViewDetails) {
                                    onViewDetails(appointment);
                                  }
                                  setOpenMenuId(null);
                                }}
                                className='w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 first:rounded-t-lg'
                              >
                                <svg
                                  className='w-4 h-4'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                                  />
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                  />
                                </svg>
                                View
                              </button>
                              <button
                                onClick={() => {
                                  onReschedule?.(appointment);
                                  setOpenMenuId(null);
                                }}
                                className='w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700'
                              >
                                <svg
                                  className='w-4 h-4'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                                  />
                                </svg>
                                Reschedule
                              </button>

                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr
                    key={'extra-space'}
                    className='hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors min-h-[10rem] block'
                  ></tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
