import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

export default function ReportsAnalytics() {
  return (
    <>
      <PageMeta
        title="Reports & Analytics | MedicalTech Dashboard"
        description="View reports and analytics in the MedicalTech system"
      />
      <PageBreadcrumb pageTitle="Reports & Analytics" />
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Patients</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">12,458</h3>
                <p className="text-sm text-green-500 mt-1">↑ 12% from last month</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg dark:bg-blue-500/20">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Appointments</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">8,234</h3>
                <p className="text-sm text-green-500 mt-1">↑ 8% from last month</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg dark:bg-green-500/20">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">₫2.5B</h3>
                <p className="text-sm text-green-500 mt-1">↑ 15% from last month</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg dark:bg-yellow-500/20">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Doctors</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">156</h3>
                <p className="text-sm text-green-500 mt-1">↑ 5% from last month</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg dark:bg-purple-500/20">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ComponentCard title="Appointments by Month">
            <div className="h-80 flex items-center justify-center bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">Bar Chart - Appointments by Month</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Connect to backend for real data</p>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Revenue Trend">
            <div className="h-80 flex items-center justify-center bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">Line Chart - Revenue Trend</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Connect to backend for real data</p>
              </div>
            </div>
          </ComponentCard>
        </div>

        {/* Reports Table */}
        <ComponentCard title="Available Reports">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-500/20">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">Monthly Patient Report</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Patient statistics and demographics</p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
                Generate
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg dark:bg-green-500/20">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">Financial Report</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Revenue, payments, and billing summary</p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
                Generate
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-500/20">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">Doctor Performance Report</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Appointments, ratings, and efficiency</p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
                Generate
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-yellow-100 rounded-lg dark:bg-yellow-500/20">
                  <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">Appointment Analytics</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Booking trends and cancellation rates</p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
                Generate
              </button>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
