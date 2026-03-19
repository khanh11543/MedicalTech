import { useState, useRef, useEffect } from 'react';
import { AppointmentDTO } from '../../services/appointmentService';
import MedicalRecordDetailModal from '../modals/MedicalRecordDetailModal';
import MedicalRecordsListModal from '../modals/MedicalRecordsListModal';
import { MedicalRecordDTO } from '../../services/medicalRecordService';

interface HistoryAppointmentTableProps {
  appointments: AppointmentDTO[];
  onViewDetail?: (appointment: AppointmentDTO) => void;
  onViewMedicalRecord?: (appointment: AppointmentDTO) => void;
  isDoctorView?: boolean;
}

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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'NO_SHOW':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'RESCHEDULED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const getStatusLabel = (status: string) => {
  return status.replace(/_/g, ' ');
};

export default function HistoryAppointmentTable({
  appointments,
  onViewDetail,
  isDoctorView = true,
}: HistoryAppointmentTableProps) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Medical records modals
  const [recordsListOpen, setRecordsListOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [recordDetailOpen, setRecordDetailOpen] = useState(false);
  const [selectedAppointmentForRecords, setSelectedAppointmentForRecords] =
    useState<AppointmentDTO | null>(null);

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
          No appointment history
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden'>
        <div className='overflow-x-auto pb-32'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                  Patient
                </th>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                  Date & Time
                </th>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                  Type
                </th>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                  Status
                </th>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                  Completion
                </th>
                <th className='px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 dark:divide-gray-800'>
              {appointments.map((appointment) => (
                <tr
                  key={appointment.id}
                  className='hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'
                >
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
                    <p className='text-sm font-medium text-gray-900 dark:text-white'>
                      {formatDateTime(appointment.appointmentDate)}
                    </p>
                  </td>
                  <td className='px-6 py-4'>
                    <p className='text-sm text-gray-700 dark:text-gray-300'>
                      Consultation
                    </p>
                  </td>
                  <td className='px-6 py-4'>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        appointment.status
                      )}`}
                    >
                      {getStatusLabel(appointment.status)}
                    </span>
                  </td>
                  <td className='px-6 py-4'>
                    <p className='text-xs text-gray-600 dark:text-gray-400'>
                      {appointment.status === 'COMPLETED'
                        ? appointment.checkedInAt
                          ? formatDateTime(appointment.checkedInAt)
                          : 'Not recorded'
                        : appointment.status === 'CANCELLED'
                          ? 'Cancelled'
                          : appointment.status === 'NO_SHOW'
                            ? 'No show'
                            : 'Rescheduled'}
                    </p>
                  </td>
                  <td className='px-6 py-4 text-right'>
                    <div className='relative'>
                      <button
                        data-menu-trigger
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (openMenuId === appointment.id) {
                            setOpenMenuId(null);
                            setMenuPosition(null);
                          } else {
                            const rect = (
                              e.currentTarget as HTMLButtonElement
                            ).getBoundingClientRect();
                            setMenuPosition({
                              top: rect.top,
                              right: rect.height * 2,
                            });
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
              ))}
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
              const apt = appointments.find((apt) => apt.id === openMenuId);
              if (apt && onViewDetail) {
                onViewDetail(apt);
              }
              setOpenMenuId(null);
              setMenuPosition(null);
            }}
            className='w-full px-4 py-2.5 text-left text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 first:rounded-t-lg'
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
                d='M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'
              />
            </svg>
            View Detail
          </button>
          <button
            onClick={() => {
              const apt = appointments.find((apt) => apt.id === openMenuId);
              if (apt) {
                setSelectedAppointmentForRecords(apt);
                setRecordsListOpen(true);
              }
              setOpenMenuId(null);
              setMenuPosition(null);
            }}
            className='w-full px-4 py-2.5 text-left text-sm text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-3 last:rounded-b-lg'
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
                d='M9 4.5v15m6-15v15m-11.995.75V3.75a2.25 2.25 0 0 1 2.25-2.25h15.5a2.25 2.25 0 0 1 2.25 2.25v16.5c0 1.035-.84 1.89-1.89 1.89H3.75a1.89 1.89 0 0 1-1.895-1.89Z'
              />
            </svg>
            View Medical Records
          </button>
        </div>
      )}

      {/* Medical Records List Modal */}
      <MedicalRecordsListModal
        isOpen={recordsListOpen}
        patientId={selectedAppointmentForRecords?.patientId}
        onClose={() => {
          setRecordsListOpen(false);
          setSelectedAppointmentForRecords(null);
        }}
        onSelectRecord={(record: MedicalRecordDTO) => {
          setSelectedRecordId(record.id);
          setRecordDetailOpen(true);
          setRecordsListOpen(false);
        }}
        isDoctorView={isDoctorView}
      />

      {/* Medical Record Detail Modal */}
      <MedicalRecordDetailModal
        isOpen={recordDetailOpen}
        recordId={selectedRecordId ?? 0}
        onClose={() => {
          setRecordDetailOpen(false);
          setSelectedRecordId(null);
          setRecordsListOpen(true);
        }}
        isDoctorView={isDoctorView}
      />
    </>
  );
}
