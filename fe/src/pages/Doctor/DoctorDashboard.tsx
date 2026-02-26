import PageMeta from "../../components/common/PageMeta";

export default function DoctorDashboard() {
    return (
        <>
            <PageMeta title="Dashboard | Doctor Panel" description="Doctor Dashboard Overview" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Doctor Dashboard</h1>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
                    {[
                        { title: "Today's Appointments", value: "—", color: "blue", icon: "📅" },
                        { title: "Patients Seen Today", value: "—", color: "green", icon: "👥" },
                        { title: "Pending Consultations", value: "—", color: "yellow", icon: "⏳" },
                        { title: "Average Rating", value: "—", color: "purple", icon: "⭐" },
                    ].map((stat) => (
                        <div key={stat.title} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                            <div className="text-3xl mb-3">{stat.icon}</div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</span>
                            <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">{stat.value}</h4>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Upcoming Appointments</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No upcoming appointments</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Patients</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent patients</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
