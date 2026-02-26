import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { reportsAnalyticsAPI, ReportsAnalytics } from "../../services/complianceService";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Filler, Title, Tooltip, Legend);

export default function ReportsAnalyticsPage() {
  const [analytics, setAnalytics] = useState<ReportsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "appointments" | "revenue" | "doctors">("overview");

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await reportsAnalyticsAPI.getAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) {
    return (
      <>
        <PageMeta
          title="Reports & Analytics | MediTech Admin"
          description="View reports and analytics in the MediTech system"
        />
        <PageBreadcrumb pageTitle="Reports & Analytics" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </>
    );
  }

  if (!analytics) {
    return (
      <>
        <PageMeta
          title="Reports & Analytics | MediTech Admin"
          description="View reports and analytics in the MediTech system"
        />
        <PageBreadcrumb pageTitle="Reports & Analytics" />
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Failed to load analytics data.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Reports & Analytics | MediTech Admin"
        description="View reports and analytics in the MediTech system"
      />
      <PageBreadcrumb pageTitle="Reports & Analytics" />

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalUsers}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Appointments</p>
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalAppointments}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Payments</p>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalPayments}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(analytics.totalRevenue)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`${activeTab === "overview"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("appointments")}
            className={`${activeTab === "appointments"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Appointments
          </button>
          <button
            onClick={() => setActiveTab("revenue")}
            className={`${activeTab === "revenue"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Revenue
          </button>
          <button
            onClick={() => setActiveTab("doctors")}
            className={`${activeTab === "doctors"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Top Doctors
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart - Appointments by Status */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appointments by Status</h3>
            <Bar
              data={{
                labels: Object.keys(analytics.appointmentsByStatus),
                datasets: [{
                  label: "Appointments",
                  data: Object.values(analytics.appointmentsByStatus),
                  backgroundColor: ["rgba(234,179,8,0.7)", "rgba(34,197,94,0.7)", "rgba(239,68,68,0.7)", "rgba(59,130,246,0.7)", "rgba(168,85,247,0.7)"],
                  borderRadius: 8,
                }],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }}
            />
          </div>

          {/* Pie Chart - Revenue by Payment Method */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue by Payment Method</h3>
            <Pie
              data={{
                labels: Object.keys(analytics.revenueByPaymentMethod),
                datasets: [{
                  data: Object.values(analytics.revenueByPaymentMethod),
                  backgroundColor: ["rgba(59,130,246,0.8)", "rgba(34,197,94,0.8)", "rgba(168,85,247,0.8)", "rgba(234,179,8,0.8)"],
                  borderWidth: 2,
                  borderColor: "#fff",
                }],
              }}
              options={{ responsive: true, plugins: { legend: { position: "bottom" } } }}
            />
          </div>

          {/* Bar Chart - Users by Role */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Users by Role</h3>
            <Bar
              data={{
                labels: Object.keys(analytics.usersByRole),
                datasets: [{
                  label: "Users",
                  data: Object.values(analytics.usersByRole),
                  backgroundColor: ["rgba(59,130,246,0.7)", "rgba(34,197,94,0.7)", "rgba(6,182,212,0.7)", "rgba(234,179,8,0.7)"],
                  borderRadius: 8,
                }],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }}
            />
          </div>

          {/* Doughnut Chart - Top Specialties */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Specialties</h3>
            {analytics.specialtyStatistics.length > 0 ? (
              <Doughnut
                data={{
                  labels: analytics.specialtyStatistics.slice(0, 6).map(s => s.specialtyName),
                  datasets: [{
                    data: analytics.specialtyStatistics.slice(0, 6).map(s => s.appointmentCount),
                    backgroundColor: ["rgba(59,130,246,0.8)", "rgba(34,197,94,0.8)", "rgba(234,179,8,0.8)", "rgba(168,85,247,0.8)", "rgba(239,68,68,0.8)", "rgba(6,182,212,0.8)"],
                    borderWidth: 2,
                    borderColor: "#fff",
                  }],
                }}
                options={{ responsive: true, plugins: { legend: { position: "bottom" } } }}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No specialty data</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "appointments" && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appointments by Specialty</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Specialty
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Appointments
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {Object.entries(analytics.appointmentsBySpecialty).map(([specialty, count]) => (
                  <tr key={specialty}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {specialty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-white">
                      {count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "revenue" && (
        <div className="space-y-6">
          {/* Area/Line Chart - Revenue Trend */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend (Last 30 Days)</h3>
            <Line
              data={{
                labels: analytics.revenueTrend.slice(-15).map(i => i.date.slice(5)),
                datasets: [{
                  label: "Revenue (VND)",
                  data: analytics.revenueTrend.slice(-15).map(i => i.revenue),
                  borderColor: "rgba(59,130,246,1)",
                  backgroundColor: "rgba(59,130,246,0.15)",
                  fill: true,
                  tension: 0.4,
                  pointRadius: 4,
                  pointBackgroundColor: "rgba(59,130,246,1)",
                }],
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, ticks: { callback: (v) => `${Number(v) / 1000}k` } },
                },
              }}
            />
          </div>

          {/* Revenue Table */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {analytics.revenueTrend.slice(-10).map((item) => (
                    <tr key={item.date}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "doctors" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Doctors by Appointments */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Doctors by Appointments</h3>
            <div className="space-y-3">
              {analytics.topDoctorsByAppointments.map((doctor, index) => (
                <div key={doctor.doctorId} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">#{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{doctor.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{doctor.specialty}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">{doctor.appointmentCount}</p>
                    <p className="text-xs text-gray-500">appointments</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Doctors by Rating */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Doctors by Rating</h3>
            <div className="space-y-3">
              {analytics.topDoctorsByRating.map((doctor, index) => (
                <div key={doctor.doctorId} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">#{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{doctor.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{doctor.specialty}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-semibold text-gray-900 dark:text-white">{doctor.averageRating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-gray-500">{doctor.appointmentCount} appts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
