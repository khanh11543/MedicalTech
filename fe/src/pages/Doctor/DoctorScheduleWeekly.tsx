import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

export default function DoctorScheduleWeekly() {
    return (
        <>
            <PageMeta title="Weekly Schedule | Doctor Panel" description="Manage your weekly schedule" />
            <PageBreadcrumb pageTitle="Weekly Schedule" />

            <div className="space-y-6">
                {/* Schedule Header */}
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Weekly Schedule</h3>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                            Add Slot
                        </button>
                    </div>

                    {/* Week View */}
                    <div className="p-6">
                        <div className="grid grid-cols-7 gap-4">
                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                                <div key={day} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-800 dark:text-white mb-3">{day}</h4>
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">09:00 - 17:00</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
