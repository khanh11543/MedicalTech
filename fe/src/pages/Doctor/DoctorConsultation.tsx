import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

export default function DoctorConsultation() {
    return (
        <>
            <PageMeta title="Consultation | Doctor Panel" description="Consultation Workspace" />
            <PageBreadcrumb pageTitle="Consultation Workspace" />

            <div className="space-y-6">
                {/* Active Consultation */}
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Active Consultation</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-500 dark:text-gray-400 text-center py-12">No active consultation. Select a patient from your queue to begin.</p>
                    </div>
                </div>

                {/* Workspace Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Patient Info */}
                    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                        <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-4">Patient Information</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Name</span>
                                <span className="text-gray-800 dark:text-white">—</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Age</span>
                                <span className="text-gray-800 dark:text-white">—</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Blood Type</span>
                                <span className="text-gray-800 dark:text-white">—</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Allergies</span>
                                <span className="text-gray-800 dark:text-white">—</span>
                            </div>
                        </div>
                    </div>

                    {/* Diagnosis & Notes */}
                    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                        <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-4">Diagnosis & Notes</h4>
                        <textarea
                            className="w-full h-40 p-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter diagnosis notes..."
                            disabled
                        />
                    </div>

                    {/* Quick Actions */}
                    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                        <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h4>
                        <div className="space-y-3">
                            <button disabled className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-500 rounded-lg opacity-50 cursor-not-allowed">
                                Write Prescription
                            </button>
                            <button disabled className="w-full px-4 py-3 text-sm font-medium text-white bg-green-500 rounded-lg opacity-50 cursor-not-allowed">
                                Complete Consultation
                            </button>
                            <button disabled className="w-full px-4 py-3 text-sm font-medium text-white bg-yellow-500 rounded-lg opacity-50 cursor-not-allowed">
                                Request Lab Test
                            </button>
                            <button disabled className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg opacity-50 cursor-not-allowed dark:text-gray-300 dark:bg-gray-700">
                                View Medical History
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
