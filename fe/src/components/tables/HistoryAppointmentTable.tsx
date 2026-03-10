import { useState, useRef, useEffect } from "react";
import { Appointment } from "../../services/appointmentService";

interface HistoryAppointmentTableProps {
    appointments: Appointment[];
    onViewSummary?: (appointment: Appointment) => void;
    onViewDetail?: (appointment: Appointment) => void;
    onViewMedicalRecord?: (appointment: Appointment) => void;
}

const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString("en-US", {
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

export default function HistoryAppointmentTable({
    appointments,
    onViewSummary,
    onViewDetail,
    onViewMedicalRecord,
}: HistoryAppointmentTableProps) {
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (appointments.length === 0) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No appointment history
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
            <div className="overflow-x-auto pb-32">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                Patient
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                Date & Time
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                Type
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                Status
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                Completion
                            </th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {appointments.map((appointment) => (
                            <tr
                                key={appointment.id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {appointment.patientName}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            {appointment.patientEmail}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatDateTime(appointment.appointmentDate)}
                                    </p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Consultation
                                    </p>
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                            appointment.status
                                        )}`}
                                    >
                                        {getStatusLabel(appointment.status)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        {appointment.status === "COMPLETED"
                                            ? appointment.checkedInAt
                                                ? formatDateTime(appointment.checkedInAt)
                                                : "Not recorded"
                                            : appointment.status === "CANCELLED"
                                            ? "Cancelled"
                                            : appointment.status === "NO_SHOW"
                                            ? "No show"
                                            : "Rescheduled"}
                                    </p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="relative" ref={menuRef}>
                                        <button
                                            onClick={() =>
                                                setOpenMenuId(
                                                    openMenuId === appointment.id ? null : appointment.id
                                                )
                                            }
                                            className="inline-flex items-center justify-center w-8 h-8 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="w-5 h-5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
                                                />
                                            </svg>
                                        </button>

                                        {/* Dropdown Menu */}
                                        {openMenuId === appointment.id && (
                                            <div className="absolute right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-48">
                                                <button
                                                    onClick={() => {
                                                        if (onViewSummary) {
                                                            onViewSummary(appointment);
                                                        }
                                                        setOpenMenuId(null);
                                                    }}
                                                    className="w-full px-4 py-2.5 text-left text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 first:rounded-t-lg"
                                                >
                                                    <svg
                                                        className="w-4 h-4"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth="1.5"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                                        />
                                                    </svg>
                                                    View Summary
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (onViewDetail) {
                                                            onViewDetail(appointment);
                                                        }
                                                        setOpenMenuId(null);
                                                    }}
                                                    className="w-full px-4 py-2.5 text-left text-sm text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700"
                                                >
                                                    <svg
                                                        className="w-4 h-4"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth="1.5"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M9 4.5v15m6-15v15m-11.995.75V3.75a2.25 2.25 0 0 1 2.25-2.25h15.5a2.25 2.25 0 0 1 2.25 2.25v16.5c0 1.035-.84 1.89-1.89 1.89H3.75a1.89 1.89 0 0 1-1.895-1.89Z"
                                                        />
                                                    </svg>
                                                    View Details
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (onViewMedicalRecord) {
                                                            onViewMedicalRecord(appointment);
                                                        }
                                                        setOpenMenuId(null);
                                                    }}
                                                    className="w-full px-4 py-2.5 text-left text-sm text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-3 last:rounded-b-lg"
                                                >
                                                    <svg
                                                        className="w-4 h-4"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth="1.5"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M9 12h3.75M9 15h3.75M9 18h3.75m3-8.25H6a2.25 2.25 0 0 0-2.25 2.25v12a2.25 2.25 0 0 0 2.25 2.25h12a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25z"
                                                        />
                                                    </svg>
                                                    View Medical Record
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
