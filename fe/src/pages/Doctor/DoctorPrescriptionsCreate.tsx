import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

export default function DoctorPrescriptionsCreate() {
    return (
        <>
            <PageMeta title="Create Prescription | Doctor Panel" description="Create a new prescription" />
            <PageBreadcrumb pageTitle="Create Prescription" />

            <div className="space-y-6">
                {/* Create Prescription Form */}
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">New Prescription</h3>
                    </div>

                    <div className="p-6">
                        <form className="space-y-6">
                            {/* Patient Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Patient Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Select or search patient"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Medications */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Medications
                                </label>
                                <div className="space-y-3">
                                    <div className="border border-gray-300 rounded-lg p-4 dark:border-gray-600">
                                        <input
                                            type="text"
                                            placeholder="Medicine name"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                                        />
                                        <div className="grid grid-cols-3 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Dosage"
                                                className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Frequency"
                                                className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Duration"
                                                className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="mt-3 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                                >
                                    + Add Medicine
                                </button>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Additional instructions or notes"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                ></textarea>
                            </div>

                            {/* Submit */}
                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    className="px-6 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                >
                                    Create Prescription
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
