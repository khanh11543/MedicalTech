import { useEffect, useState } from 'react';
import { AppointmentDTO } from '../../services/appointmentService';
import appointmentService from '../../services/appointmentService';

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

interface AppointmentSummaryModalProps {
  appointmentId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatDateTime = (dateTime: string) => {
  const date = new Date(dateTime);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return '✓';
    case 'CANCELLED':
      return '✕';
    case 'NO_SHOW':
      return '!';
    case 'RESCHEDULED':
      return '↻';
    default:
      return '●';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        badge:
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        icon: 'text-green-600 dark:text-green-400',
      };
    case 'CANCELLED':
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        icon: 'text-red-600 dark:text-red-400',
      };
    case 'NO_SHOW':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        badge:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        icon: 'text-yellow-600 dark:text-yellow-400',
      };
    case 'RESCHEDULED':
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        badge:
          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        icon: 'text-blue-600 dark:text-blue-400',
      };
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-800',
        border: 'border-gray-200 dark:border-gray-700',
        badge: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        icon: 'text-gray-600 dark:text-gray-400',
      };
  }
};

const getStatusLabel = (status: string) => {
  return status.replace(/_/g, ' ');
};

export default function AppointmentSummaryModal({
  appointmentId,
  isOpen,
  onClose,
}: AppointmentSummaryModalProps) {
  const [appointment, setAppointment] = useState<AppointmentDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && appointmentId) {
      const fetchAppointment = async () => {
        try {
          setLoading(true);
          setError(null);
          const data =
            await appointmentService.getDoctorAppointmentDetail(appointmentId);
          setAppointment(data);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to load appointment';
          setError(errorMessage);
          console.error('Error fetching appointment:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchAppointment();
    }
  }, [isOpen, appointmentId]);

  if (!isOpen) return null;

  return (
    <>
      <style>{animationStyles}</style>
      <div className='fixed inset-0 z-50 overflow-y-auto'>
        {/* Animated Backdrop */}
        <div
          className='fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm animate-fadeIn'
          onClick={onClose}
        ></div>

        {/* Modal Container */}
        <div className='relative min-h-screen flex items-center justify-center p-4'>
          <div className='relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl animate-slideUp overflow-hidden'>
            {/* Loading State */}
            {loading && (
              <div className='px-6 py-12 text-center'>
                <svg
                  className='w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4'
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
                <p className='text-gray-600 dark:text-gray-400 font-medium'>
                  Loading appointment summary...
                </p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className='px-6 py-8'>
                <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
                  <div className='flex gap-3'>
                    <svg
                      className='w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5'
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                        clipRule='evenodd'
                      />
                    </svg>
                    <div className='flex-1'>
                      <h3 className='font-semibold text-red-900 dark:text-red-200 mb-1'>
                        Failed to Load Appointment
                      </h3>
                      <p className='text-sm text-red-800 dark:text-red-300'>
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            {!loading && !error && appointment && (
              <>
                {/* Header */}
                <div className='bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 px-6 py-6 relative overflow-hidden'>
                  <div className='absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl'></div>
                  <div className='relative flex items-start justify-between'>
                    <div>
                      <p className='text-blue-100 text-sm font-medium mb-2'>
                        Appointment Summary
                      </p>
                      <h3 className='text-2xl font-bold text-white'>
                        APT-{appointment.id.toString().padStart(5, '0')}
                      </h3>
                    </div>
                    <button
                      onClick={onClose}
                      className='text-white/80 hover:text-white bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors'
                    >
                      <svg
                        className='w-6 h-6'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                        strokeWidth='2'
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

                {/* Content */}
                <div className='px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto'>
                  {/* Status Badge */}
                  <div
                    className={`${getStatusColor(appointment.status).bg} border ${getStatusColor(appointment.status).border} rounded-xl p-4`}
                  >
                    <div className='flex items-center gap-3'>
                      <div
                        className={`text-2xl ${getStatusColor(appointment.status).icon}`}
                      >
                        {getStatusIcon(appointment.status)}
                      </div>
                      <div>
                        <p className='text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider'>
                          Current Status
                        </p>
                        <p
                          className={`text-lg font-bold ${getStatusColor(appointment.status).badge} inline-block rounded-full px-3 py-1 mt-1 text-sm`}
                        >
                          {getStatusLabel(appointment.status)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Schedule */}
                  <div className='bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700'>
                    <h4 className='font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
                      <span className='text-xl'>📅</span>
                      Appointment Schedule
                    </h4>
                    <div className='space-y-4'>
                      <div>
                        <span className='text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider'>
                          Date & Time
                        </span>
                        <p className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
                          {formatDateTime(appointment.appointmentDate)}
                        </p>
                      </div>
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <span className='text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider'>
                            Start Time
                          </span>
                          <p className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
                            {appointment.startTime}
                          </p>
                        </div>
                        <div>
                          <span className='text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider'>
                            End Time
                          </span>
                          <p className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
                            {appointment.endTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className='bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700'>
                    <h4 className='font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
                      <span className='text-xl'>👤</span>
                      Patient Information
                    </h4>
                    <div className='space-y-3'>
                      <div>
                        <span className='text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider'>
                          Full Name
                        </span>
                        <p className='mt-1 text-sm font-medium text-gray-900 dark:text-white'>
                          {appointment.patientName}
                        </p>
                      </div>
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <span className='text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider'>
                            Email
                          </span>
                          <p className='mt-1 text-sm text-gray-700 dark:text-gray-300 break-all'>
                            {appointment.patientEmail}
                          </p>
                        </div>
                        <div>
                          <span className='text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider'>
                            Phone
                          </span>
                          <p className='mt-1 text-sm text-gray-700 dark:text-gray-300'>
                            {appointment.patientPhone}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Symptoms */}
                  {appointment.symptoms && (
                    <div className='bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700'>
                      <h4 className='font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
                        <span className='text-xl'>🏥</span>
                        Symptoms
                      </h4>
                      <p className='text-sm text-gray-700 dark:text-gray-300'>
                        {appointment.symptoms}
                      </p>
                    </div>
                  )}

                  {/* Cancellation Reason */}
                  {appointment.cancellationReason && (
                    <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5'>
                      <h4 className='font-semibold text-red-900 dark:text-red-200 mb-3 flex items-center gap-2'>
                        <span className='text-xl'>❌</span>
                        Cancellation Reason
                      </h4>
                      <p className='text-sm text-red-800 dark:text-red-300'>
                        {appointment.cancellationReason}
                      </p>
                    </div>
                  )}

                  {/* Checked In Time */}
                  {appointment.checkedInAt &&
                    appointment.status === 'COMPLETED' && (
                      <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5'>
                        <h4 className='font-semibold text-green-900 dark:text-green-200 mb-3 flex items-center gap-2'>
                          <span className='text-xl'>✓</span>
                          Checked In At
                        </h4>
                        <p className='text-sm text-green-800 dark:text-green-300'>
                          {formatDateTime(appointment.checkedInAt)}
                        </p>
                      </div>
                    )}
                </div>

                {/* Footer */}
                <div className='px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3'>
                  <button
                    onClick={onClose}
                    className='px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg'
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
