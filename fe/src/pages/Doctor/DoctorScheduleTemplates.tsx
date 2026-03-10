import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

export default function DoctorScheduleTemplates() {
    return (
        <>
            <PageMeta title="Schedule Templates | Doctor Panel" description="Manage your schedule templates" />
            <PageBreadcrumb pageTitle="Templates" />

            <div className="space-y-6">
                {/* Templates Header */}
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Schedule Templates</h3>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                            Create Template
                        </button>
                    </div>

                    {/* Templates Grid */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Template 1</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">9:00 AM - 5:00 PM</p>
                                <div className="flex gap-2">
                                    <button className="flex-1 px-3 py-1.5 text-xs font-medium rounded bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
                                        Edit
                                    </button>
                                    <button className="flex-1 px-3 py-1.5 text-xs font-medium rounded bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
