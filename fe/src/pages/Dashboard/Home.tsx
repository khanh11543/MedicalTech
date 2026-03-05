import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const userRoles = user?.roles || [];

  // Redirect RECEPTIONIST users to their dedicated dashboard
  if (userRoles.includes("RECEPTIONIST") && !userRoles.includes("ADMIN")) {
    return <Navigate to="/receptionist/dashboard" replace />;
  }

  return (
    <>
      <PageMeta
        title="Dashboard | MediTech Admin"
        description="MediTech Admin Dashboard - Overview of system statistics"
      />

      <div className="space-y-6">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {stats?.generatedAt ? new Date(stats.generatedAt).toLocaleString() : "N/A"}
          </span>
        </div>

        {/* Main Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={<GroupIcon className="size-6" />}
            color="primary"
            subtitle={`${stats?.activeUsers || 0} active`}
          />
          <StatCard
            title="Total Doctors"
            value={stats?.totalDoctors || 0}
            icon={<CheckCircleIcon className="size-6" />}
            color="success"
            subtitle="Verified doctors"
          />
          <StatCard
            title="Today's Appointments"
            value={stats?.todayAppointments || 0}
            icon={<CalenderIcon className="size-6" />}
            color="info"
            subtitle={`${stats?.pendingAppointments || 0} pending`}
          />
          <StatCard
            title="Pending Verifications"
            value={stats?.pendingDocuments || 0}
            icon={<DocsIcon className="size-6" />}
            color="warning"
            subtitle="Awaiting review"
          />
        </div>

        {/* Secondary Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
          <StatCard
            title="Total Patients"
            value={stats?.totalPatients || 0}
            icon={<GroupIcon className="size-6" />}
            color="info"
          />
          <StatCard
            title="Receptionists"
            value={stats?.totalReceptionists || 0}
            icon={<TaskIcon className="size-6" />}
            color="primary"
          />
          <StatCard
            title="Total Appointments"
            value={stats?.totalAppointments || 0}
            icon={<CalenderIcon className="size-6" />}
            color="success"
            subtitle={`${stats?.completedAppointments || 0} completed`}
          />
          <StatCard
            title="Staff Invites"
            value={stats?.pendingStaffInvites || 0}
            icon={<ArrowUpIcon className="size-6" />}
            color="warning"
            subtitle={`${stats?.registeredStaff || 0} registered`}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Bar Chart - Users by Role */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Users by Role</h3>
            <Bar
              data={{
                labels: ["Admin", "Doctor", "Patient", "Receptionist"],
                datasets: [{
                  label: "Users",
                  data: [
                    stats?.totalUsers ? Math.max(1, Math.floor((stats.totalUsers - (stats.totalDoctors || 0) - (stats.totalPatients || 0) - (stats.totalReceptionists || 0)))) : 1,
                    stats?.totalDoctors || 0,
                    stats?.totalPatients || 0,
                    stats?.totalReceptionists || 0,
                  ],
                  backgroundColor: ["rgba(59,130,246,0.7)", "rgba(34,197,94,0.7)", "rgba(6,182,212,0.7)", "rgba(234,179,8,0.7)"],
                  borderRadius: 8,
                }],
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
              }}
            />
          </div>

          {/* Pie Chart - Appointment Status */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Appointment Status</h3>
            <Pie
              data={{
                labels: ["Pending", "Completed", "Cancelled"],
                datasets: [{
                  data: [
                    stats?.pendingAppointments || 0,
                    stats?.completedAppointments || 0,
                    stats?.cancelledAppointments || 0,
                  ],
                  backgroundColor: ["rgba(234,179,8,0.8)", "rgba(34,197,94,0.8)", "rgba(239,68,68,0.8)"],
                  borderWidth: 2,
                  borderColor: "#fff",
                }],
              }}
              options={{
                responsive: true,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </div>

          {/* Doughnut Chart - Document Verification */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Document Verification</h3>
            <Doughnut
              data={{
                labels: ["Pending", "Approved", "Rejected"],
                datasets: [{
                  data: [
                    stats?.pendingDocuments || 0,
                    stats?.approvedDocuments || 0,
                    stats?.rejectedDocuments || 0,
                  ],
                  backgroundColor: ["rgba(234,179,8,0.8)", "rgba(34,197,94,0.8)", "rgba(239,68,68,0.8)"],
                  borderWidth: 2,
                  borderColor: "#fff",
                }],
              }}
              options={{
                responsive: true,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </div>
        </div>

        {/* Recent Users and Appointments */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Users */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Users</h3>
            </div>
            <div className="p-6">
              {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentUsers.map((user: RecentUser) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">
                            {user.fullName || user.email}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <Badge color={user.role === "ADMIN" ? "primary" : user.role === "DOCTOR" ? "success" : "info"} size="sm">
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent users</p>
              )}
            </div>
          </div>

          {/* Recent Appointments */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Appointments</h3>
            </div>
            <div className="p-6">
              {stats?.recentAppointments && stats.recentAppointments.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentAppointments.map((apt: RecentAppointment) => (
                    <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{apt.patientName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">with Dr. {apt.doctorName}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          color={
                            apt.status === "COMPLETED" ? "success" :
                              apt.status === "PENDING" ? "warning" :
                                apt.status === "CANCELLED" ? "error" : "info"
                          }
                          size="sm"
                        >
                          {apt.status}
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(apt.appointmentDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent appointments</p>
              )}
            </div>
          </div>
        </div>

        {/* Document Verification Stats */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Doctor Verification Overview</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats?.pendingDocuments || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Pending Review</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats?.approvedDocuments || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Approved</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats?.rejectedDocuments || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Rejected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
