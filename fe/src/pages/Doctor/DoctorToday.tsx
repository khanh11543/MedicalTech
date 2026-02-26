import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

export default function DoctorToday() {
    const [view, setView] = useState<"queue" | "timeline">("queue");

    return (
        <>
            <PageMeta title="Today | Doctor Panel" description="Today's Queue and Timeline" />
            <PageBreadcrumb pageTitle="Today" />

            <div className="space-y-6">
                {/* View Toggle */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setView("queue")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === "queue"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                    >
                        Queue View
                    </button>
                    <button
                        onClick={() => setView("timeline")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === "timeline"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                    >
                        Timeline View
                    </button>
                </div>

                {view === "queue" && (
                    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Patient Queue</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-500 dark:text-gray-400 text-center py-12">No patients in queue today</p>
                        </div>
                    </div>
                )}

                {view === "timeline" && (
                    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Today's Timeline</h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"].map((time) => (
                                    <div key={time} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-14">{time}</span>
                                        <div className="flex-1 h-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center">
                                            <span className="text-xs text-gray-400 dark:text-gray-500">Available</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
