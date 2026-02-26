import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

export default function DoctorReviews() {
    const [activeTab, setActiveTab] = useState<"reviews" | "stats">("reviews");

    return (
        <>
            <PageMeta title="Reviews & Stats | Doctor Panel" description="Your reviews and performance statistics" />
            <PageBreadcrumb pageTitle="Reviews & Stats" />

            <div className="space-y-6">
                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-800">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab("reviews")}
                            className={`${activeTab === "reviews"
                                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400"
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Patient Reviews
                        </button>
                        <button
                            onClick={() => setActiveTab("stats")}
                            className={`${activeTab === "stats"
                                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400"
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Performance Stats
                        </button>
                    </nav>
                </div>

                {activeTab === "reviews" && (
                    <div className="space-y-4">
                        {/* Overall Rating */}
                        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <div className="text-5xl font-bold text-gray-800 dark:text-white">—</div>
                                    <div className="flex items-center gap-1 mt-2 justify-center">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <svg key={star} className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">0 reviews</p>
                                </div>
                                <div className="flex-1 space-y-2">
                                    {[5, 4, 3, 2, 1].map((rating) => (
                                        <div key={rating} className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500 dark:text-gray-400 w-3">{rating}</span>
                                            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                                                <div className="h-full bg-yellow-400 rounded-full" style={{ width: "0%" }} />
                                            </div>
                                            <span className="text-sm text-gray-500 dark:text-gray-400 w-6">0</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Reviews List */}
                        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Reviews</h3>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No reviews yet</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "stats" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: "Total Appointments", value: "—", icon: "📅" },
                            { title: "Patients Treated", value: "—", icon: "👥" },
                            { title: "Prescriptions Written", value: "—", icon: "📝" },
                            { title: "Consultation Hours", value: "—", icon: "⏱️" },
                        ].map((stat) => (
                            <div key={stat.title} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                                <div className="text-3xl mb-3">{stat.icon}</div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</span>
                                <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">{stat.value}</h4>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
