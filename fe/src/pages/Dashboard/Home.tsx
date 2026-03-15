import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import adminService, {
  DashboardStatistics,
  RecentUser,
  RecentAppointment,
} from "../../services/adminService";
import Badge from "../../components/ui/badge/Badge";
import { useWorkstation } from "../../context/WorkstationContext";
import { maskEmail } from "../../utils/privacyMask";
import {
  GroupIcon,
  CheckCircleIcon,
  CalenderIcon,
  DocsIcon,
  TaskIcon,
  ArrowUpIcon,
} from "../../icons";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

/** Plugin: draw "Total" + sum in doughnut center and percentage on each segment. Respects legend toggle (hidden segments excluded). */
const doughnutCenterAndPercentPlugin = {
  id: "doughnutCenterAndPercent",
  afterDraw(chart: ChartJS) {
    const { ctx } = chart;
    if (chart.config.type !== "doughnut") return;
    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length) return;
    const data = chart.data.datasets[0]?.data as number[];
    const arcs = meta.data as Array<{ hidden?: boolean; tooltipPosition?: () => { x: number; y: number } }>;
    const visibleTotal = data.reduce((sum, val, i) => sum + (arcs[i]?.hidden ? 0 : Number(val ?? 0)), 0);

    const firstArc = meta.data[0] as unknown as {
      x?: number;
      y?: number;
      innerRadius?: number;
      outerRadius?: number;
    };
    const centerX = firstArc.x ?? chart.width / 2;
    const centerY = firstArc.y ?? chart.height / 2;
    const innerRadius = firstArc.innerRadius ?? 0;
    const outerRadius = firstArc.outerRadius ?? 0;
    const ringWidth = Math.max(1, outerRadius - innerRadius);

    // Center text: "Total" + number (smaller font)
    const opts = (chart.options.plugins as Record<string, unknown>)?.doughnutCenter as { label?: string } | undefined;
    const label = opts?.label ?? "Total";
    const labelFontPx = Math.max(10, Math.round(ringWidth * 0.42));
    const valueFontPx = Math.max(14, Math.round(ringWidth * 0.72));
    const labelOffsetY = Math.max(8, Math.round(ringWidth * 0.42));
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = chart.options.color ? String(chart.options.color) : "#374151";
    ctx.font = `600 ${labelFontPx}px sans-serif`;
    ctx.fillText(label, centerX, centerY - labelOffsetY);
    ctx.font = `700 ${valueFontPx}px sans-serif`;
    ctx.fillText(String(visibleTotal), centerX, centerY + Math.round(valueFontPx * 0.15));
    ctx.restore();

    // Percentage on each segment – only for visible segments, smaller font, keep inside chart area
    const chartArea = chart.chartArea || { left: 0, right: chart.width, top: 0, bottom: chart.height };
    const padding = 4;
    const minX = chartArea.left + padding;
    const maxX = chartArea.right - padding;
    const minY = chartArea.top + padding;
    const maxY = chartArea.bottom - padding;

    arcs.forEach((arc, i) => {
      if (arc.hidden || visibleTotal === 0) return;
      const value = Number(data[i] ?? 0);
      if (value === 0) return;
      const pct = (value / visibleTotal) * 100;
      if (pct < 2) return;
      const pos = arc.tooltipPosition ? arc.tooltipPosition() : { x: centerX, y: centerY };
      const pctFontPx = Math.max(9, Math.round(ringWidth * 0.30));
      ctx.font = `600 ${pctFontPx}px sans-serif`;
      const text = `${pct.toFixed(1)}%`;
      const textWidth = ctx.measureText(text).width;
      const halfW = textWidth / 2;
      const x = Math.max(minX + halfW, Math.min(maxX - halfW, pos.x));
      const y = Math.max(minY + pctFontPx / 2, Math.min(maxY - pctFontPx / 2, pos.y));
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText(text, x, y);
      ctx.restore();
    });
  },
};
ChartJS.register(doughnutCenterAndPercentPlugin);

const StatCard = ({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) => {
  const colorMap: Record<string, string> = {
    primary: "bg-blue-500",
    success: "bg-green-500",
    info: "bg-cyan-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{value}</h3>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorMap[color] || "bg-blue-500"} text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const { user } = useAuth();
  const { settings: wsSettings } = useWorkstation();
  const userRoles = user?.roles || [];
  const [stats, setStats] = useState<DashboardStatistics | null>(null);

  useEffect(() => {
    adminService.getDashboardStatistics().then(setStats).catch(console.error);
  }, []);

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

        {/* Charts Section - Donut with Total in center & % on segments (real data from API) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Users by Role */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 min-h-[400px] flex flex-col">
            <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">Users by Role</h3>
            <div className="flex-1 min-h-[320px]">
            <Doughnut
              data={{
                labels: ["Admin", "Doctor", "Patient", "Receptionist"],
                datasets: [{
                  data: [
                    stats?.totalAdmins ?? 0,
                    stats?.totalDoctors ?? 0,
                    stats?.totalPatients ?? 0,
                    stats?.totalReceptionists ?? 0,
                  ],
                  backgroundColor: ["#3b82f6", "#22c55e", "#06b6d4", "#eab308"],
                  borderWidth: 2,
                  borderColor: "#fff",
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.1,
                layout: { padding: 20 },
                cutout: "65%",
                plugins: {
                  legend: { position: "bottom", labels: { font: { size: 14 }, padding: 16 } },
                  doughnutCenter: { label: "Total" },
                  tooltip: {
                    bodyFont: { size: 14 },
                    callbacks: {
                      label: (ctx) => {
                        const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                        const pct = total ? ((Number(ctx.raw) / total) * 100).toFixed(1) : "0";
                        return `${ctx.label}: ${ctx.raw} (${pct}%)`;
                      },
                    },
                  },
                },
              }}
            />
            </div>
          </div>

          {/* Appointment Status */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 min-h-[400px] flex flex-col">
            <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">Appointment Status</h3>
            <div className="flex-1 min-h-[320px]">
            <Doughnut
              data={{
                labels: ["Pending", "Completed", "Cancelled"],
                datasets: [{
                  data: [
                    stats?.pendingAppointments ?? 0,
                    stats?.completedAppointments ?? 0,
                    stats?.cancelledAppointments ?? 0,
                  ],
                  backgroundColor: ["#eab308", "#22c55e", "#ef4444"],
                  borderWidth: 2,
                  borderColor: "#fff",
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.1,
                layout: { padding: 20 },
                cutout: "65%",
                plugins: {
                  legend: { position: "bottom", labels: { font: { size: 14 }, padding: 16 } },
                  doughnutCenter: { label: "Total" },
                  tooltip: {
                    bodyFont: { size: 14 },
                    callbacks: {
                      label: (ctx) => {
                        const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                        const pct = total ? ((Number(ctx.raw) / total) * 100).toFixed(1) : "0";
                        return `${ctx.label}: ${ctx.raw} (${pct}%)`;
                      },
                    },
                  },
                },
              }}
            />
            </div>
          </div>

          {/* Document Verification */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 min-h-[400px] flex flex-col">
            <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">Document Verification</h3>
            <div className="flex-1 min-h-[320px]">
            <Doughnut
              data={{
                labels: ["Pending", "Approved", "Rejected"],
                datasets: [{
                  data: [
                    stats?.pendingDocuments ?? 0,
                    stats?.approvedDocuments ?? 0,
                    stats?.rejectedDocuments ?? 0,
                  ],
                  backgroundColor: ["#eab308", "#22c55e", "#ef4444"],
                  borderWidth: 2,
                  borderColor: "#fff",
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.1,
                layout: { padding: 20 },
                cutout: "65%",
                plugins: {
                  legend: { position: "bottom", labels: { font: { size: 14 }, padding: 16 } },
                  doughnutCenter: { label: "Total" },
                  tooltip: {
                    bodyFont: { size: 14 },
                    callbacks: {
                      label: (ctx) => {
                        const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                        const pct = total ? ((Number(ctx.raw) / total) * 100).toFixed(1) : "0";
                        return `${ctx.label}: ${ctx.raw} (${pct}%)`;
                      },
                    },
                  },
                },
              }}
            />
            </div>
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
                          <p className="text-sm text-gray-500 dark:text-gray-400">{wsSettings.hideEmail ? maskEmail(user.email) : user.email}</p>
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
