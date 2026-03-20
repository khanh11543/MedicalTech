import { useState } from 'react';
import { ConflictingAppointmentDTO } from '../../services/doctorScheduleService';
import RescheduleModal from './RescheduleModal';
import { AppointmentDTO } from '../../services/appointmentService';

interface BlockConflictModalProps {
  isOpen: boolean;
  slotDate: string; // "Monday, Jan 15" format
  slotTime: string; // "HH:mm - HH:mm" format
  conflictingAppointments: ConflictingAppointmentDTO[];
  onRescheduleAll: () => Promise<void>; // Reschedule all conflicting appointments
  onCancel: () => void; // Cancel block operation
  isLoading?: boolean;
}

export default function BlockConflictModal({
  isOpen,
  slotDate,
  slotTime,
  conflictingAppointments,
  onRescheduleAll,
  onCancel,
  isLoading = false,
}: BlockConflictModalProps) {
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAppointmentIndex, setSelectedAppointmentIndex] = useState(0);
  const [rescheduledCount, setRescheduledCount] = useState(0);

  const selectedAppointment = conflictingAppointments[selectedAppointmentIndex];

  // Convert ConflictingAppointmentDTO to AppointmentDTO for RescheduleModal
  const getAppointmentForReschedule = (): AppointmentDTO => {
    return {
      id: selectedAppointment.appointmentId,
      patientName: selectedAppointment.patientName,
      appointmentDate: selectedAppointment.appointmentDate,
      appointmentDateFormatted: selectedAppointment.appointmentDate,
      startTime: selectedAppointment.startTime,
      endTime: selectedAppointment.endTime,
      type: selectedAppointment.appointmentType,
      reason: selectedAppointment.reason,
      status: selectedAppointment.status,
    } as unknown as AppointmentDTO;
  };

  const handleRescheduleSuccess = async () => {
    setRescheduledCount((prev) => prev + 1);

    // If all appointments rescheduled, trigger onRescheduleAll
    if (rescheduledCount + 1 >= conflictingAppointments.length) {
      try {
        await onRescheduleAll();
        onCancel(); // Close modal after successful reschedule of all
      } catch (err) {
        console.error('Error after rescheduling all appointments:', err);
      }
    } else {
      // Move to next appointment
      setSelectedAppointmentIndex((prev) => prev + 1);
      setRescheduleModalOpen(false);
    }
  };

  if (!isOpen) return null;

  if (rescheduleModalOpen && selectedAppointment) {
    return (
      <RescheduleModal
        isOpen={rescheduleModalOpen}
        appointment={getAppointmentForReschedule()}
        onClose={() => {
          setRescheduleModalOpen(false);
        }}
        onReschedule={async () => {
          // Handle reschedule - this will be implemented by parent
          handleRescheduleSuccess();
        }}
      />
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className='fixed inset-0 bg-black/50 z-40' />

      {/* Modal */}
      <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
        <div className='bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto'>
          {/* Header */}
          <div className='sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4'>
            <div className='flex items-start justify-between'>
              <div>
                <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
                  ⚠️ Conflicting Appointments
                </h2>
                <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                  {slotDate} • {slotTime}
                </p>
              </div>
              <button
                onClick={onCancel}
                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl'
                disabled={isLoading}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className='px-6 py-4 space-y-4'>
            {/* Message */}
            <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-4'>
              <p className='text-sm text-yellow-800 dark:text-yellow-300'>
                This time slot has{' '}
                <strong>{conflictingAppointments.length}</strong> booked
                appointment(s) that would be blocked. You need to reschedule
                these appointments before blocking this slot.
              </p>
            </div>

            {/* Progress */}
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600 dark:text-gray-400'>
                Rescheduled: <strong>{rescheduledCount}</strong> /{' '}
                <strong>{conflictingAppointments.length}</strong>
              </span>
              <div className='w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                <div
                  className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                  style={{
                    width: `${(rescheduledCount / conflictingAppointments.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Appointments List */}
            <div className='border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700'>
              {conflictingAppointments.map((apt, index) => {
                const isRescheduled = index < rescheduledCount;
                return (
                  <div
                    key={apt.appointmentId}
                    className={`p-4 flex items-start justify-between ${
                      isRescheduled
                        ? 'bg-green-50 dark:bg-green-900/10'
                        : index === selectedAppointmentIndex
                          ? 'bg-blue-50 dark:bg-blue-900/10'
                          : ''
                    }`}
                  >
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <p className='font-medium text-gray-900 dark:text-white'>
                          {apt.patientName}
                        </p>
                        {isRescheduled && (
                          <span className='px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs font-medium rounded-full'>
                            ✓ Rescheduled
                          </span>
                        )}
                      </div>
                      <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                        {apt.appointmentDate} • {apt.startTime} - {apt.endTime}
                      </p>
                      <p className='text-sm text-gray-500 dark:text-gray-500 mt-1'>
                        {apt.appointmentType}
                        {apt.reason && ` • ${apt.reason}`}
                      </p>
                      {apt.patientPhone && (
                        <p className='text-xs text-gray-400 dark:text-gray-500 mt-1'>
                          {apt.patientPhone}
                        </p>
                      )}
                    </div>

                    {!isRescheduled && (
                      <button
                        onClick={() => {
                          setSelectedAppointmentIndex(index);
                          setRescheduleModalOpen(true);
                        }}
                        className='ml-4 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50'
                        disabled={isLoading}
                      >
                        Reschedule
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Help Text */}
            <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-3'>
              <p className='text-xs text-blue-800 dark:text-blue-300'>
                💡 Please reschedule each conflicting appointment above. Once
                all are rescheduled, you can then block this time slot.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className='sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3'>
            <button
              onClick={onCancel}
              className='flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors disabled:opacity-50'
              disabled={isLoading}
            >
              Cancel Block
            </button>
            {rescheduledCount === conflictingAppointments.length && (
              <button
                onClick={onRescheduleAll}
                className='flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2'
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    Completing...
                  </>
                ) : (
                  <>✓ Block Slot Now</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
