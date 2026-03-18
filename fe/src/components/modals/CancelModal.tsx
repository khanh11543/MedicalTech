import { useState, useEffect } from 'react';
import { AppointmentDTO, CancelDTO } from '../../services/appointmentService';

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

interface CancelModalProps {
  isOpen: boolean;
  appointment: AppointmentDTO | null;
  onClose: () => void;
  onCancel: (data: CancelDTO) => Promise<void>;
  isLoading?: boolean;
}

export default function CancelModal({
  isOpen,
  appointment,
  onClose,
  onCancel,
  isLoading = false,
}: CancelModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setReason('');
      setError(null);
    }
  }, [isOpen]);

  const handleCancel = async () => {
    // Validate reason
    if (!reason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    if (reason.trim().length < 5) {
      setError('Reason must be at least 5 characters long');
      return;
    }

    try {
      setLocalLoading(true);
      setError(null);
      const cancelData: CancelDTO = { reason: reason.trim() };
      await onCancel(cancelData);
      setReason('');
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to cancel appointment';
      setError(errorMessage);
    } finally {
      setLocalLoading(false);
    }
  };

  const isSubmitting = localLoading || isLoading;

  if (!isOpen || !appointment) return null;

  return (
    <>
      <style>{animationStyles}</style>
      {/* Backdrop */}
      <div className='fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn'>
        {/* Modal */}
        <div className='bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-slideUp overflow-hidden'>
          {/* Header */}
          <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between'>
            <div>
              <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
                Cancel Appointment
              </h2>
              <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                {appointment.patientName}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
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
          <div className='px-6 py-4 space-y-4'>
            {/* Appointment Info Card */}
            <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg p-4'>
              <div className='flex gap-3'>
                <svg
                  className='w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                <div className='flex-1 text-sm'>
                  <p className='font-medium text-red-900 dark:text-red-200'>
                    {appointment.appointmentDate} at {appointment.startTime}
                  </p>
                  <p className='text-red-800 dark:text-red-300 text-xs mt-1'>
                    Dr. {appointment.doctorName}
                  </p>
                </div>
              </div>
            </div>

            {/* Reason Input */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                Reason for Cancellation <span className='text-red-500'>*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError(null);
                }}
                placeholder='Please explain why you are cancelling this appointment...'
                disabled={isSubmitting}
                rows={4}
                className='w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              />
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                {reason.length > 0 && `${reason.length} characters`}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg p-3 flex gap-3'>
                <svg
                  className='w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                <p className='text-sm text-red-700 dark:text-red-300'>
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className='px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3 justify-end'>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className='px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Keep Appointment
            </button>
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
            >
              {isSubmitting && (
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
              )}
              {isSubmitting ? 'Cancelling...' : 'Cancel Appointment'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
