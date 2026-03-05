import { useNavigate } from "react-router-dom";
import type { ReceptionistDashboardStatsDTO } from "../../../services/receptionistService";

interface Props {
  stats: ReceptionistDashboardStatsDTO;
}

export default function StatisticsCards({ stats }: Props) {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Today's Appointments",
      value: stats.todayTotalAppointments,
      subtitle: `${stats.confirmedAppointments} confirmed · ${stats.checkedInCount} checked-in · ${stats.inProgressCount} in-progress · ${stats.completedAppointments} done · ${stats.cancelledAppointments} cancelled · ${stats.noShowCount} no-show`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: "bg-brand-500",
      bgLight: "bg-blue-50 dark:bg-blue-900/20",
      textLight: "text-blue-600 dark:text-blue-400",
      onClick: () => navigate("/receptionist/appointments"),
    },
    {
      title: "Checked-in Patients",
      value: stats.checkedInCount,
      subtitle: `Avg wait: ${stats.avgWaitTimeMinutes?.toFixed(0) ?? 0} min · Auto-refresh`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-green-500",
      bgLight: "bg-green-50 dark:bg-green-900/20",
      textLight: "text-green-600 dark:text-green-400",
      onClick: () => navigate("/receptionist/queue"),
    },
    {
      title: "Waiting in Queue",
      value: stats.totalInQueue,
      subtitle: `${stats.activeDoctors} active doctor${stats.activeDoctors !== 1 ? "s" : ""}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: "bg-orange-500",
      bgLight: "bg-orange-50 dark:bg-orange-900/20",
      textLight: "text-orange-600 dark:text-orange-400",
      alert: (stats.avgWaitTimeMinutes ?? 0) > 30,
      onClick: () => navigate("/receptionist/queue"),
    },
    {
      title: "Completed Today",
      value: stats.completedAppointments,
      subtitle: (() => {
        const eligible = stats.todayTotalAppointments - stats.cancelledAppointments - stats.noShowCount;
        const rate = eligible > 0 ? ((stats.completedAppointments / eligible) * 100).toFixed(0) : 0;
        return `Completion rate: ${rate}%`;
      })(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      color: "bg-purple-500",
      bgLight: "bg-purple-50 dark:bg-purple-900/20",
      textLight: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Pending Payments",
      value: stats.pendingPayments,
      subtitle: `${(stats.pendingPaymentAmount ?? 0).toLocaleString("en-US")} VND pending`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-yellow-500",
      bgLight: "bg-yellow-50 dark:bg-yellow-900/20",
      textLight: "text-yellow-600 dark:text-yellow-400",
      onClick: () => navigate("/receptionist/payments"),
    },
    {
      title: "Payments Collected",
      value: `${(stats.todayRevenue ?? 0).toLocaleString("en-US")} VND`,
      subtitle: `${stats.completedPayments} payment${stats.completedPayments !== 1 ? "s" : ""} collected`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-emerald-500",
      bgLight: "bg-emerald-50 dark:bg-emerald-900/20",
      textLight: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          onClick={card.onClick}
          className={`relative ${card.bgLight} rounded-xl p-5 border border-gray-200 dark:border-gray-700 ${
            card.onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""
          }`}
        >
          {/* Alert badge for long wait */}
          {card.alert && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Wait &gt; 30m
            </span>
          )}

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 line-clamp-2">
                {card.subtitle}
              </p>
            </div>
            <div className={`${card.color} w-11 h-11 rounded-lg flex items-center justify-center text-white shrink-0`}>
              {card.icon}
            </div>
          </div>

          {card.onClick && (
            <div className={`mt-3 text-xs font-medium ${card.textLight} flex items-center gap-1`}>
              View details
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
