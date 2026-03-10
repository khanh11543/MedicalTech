import { Appointment } from "../../services/appointmentService";

interface AppointmentDetailModalProps {
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

export default function AppointmentDetailModal({
    appointment,
    isOpen,
    onClose,
}: AppointmentDetailModalProps) {
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
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Appointment Details
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
                        {/* Status Section */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                        </div>

                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                Basic Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                        Appointment ID
                                    </span>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        APT-{appointment.id.toString().padStart(5, "0")}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                        Booked By
                                    </span>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {appointment.bookedByUserName}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Appointment Schedule */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                Appointment Schedule
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                        Date & Time
                                    </span>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {formatDateTime(appointment.appointmentDate)}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                            Start Time
                                        </span>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {appointment.startTime}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                            End Time
                                        </span>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {appointment.endTime}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Patient Information */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                Patient Information
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                        Name
                                    </span>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {appointment.patientName}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                            Email
                                        </span>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {appointment.patientEmail}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                            Phone
                                        </span>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {appointment.patientPhone}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Medical Information */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                Medical Information
                            </h4>
                            <div className="space-y-3">
                                {appointment.symptoms && (
                                    <div>
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                            Symptoms
                                        </span>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {appointment.symptoms}
                                        </p>
                                    </div>
                                )}
                                {appointment.cancellationReason && (
                                    <div>
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                            Cancellation Reason
                                        </span>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {appointment.cancellationReason}
                                        </p>
                                    </div>
                                )}
                                {appointment.checkedInAt && (
                                    <div>
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                            Checked In At
                                        </span>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {formatDateTime(appointment.checkedInAt)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Record Dates */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                Record Dates
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                        Created
                                    </span>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {formatDateTime(appointment.createdAt)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                        Updated
                                    </span>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {formatDateTime(appointment.updatedAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex justify-end">
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
