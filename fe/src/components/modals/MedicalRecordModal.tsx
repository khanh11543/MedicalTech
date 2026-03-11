import { AppointmentDTO } from "../../services/appointmentService";

interface MedicalRecordModalProps {
    appointment: Appointment | null;
    isOpen: boolean;
    onClose: () => void;
}

const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function MedicalRecordModal({
    appointment,
    isOpen,
    onClose,
}: MedicalRecordModalProps) {
    if (!isOpen || !appointment) return null;

    // Only show medical records for completed appointments
    const isCompleted = appointment.status === "COMPLETED";

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 dark:bg-black/60"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Medical Record
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <svg
                                className="w-6 h-6"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4 space-y-6">
                        {!isCompleted && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-4">
                                <div className="flex gap-3">
                                    <svg
                                        className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="1.5"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 9v3.75m-9.303 3.376c.865.865 2.05 1.754 3.43 2.405m7.286-9.684c1.38.651 2.565 1.54 3.43 2.405m2.794 10.874l-1.415-1.414M15.93 12.75l1.415-1.414m-7.074-7.071l1.414 1.413M9.752 15.931l-1.415 1.414"
                                        />
                                    </svg>
                                    <div>
                                        <p className="font-semibold text-yellow-900 dark:text-yellow-200 text-sm">
                                            No Medical Record Available
                                        </p>
                                        <p className="text-xs text-yellow-800 dark:text-yellow-300 mt-0.5">
                                            Medical records are only available for completed appointments.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isCompleted && (
                            <>
                                {/* Appointment Header */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                        Consultation Summary
                                    </h4>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                                    Date
                                                </span>
                                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                    {formatDateTime(appointment.appointmentDate)}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                                    Duration
                                                </span>
                                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                    {appointment.startTime} - {appointment.endTime}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Patient Info */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                        Patient Information
                                    </h4>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {appointment.patientName}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {appointment.patientEmail}
                                        </p>
                                    </div>
                                </div>

                                {/* Chief Complaint */}
                                {appointment.symptoms && (
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            Chief Complaint
                                        </h4>
                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                                                {appointment.symptoms}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Physical Examination */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                        Physical Examination
                                    </h4>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
                                        <p className="text-sm text-blue-900 dark:text-blue-200">
                                            Physical examination findings and vital signs would be recorded here.
                                        </p>
                                    </div>
                                </div>

                                {/* Clinical Assessment */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                        Clinical Assessment
                                    </h4>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
                                        <p className="text-sm text-blue-900 dark:text-blue-200">
                                            Diagnosis and clinical assessment would be recorded here.
                                        </p>
                                    </div>
                                </div>

                                {/* Treatment Plan */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                        Treatment Plan
                                    </h4>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
                                        <p className="text-sm text-blue-900 dark:text-blue-200">
                                            Prescribed medications, therapies, and follow-up instructions would be recorded here.
                                        </p>
                                    </div>
                                </div>

                                {/* Record Date */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase mb-1">
                                        Record Date
                                    </p>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {appointment.checkedInAt
                                            ? formatDateTime(appointment.checkedInAt)
                                            : "Not recorded"}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
                        >
                            Close
                        </button>
                        {isCompleted && (
                            <button
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                            >
                                Download PDF
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
