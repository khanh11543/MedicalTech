import { useState, useEffect, useCallback } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import Badge from '../../components/ui/badge/Badge';
import { useToast } from '../../hooks/useToast';
import {
  ScheduleExceptionDTO,
  ExceptionType,
} from '../../services/doctorScheduleService';

// ============= Icons =============
const IconPlus = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
    strokeWidth={2}
  >
    <path strokeLinecap='round' strokeLinejoin='round' d='M12 4v16m8-8H4' />
  </svg>
);

const IconX = ({ className }: { className?: string }) => (
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
      d='M6 18L18 6M6 6l12 12'
    />
  </svg>
);

const IconTrash = ({ className }: { className?: string }) => (
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
      d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
    />
  </svg>
);

const IconEdit = ({ className }: { className?: string }) => (
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
      d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
    />
  </svg>
);

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

const IconClock = ({ className }: { className?: string }) => (
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
      d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    />
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

// ============= Helper Functions =============
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function getExceptionTypeDescription(type: ExceptionType): string {
  switch (type) {
    case 'OFF':
      return 'Day off - no availability';
    case 'MODIFIED':
      return 'Modified hours on this day';
    case 'EXTRA':
      return 'Extra availability added';
    default:
      return 'Exception';
  }
}

// ============= Main Component =============
export default function DoctorScheduleTimeOff() {
  const { showToast } = useToast();

  // Form state
  const [formData, setFormData] = useState<
    Omit<ScheduleExceptionDTO, 'id' | 'doctorId'>
  >({
    exceptionDate: '',
    exceptionType: 'OFF',
    startTime: '',
    endTime: '',
    reason: '',
  });

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [exceptions, setExceptions] = useState<ScheduleExceptionDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadExceptions = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Call doctorScheduleService.listScheduleExceptions()
      // For now, use empty array for UI development
      setExceptions([]);
    } catch (error) {
      console.error('Error loading exceptions:', error);
      showToast('Failed to load time off requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Load exceptions on mount
  useEffect(() => {
    loadExceptions();
  }, [loadExceptions]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.exceptionDate) {
      newErrors.exceptionDate = 'Date is required';
    }

    if (formData.exceptionType !== 'OFF') {
      if (!formData.startTime) {
        newErrors.startTime = 'Start time is required';
      }
      if (!formData.endTime) {
        newErrors.endTime = 'End time is required';
      }
      if (
        formData.startTime &&
        formData.endTime &&
        formData.startTime >= formData.endTime
      ) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    try {
      setLoading(true);

      // TODO: Call API
      // if (editingId) {
      //   await doctorScheduleService.updateScheduleException(editingId, formData);
      //   showToast('Time off updated successfully', 'success');
      // } else {
      //   await doctorScheduleService.addScheduleException(formData);
      //   showToast('Time off added successfully', 'success');
      // }

      // Reset form
      setFormData({
        exceptionDate: '',
        exceptionType: 'OFF',
        startTime: '',
        endTime: '',
        reason: '',
      });
      setEditingId(null);
      setShowForm(false);

      // Reload exceptions
      await loadExceptions();
    } catch (error) {
      console.error('Error submitting form:', error);
      showToast('Failed to save time off', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this time off request?')) {
      return;
    }

    try {
      setLoading(true);
      // TODO: Call doctorScheduleService.deleteScheduleException(id)
      void id; // Will be used in API call
      showToast('Time off deleted successfully', 'success');
      await loadExceptions();
    } catch (error) {
      console.error('Error deleting exception:', error);
      showToast('Failed to delete time off', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (exception: ScheduleExceptionDTO) => {
    setFormData({
      exceptionDate: exception.exceptionDate,
      exceptionType: exception.exceptionType,
      startTime: exception.startTime || '',
      endTime: exception.endTime || '',
      reason: exception.reason || '',
    });
    setEditingId(exception.id || null);
    setShowForm(true);
    setErrors({});
  };

  const handleCancel = () => {
    setFormData({
      exceptionDate: '',
      exceptionType: 'OFF',
      startTime: '',
      endTime: '',
      reason: '',
    });
    setEditingId(null);
    setShowForm(false);
    setErrors({});
  };

  return (
    <>
      <PageMeta
        title='Time Off & Breaks | Doctor Panel'
        description='Manage your time off and breaks'
      />
      <PageBreadcrumb pageTitle='Time Off & Breaks' />

      <div className='space-y-6'>
        {/* Add New Time Off Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className='flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
          >
            <IconPlus className='w-5 h-5' />
            Request Time Off
          </button>
        )}

        {/* Form Section */}
        {showForm && (
          <div className='rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                {editingId ? 'Edit Time Off' : 'Add New Time Off'}
              </h3>
              <button
                onClick={handleCancel}
                className='p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors'
              >
                <IconX className='w-6 h-6 text-gray-600 dark:text-gray-400' />
              </button>
            </div>

            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Date Selection */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  <div className='flex items-center gap-2'>
                    <IconCalendar className='w-4 h-4' />
                    Date
                  </div>
                </label>
                <input
                  type='date'
                  value={formData.exceptionDate}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      exceptionDate: e.target.value,
                    });
                    setErrors({ ...errors, exceptionDate: '' });
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                    errors.exceptionDate
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-200'
                  } dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2`}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.exceptionDate && (
                  <p className='text-sm text-red-600 dark:text-red-400 mt-1'>
                    {errors.exceptionDate}
                  </p>
                )}
              </div>

              {/* Exception Type Selection */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3'>
                  Exception Type
                </label>
                <div className='grid grid-cols-3 gap-3'>
                  {(['OFF', 'MODIFIED', 'EXTRA'] as ExceptionType[]).map(
                    (type) => (
                      <button
                        key={type}
                        type='button'
                        onClick={() => {
                          setFormData({ ...formData, exceptionType: type });
                        }}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.exceptionType === type
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className='font-medium text-sm text-gray-900 dark:text-white'>
                          {type}
                        </div>
                        <div className='text-xs text-gray-500 dark:text-gray-400'>
                          {getExceptionTypeDescription(type as ExceptionType)}
                        </div>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Time Selection (for MODIFIED and EXTRA) */}
              {formData.exceptionType !== 'OFF' && (
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      <div className='flex items-center gap-2'>
                        <IconClock className='w-4 h-4' />
                        Start Time
                      </div>
                    </label>
                    <input
                      type='time'
                      value={formData.startTime}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          startTime: e.target.value,
                        });
                        setErrors({ ...errors, startTime: '' });
                      }}
                      className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                        errors.startTime
                          ? 'border-red-500 focus:ring-red-200'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-200'
                      } dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2`}
                    />
                    {errors.startTime && (
                      <p className='text-sm text-red-600 dark:text-red-400 mt-1'>
                        {errors.startTime}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      <div className='flex items-center gap-2'>
                        <IconClock className='w-4 h-4' />
                        End Time
                      </div>
                    </label>
                    <input
                      type='time'
                      value={formData.endTime}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          endTime: e.target.value,
                        });
                        setErrors({ ...errors, endTime: '' });
                      }}
                      className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                        errors.endTime
                          ? 'border-red-500 focus:ring-red-200'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-200'
                      } dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2`}
                    />
                    {errors.endTime && (
                      <p className='text-sm text-red-600 dark:text-red-400 mt-1'>
                        {errors.endTime}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Reason (Optional)
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder='Add a note about this time off (e.g., vacation, conference, illness)'
                  rows={3}
                  className='w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors'
                />
              </div>

              {/* Action Buttons */}
              <div className='flex gap-3 pt-4'>
                <button
                  type='submit'
                  disabled={loading}
                  className='flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium'
                >
                  {loading ? 'Saving...' : editingId ? 'Update' : 'Add'} Time
                  Off
                </button>
                <button
                  type='button'
                  onClick={handleCancel}
                  className='flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium'
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Time Off List */}
        <div className='rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05]'>
          <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Time Off & Break Requests
            </h3>
          </div>

          {loading && !showForm ? (
            <div className='px-6 py-12 text-center'>
              <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400' />
              <p className='text-gray-600 dark:text-gray-400 mt-2'>
                Loading time off requests...
              </p>
            </div>
          ) : exceptions.length > 0 ? (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                <thead className='bg-gray-50 dark:bg-gray-800/50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase'>
                      Date
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase'>
                      Type
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase'>
                      Time
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase'>
                      Reason
                    </th>
                    <th className='px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                  {exceptions.map((exception) => (
                    <tr
                      key={exception.id}
                      className='hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors'
                    >
                      <td className='px-6 py-4 text-sm font-medium text-gray-900 dark:text-white'>
                        {formatDate(exception.exceptionDate)}
                      </td>
                      <td className='px-6 py-4'>
                        <Badge
                          variant='light'
                          color={
                            exception.exceptionType === 'OFF'
                              ? 'error'
                              : exception.exceptionType === 'MODIFIED'
                                ? 'warning'
                                : 'success'
                          }
                          size='sm'
                        >
                          {exception.exceptionType}
                        </Badge>
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600 dark:text-gray-400'>
                        {exception.exceptionType === 'OFF'
                          ? 'Full day off'
                          : `${exception.startTime} - ${exception.endTime}`}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600 dark:text-gray-400 truncate'>
                        {exception.reason || '—'}
                      </td>
                      <td className='px-6 py-4 text-right'>
                        <div className='flex items-center justify-end gap-2'>
                          <button
                            onClick={() => handleEdit(exception)}
                            disabled={loading}
                            className='p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg transition-colors disabled:opacity-50'
                            title='Edit'
                          >
                            <IconEdit className='w-4 h-4' />
                          </button>
                          <button
                            onClick={() => handleDelete(exception.id || 0)}
                            disabled={loading}
                            className='p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50'
                            title='Delete'
                          >
                            <IconTrash className='w-4 h-4' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='px-6 py-12 text-center'>
              <IconAlertTriangle className='w-12 h-12 text-gray-400 mx-auto mb-3' />
              <p className='text-gray-600 dark:text-gray-400'>
                No time off requests yet
              </p>
              <p className='text-sm text-gray-500 dark:text-gray-500 mt-1'>
                Click "Request Time Off" to create your first time off entry
              </p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className='rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/5 p-4'>
          <div className='flex gap-3'>
            <IconAlertTriangle className='w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5' />
            <div className='text-sm text-blue-800 dark:text-blue-300'>
              <p className='font-medium mb-1'>Time Off Types:</p>
              <ul className='space-y-1 text-xs'>
                <li>
                  • <strong>OFF:</strong> Full day unavailable for appointments
                </li>
                <li>
                  • <strong>MODIFIED:</strong> Different hours on this day
                </li>
                <li>
                  • <strong>EXTRA:</strong> Additional availability added
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
