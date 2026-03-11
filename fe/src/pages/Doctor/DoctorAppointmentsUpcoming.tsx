import { useState, useMemo, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";
import ExpandableAppointmentTable from "../../components/tables/ExpandableAppointmentTable";
import AppointmentDetailModal from "../../components/modals/AppointmentDetailModal";
import appointmentService, { AppointmentDTO } from "../../services/appointmentService";

export default function DoctorAppointmentsUpcoming() {
    // Toast notification
    const { toast, showToast, dismissToast } = useToast();
    
    // Data fetching states
    const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDTO | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filter and pagination states
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Fetch appointments from API
    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await appointmentService.getDoctorAppointments({
                    pageNumber: 0,
                    pageSize: 100
                });
                console.log("Fetched appointments:", response.content);
                if (response.content && response.content.length > 0) {
                    console.log("First appointment date format:", response.content[0].appointmentDate);
                }
                setAppointments(response.content || []);
            } catch (err) {
                const errorMessage = err instanceof Error
                    ? err.message
                    : "Failed to fetch appointments";
                setError(errorMessage);
                console.error("Error fetching appointments:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    // Get available months (current and future)
    const availableMonths = useMemo(() => {
        const months = [];
        const today = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            months.push({
                value: monthStr,
                label: date.toLocaleDateString("en-US", { year: "numeric", month: "long" }),
            });
        }
        return months;
    }, []);

    // Process data: search, filter, sort, month filter
    const processedAppointments = useMemo(() => {
        let result = [...appointments];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter by status (exclude completed, cancelled, no-show)
        result = result.filter((apt) => {
            const excludedStatuses = ["COMPLETED", "CANCELLED", "NO_SHOW"];
            return !excludedStatuses.includes(apt.status);
        });

        // Filter by date (only future appointments)
        result = result.filter((apt) => {
            const aptDate = new Date(apt.appointmentDate);
            return aptDate >= today;
        });

        // Filter by month
        result = result.filter((apt) => {
            // Extract YYYY-MM from appointmentDate (handles both "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm:ss" formats)
            const aptMonth = apt.appointmentDate.substring(0, 7);
            const matches = aptMonth === selectedMonth;
            return matches;
        });

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (apt) =>
                    apt.patientName.toLowerCase().includes(query) ||
                    apt.patientEmail.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (statusFilter) {
            result = result.filter((apt) => apt.status === statusFilter);
        }

        // Sort by date
        result.sort((a, b) => {
            const dateCompare = a.appointmentDate.localeCompare(b.appointmentDate);
            return sortOrder === "ASC" ? dateCompare : -dateCompare;
        });

        return result;
    }, [appointments, searchQuery, statusFilter, sortOrder, selectedMonth]);

    // Get unique dates for pagination
    const uniqueDates = useMemo(() => {
        const dates = new Set(processedAppointments.map((apt) => apt.appointmentDate));
        return Array.from(dates).sort((a, b) => a.localeCompare(b));
    }, [processedAppointments]);

    // Paginate the dates
    const paginatedDates = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return uniqueDates.slice(startIndex, startIndex + itemsPerPage);
    }, [uniqueDates, currentPage]);

    // Get appointments for paginated dates
    const paginatedAppointments = useMemo(() => {
        return processedAppointments.filter((apt) => paginatedDates.includes(apt.appointmentDate));
    }, [processedAppointments, paginatedDates]);

    const totalPages = Math.ceil(uniqueDates.length / itemsPerPage);

    const handleViewDetails = async (appointment: AppointmentDTO) => {
        try {
            const details = await appointmentService.getDoctorAppointmentDetail(appointment.id);
            setSelectedAppointment(details);
            setIsModalOpen(true);
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : "Failed to fetch appointment details";
            console.error("Error fetching appointment details:", err);
            showToast(errorMessage, "error");
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAppointment(null);
    };

    const handleResetFilters = () => {
        setSearchQuery("");
        setStatusFilter("");
        setSortOrder("ASC");
        setSelectedMonth(
            `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
        );
        setCurrentPage(1);
    };

    const handleRetry = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await appointmentService.getDoctorAppointments({
                pageNumber: 0,
                pageSize: 100
            });
            setAppointments(response.content || []);
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : "Failed to fetch appointments";
            setError(errorMessage);
            console.error("Error fetching appointments:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <PageMeta title="Upcoming Appointments | Doctor Panel" description="View your upcoming appointments" />
            <PageBreadcrumb pageTitle="Upcoming Appointments" />

            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Upcoming Appointments
                        </h2>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Manage and track all your upcoming appointments
                        </p>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-24">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <svg
                                className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                                Loading appointments...
                            </p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 p-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <svg
                                    className="w-6 h-6 text-red-600 dark:text-red-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                                    Failed to Load Appointments
                                </h3>
                                <p className="text-sm text-red-800 dark:text-red-300 mb-4">
                                    {error}
                                </p>
                                <button
                                    onClick={handleRetry}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors dark:bg-red-700 dark:hover:bg-red-600"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="1.5"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.995-1.039M5.25 12a6.75 6.75 0 1111.07-3.938"
                                        />
                                    </svg>
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content (visible when not loading) */}
                {!loading && !error && (
                    <>
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Total Appointments
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                    {processedAppointments.length}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                                <svg
                                    className="w-6 h-6 text-blue-600 dark:text-blue-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0121 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Confirmed
                                </p>
                                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                                    {processedAppointments.filter((a) => a.status === "CONFIRMED").length}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg dark:bg-green-900/30">
                                <svg
                                    className="w-6 h-6 text-green-600 dark:text-green-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Pending
                                </p>
                                <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                                    {processedAppointments.filter((a) => a.status === "PENDING").length}
                                </p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-lg dark:bg-yellow-900/30">
                                <svg
                                    className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 6v6h.01m0 0v6m0-6h6m-6 0H6"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Checked In
                                </p>
                                <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
                                    {processedAppointments.filter((a) => a.status === "CHECKED_IN").length}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg dark:bg-purple-900/30">
                                <svg
                                    className="w-6 h-6 text-purple-600 dark:text-purple-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 12.75L11.25 15 15 9.75m-3-7.036A9.75 9.75 0 1103.75 12 9.761 9.761 0 0112 2.25z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4">
                    <div className="flex flex-col gap-4">
                        {/* Search and Status Row */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search by patient name or email..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="PENDING">Pending</option>
                                <option value="SCHEDULED">Scheduled</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="CHECKED_IN">Checked In</option>
                                <option value="IN_PROGRESS">In Progress</option>
                            </select>
                        </div>

                        {/* Sort, Month, and Reset Row */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 sm:flex-none">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Sort
                                </label>
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as "ASC" | "DESC")}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="ASC">Earliest First</option>
                                    <option value="DESC">Latest First</option>
                                </select>
                            </div>

                            <div className="flex-1 sm:flex-none">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Month
                                </label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => {
                                        setSelectedMonth(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {availableMonths.map((month) => (
                                        <option key={month.value} value={month.value}>
                                            {month.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleResetFilters}
                                className="sm:self-end px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Appointments Table */}
                {processedAppointments.length > 0 ? (
                    <>
                        <ExpandableAppointmentTable
                            appointments={paginatedAppointments}
                            onViewDetails={handleViewDetails}
                        />

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, uniqueDates.length)}{" "}
                                        to {Math.min(currentPage * itemsPerPage, uniqueDates.length)} of {uniqueDates.length} days
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400 font-medium transition-colors"
                                        >
                                            Previous
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                                let pageNum = currentPage;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                                            pageNum === currentPage
                                                                ? "bg-blue-600 text-white"
                                                                : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400 font-medium transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-12 text-center">
                        <svg
                            className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                            No appointments found
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                            Try adjusting your search or filter criteria
                        </p>
                    </div>
                )}
                    </>
                )}

            {/* Appointment Detail Modal */}
            <AppointmentDetailModal
                appointment={selectedAppointment}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />

            {/* Toast Notifications */}
            <Toast toast={toast} onDismiss={dismissToast} />
            </div>
        </>
    );
}
