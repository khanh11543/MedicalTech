import { useState, useEffect, useRef } from 'react';
import { AppointmentDTO } from '../../services/appointmentService';

interface PendingConfirmationTableProps {
  appointments: AppointmentDTO[];
  onConfirm?: (appointment: AppointmentDTO) => void;
  onCancel?: (appointment: AppointmentDTO) => void;
  onReschedule?: (appointment: AppointmentDTO) => void;
}

const calculateHoursSinceCreated = (createdAt: string): number => {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  return diffHours;
};

const formatDateTime = (dateTime: string) => {
  const date = new Date(dateTime);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function PendingConfirmationTable({
  appointments,
  onConfirm,
  onCancel,
  onReschedule,
}: PendingConfirmationTableProps) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!openMenuId) {
      return; // Only listen when menu is open
    }

    const handleClickOutside = (event: MouseEvent) => {
      // If click is inside the menu, don't close it
      if (menuRef.current && menuRef.current.contains(event.target as Node)) {
        return;
      }

      // If click is on a menu trigger button, don't close it yet (let button handler deal with it)
      if ((event.target as HTMLElement).closest('[data-menu-trigger]')) {
        return;
      }

      // Otherwise close the menu
      setOpenMenuId(null);
      setMenuPosition(null);
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuId]);

  if (appointments.length === 0) {
    return (
      <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]'>
        <div className='px-6 py-12 text-center text-gray-500 dark:text-gray-400'>
          No pending confirmations
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`rounded-2xl border ${appointments.length <= 5 && 'mb-32'} border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden`}
      >
        <div className='overflow-x-auto min-h-[60vh]'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                  Code
                </th>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                  Created
                </th>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                  Appointment Time
                </th>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                  Patient
                </th>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                  Type
                </th>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                  Time Since Created
                </th>
                <th className='px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 dark:divide-gray-800'>
              {appointments.map((appointment, index) => {
                const hoursSince = calculateHoursSinceCreated(
                  appointment.createdAt
                );
                const isOverdue = hoursSince > 24;

                return (
                  <tr
                    key={appointment.id}
                    className={`${index == appointments.length - 1 ? 'mb-[8rem]' : ''} hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      isOverdue ? 'bg-orange-50 dark:bg-orange-900/10' : ''
                    }`}
                  >
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        {isOverdue && (
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
                        )}
                        <span
                          className={`font-semibold ${
                            isOverdue
                              ? 'text-orange-700 dark:text-orange-300'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          APT-{appointment.id.toString().padStart(5, '0')}
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>
                        {formatDateTime(appointment.createdAt)}
                      </p>
                    </td>
                    <td className='px-6 py-4'>
                      <p className='text-sm font-medium text-gray-900 dark:text-white'>
                        {formatDateTime(appointment.appointmentDate)}
                      </p>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex flex-col gap-1'>
                        <p className='font-medium text-gray-900 dark:text-white'>
                          {appointment.patientName}
                        </p>
                        <p className='text-xs text-gray-600 dark:text-gray-400'>
                          {appointment.patientEmail}
                        </p>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <p className='text-sm text-gray-700 dark:text-gray-300'>
                        Consultation
                      </p>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            isOverdue
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}
                        >
                          {hoursSince}h ago
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4 text-right'>
                      <div className='relative'>
                        <button
                          data-menu-trigger
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('button clicked');
                            console.log(openMenuId + ' - ' + appointment.id);
                            if (openMenuId === appointment.id) {
                              setOpenMenuId(null);
                              setMenuPosition(null);
                            } else {
                              const rect = (
                                e.currentTarget as HTMLButtonElement
                              ).getBoundingClientRect();
                              console.log('rect:', rect);
                              if (rect) {
                                setMenuPosition({
                                  //   top: rect.bottom + window.scrollY,
                                  //   right: window.innerWidth - rect.right,
                                  top: rect.top,
                                  right: rect.height * 2,
                                });
                              }
                              setOpenMenuId(appointment.id);
                            }
                          }}
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dropdown Menu - Inline Fixed Positioning */}
      {openMenuId && menuPosition && (
        <div
          ref={menuRef}
          className='fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-48'
          style={{
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
          }}
        >
          <button
            onClick={() => {
              const appointment = appointments.find(
                (apt) => apt.id === openMenuId
              );
              if (appointment && onConfirm) {
                onConfirm(appointment);
              }
              setOpenMenuId(null);
              setMenuPosition(null);
            }}
            className='w-full px-4 py-2.5 text-left text-sm text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 first:rounded-t-lg'
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
                d='M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            Confirm
          </button>
          <button
            onClick={() => {
              const appointment = appointments.find(
                (apt) => apt.id === openMenuId
              );
              if (appointment && onReschedule) {
                onReschedule(appointment);
              }
              setOpenMenuId(null);
              setMenuPosition(null);
            }}
            className='w-full px-4 py-2.5 text-left text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700'
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
                d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
              />
            </svg>
            Request Reschedule
          </button>
          <button
            onClick={() => {
              const appointment = appointments.find(
                (apt) => apt.id === openMenuId
              );
              if (appointment && onCancel) {
                onCancel(appointment);
              }
              setOpenMenuId(null);
              setMenuPosition(null);
            }}
            className='w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 last:rounded-b-lg'
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
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
            Cancel
          </button>
        </div>
      )}
    </>
  );
}
