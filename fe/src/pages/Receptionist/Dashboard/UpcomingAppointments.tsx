import { useNavigate } from "react-router-dom";
import type { UpcomingAppointmentDTO } from "../../../services/receptionistService";

interface Props {
  appointments: UpcomingAppointmentDTO[];
  loading: boolean;
}

const statusColors: Record<string, string> = {
  CONFIRMED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CHECKED_IN: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  IN_PROGRESS: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  COMPLETED: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  NO_SHOW: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function formatTime(time: string | null | undefined): string {
  if (!time) return "—";
  // "HH:mm:ss" → "HH:mm"
  return time.substring(0, 5);
}

export default function UpcomingAppointments({ appointments, loading }: Props) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Today's Upcoming
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Today's Upcoming
        </h2>
        <button
          onClick={() => navigate("/receptionist/appointments")}
          className="text-xs text-brand-500 hover:text-brand-600 font-medium"
        >
          View all →
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
          <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No upcoming appointments</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 pr-3 font-medium">Time</th>
                <th className="pb-2 pr-3 font-medium">Patient</th>
                <th className="pb-2 pr-3 font-medium">Doctor / Dept</th>
                <th className="pb-2 pr-3 font-medium">Status</th>
                <th className="pb-2 pr-3 font-medium text-center">Queue #</th>
                <th className="pb-2 font-medium">Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {appointments.map((appt) => {
                const isUrgent = appt.minutesUntilStart <= 5 && appt.minutesUntilStart >= 0;
                return (
                  <tr
                    key={appt.id}
                    onClick={() => navigate(`/receptionist/appointments`)}
                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      isUrgent ? "bg-red-50/50 dark:bg-red-900/10" : ""
                    }`}
                  >
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatTime(appt.startTime)}
                        </span>
                        {isUrgent && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-500 text-white">
                            SOON
                          </span>
                        )}
                        {appt.minutesUntilStart > 0 && !isUrgent && (
                          <span className="text-[10px] text-gray-400">
                            in {appt.minutesUntilStart}m
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white truncate max-w-[140px]">
                          {appt.patientName}
                        </p>
                        <p className="text-xs text-gray-400">{appt.maskedPhone}</p>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div>
                        <p className="text-gray-900 dark:text-white truncate max-w-[140px]">
                          {appt.doctorName}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-[140px]">
                          {appt.doctorSpecialization}
                        </p>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[appt.status] || "bg-gray-100 text-gray-700"
                      }`}>
                        {appt.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-center">
                      {appt.queueNumber ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-bold">
                          {appt.queueNumber}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        {appt.appointmentCode}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
