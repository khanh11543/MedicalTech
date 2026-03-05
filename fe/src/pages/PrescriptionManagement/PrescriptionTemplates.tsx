import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import prescriptionService from "../../services/prescriptionService";

// ==================== HELPERS ====================
const formatNumber = (n: number): string => n.toLocaleString();
const formatPercent = (n?: number): string =>
  n != null ? `${n >= 0 ? '+' : ''}${n.toFixed(1)}%` : 'N/A';

// Quick date presets
type DatePreset = 'last30' | 'last90' | 'thisYear' | 'custom';
const getPresetDates = (preset: DatePreset): { from: string; to: string } => {
  const to = dayjs().format('YYYY-MM-DD');
  switch (preset) {
    case 'last30': return { from: dayjs().subtract(30, 'day').format('YYYY-MM-DD'), to };
    case 'last90': return { from: dayjs().subtract(90, 'day').format('YYYY-MM-DD'), to };
    case 'thisYear': return { from: dayjs().startOf('year').format('YYYY-MM-DD'), to };
    case 'custom': return { from: dayjs().subtract(30, 'day').format('YYYY-MM-DD'), to };
    default: return { from: dayjs().subtract(30, 'day').format('YYYY-MM-DD'), to };
  }
};

type TrendGroupBy = 'DAY' | 'WEEK' | 'MONTH';

// ==================== STAT CARD ====================
const StatCard = ({
  label,
  value,
  subValue,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
  icon: React.ReactNode;
}) => (
  <div className={`rounded-xl border p-4 ${color}`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <div className="text-gray-400">{icon}</div>
    </div>
    <p className="text-2xl font-bold text-gray-800 dark:text-white/90">{value}</p>
    {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
  </div>
);

// ==================== ICONS ====================
const ChartIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const UsersIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);
const PillIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);
const TrendUpIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);
const DocIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const StethIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

// ==================== MAIN COMPONENT ====================
export default function PrescriptionTemplates() {
  const [datePreset, setDatePreset] = useState<DatePreset>('last90');
  const [customFrom, setCustomFrom] = useState(dayjs().subtract(90, 'day').format('YYYY-MM-DD'));
  const [customTo, setCustomTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [trendGroupBy, setTrendGroupBy] = useState<TrendGroupBy>('WEEK');
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | undefined>(undefined);

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') return { from: customFrom, to: customTo };
    return getPresetDates(datePreset);
  }, [datePreset, customFrom, customTo]);

  // ==================== QUERIES ====================
  // Overview statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['template-stats', dateRange.from, dateRange.to],
    queryFn: () => prescriptionService.getTemplateStatistics(dateRange.from, dateRange.to),
  });

  // By-doctor stats
  const { data: doctorStats, isLoading: doctorLoading } = useQuery({
    queryKey: ['template-by-doctor', dateRange.from, dateRange.to],
    queryFn: () => prescriptionService.getTemplatesByDoctor(dateRange.from, dateRange.to, 10),
  });

  // Common medications
  const { data: medications, isLoading: medsLoading } = useQuery({
    queryKey: ['common-meds', dateRange.from, dateRange.to],
    queryFn: () => prescriptionService.getCommonMedications(dateRange.from, dateRange.to, 20, 'MEDICATION'),
  });

  // Usage trends
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['usage-trends', dateRange.from, dateRange.to, trendGroupBy, selectedDoctorId],
    queryFn: () => prescriptionService.getUsageTrends(dateRange.from, dateRange.to, trendGroupBy, selectedDoctorId),
  });

  const isLoading = statsLoading || doctorLoading || medsLoading || trendsLoading;

  return (
    <>
      <PageMeta
        title="Prescription Templates Overview | MedicalTech Dashboard"
        description="Admin analytics for prescription templates"
      />
      <PageBreadcrumb pageTitle="Templates Overview" />

      <div className="space-y-6">
        {/* Date Range Filters */}
        <ComponentCard title="Date Range">
          <div className="flex flex-wrap items-center gap-3">
            {[
              { key: 'last30' as DatePreset, label: 'Last 30 Days' },
              { key: 'last90' as DatePreset, label: 'Last 90 Days' },
              { key: 'thisYear' as DatePreset, label: 'This Year' },
              { key: 'custom' as DatePreset, label: 'Custom' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setDatePreset(key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  datePreset === key
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
            {datePreset === 'custom' && (
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            )}
            <span className="text-xs text-gray-400 ml-auto">
              {dayjs(dateRange.from).format('MMM DD, YYYY')} – {dayjs(dateRange.to).format('MMM DD, YYYY')}
            </span>
          </div>
        </ComponentCard>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-pulse text-gray-400">Loading analytics data...</div>
          </div>
        )}

        {/* Overview Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Total Prescriptions"
              value={formatNumber(stats.totalPrescriptions)}
              subValue={stats.prescriptionGrowthRate != null ? `Growth: ${formatPercent(stats.prescriptionGrowthRate)}` : undefined}
              color="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
              icon={<DocIcon />}
            />
            <StatCard
              label="Active"
              value={formatNumber(stats.activePrescriptions)}
              color="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
              icon={<ChartIcon />}
            />
            <StatCard
              label="Expired"
              value={formatNumber(stats.expiredPrescriptions)}
              color="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
              icon={<ChartIcon />}
            />
            <StatCard
              label="Doctors"
              value={formatNumber(stats.totalDoctors)}
              subValue={stats.mostActiveDoctorName ? `Top: ${stats.mostActiveDoctorName}` : undefined}
              color="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20"
              icon={<StethIcon />}
            />
            <StatCard
              label="Patients"
              value={formatNumber(stats.totalPatients)}
              color="border-cyan-200 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-900/20"
              icon={<UsersIcon />}
            />
            <StatCard
              label="Avg Meds/Rx"
              value={stats.averageMedicationsPerPrescription?.toFixed(1) || '0'}
              subValue={`Total: ${formatNumber(stats.totalMedicationsUsed)}`}
              color="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
              icon={<PillIcon />}
            />
          </div>
        )}

        {/* Usage Trends Table */}
        <ComponentCard title="Usage Trends">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">Group by:</span>
            {(['DAY', 'WEEK', 'MONTH'] as TrendGroupBy[]).map((gb) => (
              <button
                key={gb}
                onClick={() => setTrendGroupBy(gb)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  trendGroupBy === gb
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {gb}
              </button>
            ))}
            {/* Doctor filter */}
            {doctorStats && doctorStats.length > 0 && (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Filter doctor:</span>
                <select
                  value={selectedDoctorId || ''}
                  onChange={(e) => setSelectedDoctorId(e.target.value ? Number(e.target.value) : undefined)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">All Doctors</option>
                  {doctorStats.map((d) => (
                    <option key={d.doctorId} value={d.doctorId}>{d.doctorName}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {trends ? (
            <>
              <div className="flex items-center gap-6 mb-4 text-sm text-gray-500 dark:text-gray-400">
                <span>Total: <strong className="text-gray-800 dark:text-white">{formatNumber(trends.totalPrescriptions)}</strong></span>
                <span>Avg/Period: <strong className="text-gray-800 dark:text-white">{trends.averagePrescriptionsPerPeriod?.toFixed(1)}</strong></span>
                {trends.peakPeriod && (
                  <span>Peak: <strong className="text-gray-800 dark:text-white">{trends.peakPeriod.period}</strong> ({trends.peakPeriod.prescriptionCount})</span>
                )}
              </div>
              {/* Simple bar-style trend visualization */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Period</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Prescriptions</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Medications</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Patients</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Doctors</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 min-w-[200px]">Volume</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {trends.trendData.map((point) => {
                        const maxCount = trends.peakPeriod?.prescriptionCount || 1;
                        const barWidth = Math.max(5, (point.prescriptionCount / maxCount) * 100);
                        return (
                          <TableRow key={point.period}>
                            <TableCell className="px-5 py-3 text-sm text-gray-800 dark:text-white/90">{point.period}</TableCell>
                            <TableCell className="px-5 py-3 text-sm font-semibold text-gray-800 dark:text-white/90">{point.prescriptionCount}</TableCell>
                            <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{point.medicationCount}</TableCell>
                            <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{point.uniquePatients}</TableCell>
                            <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{point.uniqueDoctors}</TableCell>
                            <TableCell className="px-5 py-3">
                              <div className="w-full bg-gray-100 rounded-full h-4 dark:bg-gray-800">
                                <div
                                  className="bg-brand-500 h-4 rounded-full transition-all"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {trends.trendData.length === 0 && (
                        <TableRow>
                          <TableCell className="px-5 py-8 text-center text-gray-400">No trend data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          ) : !trendsLoading ? (
            <p className="text-sm text-gray-400 py-4">No trend data available for the selected period.</p>
          ) : null}
        </ComponentCard>

        {/* Templates By Doctor (Top 10) */}
        <ComponentCard title="Prescriptions by Doctor (Top 10)">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">#</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Doctor</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Specialization</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Total Rx</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Patients</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Active</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Expired</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Avg Meds/Rx</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Top Medication</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {doctorStats?.map((doctor, idx) => (
                    <TableRow key={doctor.doctorId}>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{idx + 1}</TableCell>
                      <TableCell className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-white/90">{doctor.doctorName}</TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{doctor.specialization || '-'}</TableCell>
                      <TableCell className="px-5 py-3 text-sm font-semibold text-gray-800 dark:text-white/90">{doctor.totalPrescriptions}</TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{doctor.uniquePatients}</TableCell>
                      <TableCell className="px-5 py-3">
                        <Badge size="sm" color="success">{doctor.activePrescriptions}</Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <Badge size="sm" color="error">{doctor.expiredPrescriptions}</Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{doctor.averageMedicationsPerPrescription?.toFixed(1)}</TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {doctor.topMedicationPrescribed ? (
                          <span>{doctor.topMedicationPrescribed} <span className="text-xs text-gray-400">({doctor.topMedicationCount})</span></span>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!doctorStats || doctorStats.length === 0) && !doctorLoading && (
                    <TableRow>
                      <TableCell className="px-5 py-8 text-center text-gray-400">No doctor data available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentCard>

        {/* Common Medications (Top 20) */}
        <ComponentCard title="Most Common Medications (Top 20)">
          <div className="text-xs text-gray-400 mb-3">
            * Only medication names and usage frequency are shown. No dosage patterns or clinical relevance data is exposed.
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">#</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Medication</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Generic Name</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Category</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Rx Count</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Total Qty</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Doctors</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Patients</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">% of Total</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {medications?.map((med, idx) => (
                    <TableRow key={med.medicationName + idx}>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{idx + 1}</TableCell>
                      <TableCell className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-white/90">{med.medicationName}</TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{med.genericName || '-'}</TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{med.category || '-'}</TableCell>
                      <TableCell className="px-5 py-3 text-sm font-semibold text-gray-800 dark:text-white/90">{med.prescriptionCount}</TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{formatNumber(med.totalQuantity)}</TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{med.uniqueDoctors}</TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{med.uniquePatients}</TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {med.percentageOfTotal != null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-2 dark:bg-gray-800">
                              <div
                                className="bg-brand-400 h-2 rounded-full"
                                style={{ width: `${Math.min(100, med.percentageOfTotal)}%` }}
                              />
                            </div>
                            <span>{med.percentageOfTotal.toFixed(1)}%</span>
                          </div>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!medications || medications.length === 0) && !medsLoading && (
                    <TableRow>
                      <TableCell className="px-5 py-8 text-center text-gray-400">No medication data available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentCard>

        {/* Trend Summary Footer */}
        {trends && (
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
            <TrendUpIcon />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Period Summary:</strong> {dayjs(dateRange.from).format('MMM DD, YYYY')} – {dayjs(dateRange.to).format('MMM DD, YYYY')} |{' '}
              {formatNumber(trends.totalPrescriptions)} prescriptions |{' '}
              Avg {trends.averagePrescriptionsPerPeriod?.toFixed(1)}/{trendGroupBy.toLowerCase()}
              {trends.peakPeriod && ` | Peak: ${trends.peakPeriod.period}`}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
