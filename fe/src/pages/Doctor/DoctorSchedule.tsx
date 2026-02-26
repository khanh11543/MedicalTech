import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

export default function DoctorSchedule() {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    return (
        <>
            <PageMeta title="Schedule | Doctor Panel" description="Manage your availability" />
            <PageBreadcrumb pageTitle="Schedule & Availability" />

            <div className="space-y-6">
                {/* Weekly Schedule */}
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Weekly Schedule</h3>
                        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600">
                            Edit Schedule
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="space-y-3">
                            {days.map((day) => (
                                <div key={day} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <span className="font-medium text-gray-800 dark:text-white w-28">{day}</span>
                                    <div className="flex items-center gap-4 flex-1 justify-center">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">08:00 — 12:00</span>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">13:00 — 17:00</span>
                                    </div>
                                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        Active
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Time Off */}
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Time Off / Leave</h3>
                        <button className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600">
                            Request Time Off
                        </button>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No upcoming time off scheduled</p>
                    </div>
                </div>
            </div>
        </>
    );
}
