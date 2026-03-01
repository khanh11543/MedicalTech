import { Appointment } from "../../services/appointmentService";

interface AppointmentSummaryModalProps {
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

const getStatusColor = (status: string) => {
    switch (status) {
        case "COMPLETED":
            return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
        case "CANCELLED":
            return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
        case "NO_SHOW":
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
        case "RESCHEDULED":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
        default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
};

const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ");
};

export default function AppointmentSummaryModal({
    appointment,
    isOpen,
    onClose,
}: AppointmentSummaryModalProps) {
    if (!isOpen || !appointment) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 dark:bg-black/60"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Appointment Summary
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
                    <div className="px-6 py-4 space-y-4">
                        {/* Status Badge */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Status
                            </span>
                            <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                    appointment.status
                                )}`}
                            >
                                {getStatusLabel(appointment.status)}
                            </span>
                        </div>

                        {/* Appointment Date */}
                        <div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Appointment Date & Time
                            </span>
                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                {formatDateTime(appointment.appointmentDate)}
                            </p>
                        </div>

                        {/* Patient Info */}
                        <div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Patient
                            </span>
                            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                {appointment.patientName}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                {appointment.patientEmail}
                            </p>
                        </div>

                        {/* Duration */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Start Time
                                </span>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {appointment.startTime}
                                </p>
                            </div>
                            <div className="flex-1">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    End Time
                                </span>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {appointment.endTime}
                                </p>
                            </div>
                        </div>

                        {/* Symptoms */}
                        {appointment.symptoms && (
                            <div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Symptoms
                                </span>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white line-clamp-3">
                                    {appointment.symptoms}
                                </p>
                            </div>
                        )}

                        {/* Cancellation Reason */}
                        {appointment.cancellationReason && (
                            <div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Cancellation Reason
                                </span>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white line-clamp-3">
                                    {appointment.cancellationReason}
                                </p>
                            </div>
                        )}

                        {/* Checked In Time */}
                        {appointment.checkedInAt && appointment.status === "COMPLETED" && (
                            <div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Checked In At
                                </span>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {formatDateTime(appointment.checkedInAt)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
