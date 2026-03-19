import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import {
    DoctorReviewsOverviewResponse,
    getDoctorReviewsOverview,
} from "../../services/doctorService";

export default function DoctorReviews() {
    const [activeTab, setActiveTab] = useState<"reviews" | "stats">("reviews");
    const [overview, setOverview] = useState<DoctorReviewsOverviewResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await getDoctorReviewsOverview({ pageNumber: 0, pageSize: 10 });
                if (isMounted) setOverview(res);
            } catch (e: any) {
                if (isMounted) setError(e?.response?.data?.message || e?.message || "Failed to load reviews.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        load();
        return () => {
            isMounted = false;
        };
    }, []);

    const ratingStats = overview?.stats;

    const ratingMap = useMemo(() => {
        const map: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratingStats?.ratingDistribution?.forEach((d) => {
            if (d.rating >= 1 && d.rating <= 5) map[d.rating] = d.count ?? 0;
        });
        return map;
    }, [ratingStats?.ratingDistribution]);

    const totalReviews = ratingStats?.totalReviews ?? 0;
    const averageRating = ratingStats?.averageRating ?? 0;

    const renderStars = (rating: number) => {
        const clamped = Math.max(0, Math.min(5, rating));
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`w-4 h-4 ${star <= clamped ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        );
    };

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
                                    <div className="text-5xl font-bold text-gray-800 dark:text-white">
                                        {totalReviews > 0 ? averageRating.toFixed(1) : "—"}
                                    </div>
                                    <div className="flex items-center gap-1 mt-2 justify-center">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <svg
                                                key={star}
                                                className={`w-5 h-5 ${star <= Math.round(averageRating) ? "text-yellow-400" : "text-gray-300"}`}
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{totalReviews} reviews</p>
                                </div>
                                <div className="flex-1 space-y-2">
                                    {[5, 4, 3, 2, 1].map((rating) => (
                                        <div key={rating} className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500 dark:text-gray-400 w-3">{rating}</span>
                                            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                                                <div
                                                    className="h-full bg-yellow-400 rounded-full"
                                                    style={{
                                                        width: totalReviews > 0 ? `${((ratingMap[rating] ?? 0) / totalReviews) * 100}%` : "0%",
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm text-gray-500 dark:text-gray-400 w-6">{ratingMap[rating] ?? 0}</span>
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
                                {loading && <p className="text-gray-500 dark:text-gray-400 text-center py-8">Loading...</p>}
                                {error && <p className="text-red-600 dark:text-red-400 text-center py-2">{error}</p>}
                                {!loading && !error && (overview?.reviews?.length ?? 0) === 0 && (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No reviews yet</p>
                                )}

                                {!loading && !error && overview?.reviews?.length ? (
                                    <div className="space-y-4">
                                        {overview.reviews.map((r) => (
                                            <div key={r.id} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                            {r.patientName ?? "Anonymous"}
                                                        </p>
                                                        <div className="mt-1">{renderStars(r.rating ?? 0)}</div>
                                                    </div>
                                                    {r.createdAt ? (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                            {new Date(r.createdAt).toLocaleDateString()}
                                                        </p>
                                                    ) : null}
                                                </div>

                                                {r.comment ? <p className="mt-3 text-sm text-gray-700 dark:text-gray-200">{r.comment}</p> : null}

                                                {r.adminResponse ? (
                                                    <div className="mt-3 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-3">
                                                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">Doctor reply</p>
                                                        <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">{r.adminResponse}</p>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "stats" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: "Total Appointments", value: ratingStats?.totalAppointments ?? "—", icon: "📅" },
                            { title: "Patients Treated", value: ratingStats?.patientsTreated ?? "—", icon: "👥" },
                            { title: "Prescriptions Written", value: ratingStats?.prescriptionsWritten ?? "—", icon: "📝" },
                            {
                                title: "Consultation Hours",
                                value: typeof ratingStats?.consultationHours === "number"
                                    ? `${ratingStats?.consultationHours.toFixed(2)} h`
                                    : "—",
                                icon: "⏱️",
                            },
                        ].map((stat) => (
                            <div
                                key={stat.title}
                                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
                            >
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
