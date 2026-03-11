import { AppointmentDTO } from "../../services/appointmentService";

interface AppointmentDetailModalProps {
    appointment: AppointmentDTO | null;
    isOpen: boolean;
    onClose: () => void;
}

const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return "-";
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

const formatDate = (dateTime: string | null) => {
    if (!dateTime) return "-";
    const date = new Date(dateTime);
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });
};

const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
        PENDING: {
            bg: "bg-yellow-50 dark:bg-yellow-900/20",
            text: "text-yellow-700 dark:text-yellow-300",
            icon: "🕐",
        },
        CONFIRMED: {
            bg: "bg-blue-50 dark:bg-blue-900/20",
            text: "text-blue-700 dark:text-blue-300",
            icon: "✓",
        },
        CHECKED_IN: {
            bg: "bg-cyan-50 dark:bg-cyan-900/20",
            text: "text-cyan-700 dark:text-cyan-300",
            icon: "✓✓",
        },
        IN_PROGRESS: {
            bg: "bg-indigo-50 dark:bg-indigo-900/20",
            text: "text-indigo-700 dark:text-indigo-300",
            icon: "▶",
        },
        COMPLETED: {
            bg: "bg-green-50 dark:bg-green-900/20",
            text: "text-green-700 dark:text-green-300",
            icon: "✓",
        },
        CANCELLED: {
            bg: "bg-red-50 dark:bg-red-900/20",
            text: "text-red-700 dark:text-red-300",
            icon: "✕",
        },
        NO_SHOW: {
            bg: "bg-orange-50 dark:bg-orange-900/20",
            text: "text-orange-700 dark:text-orange-300",
            icon: "!",
        },
        RESCHEDULED: {
            bg: "bg-purple-50 dark:bg-purple-900/20",
            text: "text-purple-700 dark:text-purple-300",
            icon: "↻",
        },
    };
    return colors[status] || colors.PENDING;
};

const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ");
};

const InfoCard = ({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) => (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">{icon}</div>
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-wide">
                {title}
            </h4>
        </div>
        {children}
    </div>
);

const InfoField = ({ label, value }: { label: string; value: string | React.ReactNode }) => (
    <div className="mb-4 last:mb-0">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {label}
        </span>
        <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{value}</p>
    </div>
);

export default function AppointmentDetailModal({
    appointment,
    isOpen,
    onClose,
}: AppointmentDetailModalProps) {
    if (!isOpen || !appointment) return null;

    const statusColor = getStatusColor(appointment.status);
    const statusLabel = getStatusLabel(appointment.status);

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col">
                    {/* Colorful Header */}
                    <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-800 dark:via-indigo-800 dark:to-purple-800 px-6 pt-4 pb-16 overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16 blur-3xl"></div>

                        <div className="relative flex items-start justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium mb-2">Appointment Details</p>
                                <h3 className="text-3xl font-bold text-white">
                                    APT-{appointment.id.toString().padStart(5, "0")}
                                </h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white/80 hover:text-white bg-white/20 hover:bg-white/30 rounded-lg p-2 my-auto transition-colors"
                            >
                                <svg
                                    className="w-6 h-6"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2"
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
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="px-6 py-8 space-y-6">
                            {/* Status Badge */}
                            <div className={`${statusColor.bg} rounded-xl p-4 border border-opacity-30`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{statusColor.icon}</span>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                            Current Status
                                        </p>
                                        <p className={`text-xl font-bold ${statusColor.text}`}>
                                            {statusLabel}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Appointment Schedule */}
                            <InfoCard icon="📅" title="Appointment Schedule">
                                <div className="space-y-4">
                                    <InfoField
                                        label="Date"
                                        value={formatDate(appointment.appointmentDate)}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoField label="Start Time" value={appointment.startTime} />
                                        <InfoField label="End Time" value={appointment.endTime} />
                                    </div>
                                </div>
                            </InfoCard>

                            {/* Patient Information */}
                            <InfoCard icon="👤" title="Patient Information">
                                <div className="space-y-4">
                                    <InfoField label="Full Name" value={appointment.patientName} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoField label="Email" value={appointment.patientEmail} />
                                        <InfoField label="Phone" value={appointment.patientPhone} />
                                    </div>
                                </div>
                            </InfoCard>

                            {/* Doctor Information */}
                            <InfoCard icon="👨‍⚕️" title="Doctor Information">
                                <div className="space-y-4">
                                    <InfoField label="Doctor Name" value={appointment.doctorName} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoField
                                            label="Specialization"
                                            value={appointment.doctorSpecialization}
                                        />
                                        <InfoField label="Email" value={appointment.doctorEmail} />
                                    </div>
                                </div>
                            </InfoCard>

                            {/* Medical Information */}
                            {(appointment.symptoms ||
                                appointment.reasonForVisit ||
                                appointment.notes) && (
                                <InfoCard icon="🏥" title="Medical Information">
                                    <div className="space-y-4">
                                        {appointment.reasonForVisit && (
                                            <InfoField
                                                label="Reason for Visit"
                                                value={appointment.reasonForVisit}
                                            />
                                        )}
                                        {appointment.symptoms && (
                                            <InfoField label="Symptoms" value={appointment.symptoms} />
                                        )}
                                        {appointment.notes && (
                                            <InfoField label="Notes" value={appointment.notes} />
                                        )}
                                    </div>
                                </InfoCard>
                            )}

                            {/* Additional Status Information */}
                            {(appointment.cancellationReason || appointment.checkedInAt) && (
                                <InfoCard icon="ℹ️" title="Additional Information">
                                    <div className="space-y-4">
                                        {appointment.cancellationReason && (
                                            <InfoField
                                                label="Cancellation Reason"
                                                value={appointment.cancellationReason}
                                            />
                                        )}
                                        {appointment.checkedInAt && (
                                            <InfoField
                                                label="Checked In At"
                                                value={formatDateTime(appointment.checkedInAt)}
                                            />
                                        )}
                                    </div>
                                </InfoCard>
                            )}

                            {/* Record Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 text-center border border-gray-200 dark:border-slate-700">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        Created
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatDateTime(appointment.createdAt)}
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 text-center border border-gray-200 dark:border-slate-700">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        Updated
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatDateTime(appointment.updatedAt)}
                                    </p>
                                </div>
                            </div>

                            {/* Booked By */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                                <p className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider mb-2">
                                    Booking Information
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    Booked by: <span className="font-semibold">{appointment.bookedByUserName}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
