import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import prescriptionService, {
  PrescriptionFilterParams,
} from "../../services/prescriptionService";

// ==================== ICONS ====================
const SearchIcon = () => (
  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const FilterIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);
const RefreshIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);
const EyeIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const DownloadIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);
const ClipboardIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const XCircleIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const PillIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);
const BanIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);
const WarningIcon = () => (
  <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

// ==================== INTERFACES ====================
interface Filters {
  search: string;
  status: string;
  doctorId: number | null;
  patientId: number | null;
  from: string | null;
  to: string | null;
  datePreset: string;
}

// ==================== STAT CARD ====================
const StatCard = ({ title, value, icon, color, subtitle }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{value}</h3>
        {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} text-white`}>
        {icon}
      </div>
    </div>
  </div>
);

// ==================== STATUS HELPERS ====================
const getStatusBadgeColor = (status: string): "success" | "error" | "warning" | "light" => {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'EXPIRED': return 'error';
    case 'CANCELLED':
    case 'VOID': return 'warning';
    default: return 'light';
  }
};

const getStatusLabel = (rx: { isActive?: boolean; status?: string }) => {
  if (rx.status) return rx.status;
  return rx.isActive ? 'ACTIVE' : 'EXPIRED';
};

// ==================== DATE PRESETS ====================
const getDatePreset = (preset: string): { from: string; to: string } | null => {
  const today = dayjs();
  switch (preset) {
    case 'today':
      return { from: today.format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') };
    case 'this_week':
      return { from: today.startOf('week').format('YYYY-MM-DD'), to: today.endOf('week').format('YYYY-MM-DD') };
    case 'this_month':
      return { from: today.startOf('month').format('YYYY-MM-DD'), to: today.endOf('month').format('YYYY-MM-DD') };
    case 'last_30_days':
      return { from: today.subtract(30, 'day').format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') };
    case 'custom':
    default:
      return null;
  }
};

// ==================== MAIN COMPONENT ====================
export default function PrescriptionList() {
  const navigate = useNavigate();
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    doctorId: null,
    patientId: null,
    from: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    to: dayjs().format('YYYY-MM-DD'),
    datePreset: 'last_30_days',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // Debounced search (min 3 chars for privacy protection)
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      if (value.length >= 3 || value.length === 0) {
        setFilters(prev => ({ ...prev, search: value }));
        setPagination(prev => ({ ...prev, current: 1 }));
      }
    }, 500);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const handleDatePreset = useCallback((preset: string) => {
    const dates = getDatePreset(preset);
    if (dates) {
      setFilters(prev => ({ ...prev, from: dates.from, to: dates.to, datePreset: preset }));
    } else {
      setFilters(prev => ({ ...prev, datePreset: preset }));
    }
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  // Fetch prescriptions
  const { data: prescriptionsData, isLoading, error: prescriptionsError } = useQuery({
    queryKey: ['prescriptions', filters, pagination],
    queryFn: async () => {
      const params: PrescriptionFilterParams = {
        search: filters.search || undefined,
        status: filters.status || undefined,
        doctorId: filters.doctorId || undefined,
        patientId: filters.patientId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        pageNumber: pagination.current - 1,
        pageSize: pagination.pageSize,
        sortBy: 'prescriptionDate',
        sortDir: 'DESC',
      };
      return prescriptionService.getAllPrescriptions(params);
    },
    retry: 1,
  });

  // Fetch stats
  const { data: statsData, error: statsError } = useQuery({
    queryKey: ['prescription-stats', filters.from, filters.to],
    queryFn: async () => {
      const from = filters.from || dayjs().subtract(30, 'day').format('YYYY-MM-DD');
      const to = filters.to || dayjs().format('YYYY-MM-DD');
      return prescriptionService.getPrescriptionStatistics(from, to);
    },
    retry: 1,
  });

  // Export mutation - ADMIN: administrative data only (no meds/diagnosis per rule 7.2)
  const exportMutation = useMutation({
    mutationFn: async (format: string) => {
      const params: PrescriptionFilterParams = {
        search: filters.search || undefined,
        status: filters.status || undefined,
        doctorId: filters.doctorId || undefined,
        patientId: filters.patientId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        format,
      };
      const blob = await prescriptionService.exportPrescriptions(params);
      return { blob, format };
    },
    onSuccess: ({ blob, format }) => {
      const ext = format === 'CSV' ? 'csv' : 'xlsx';
      prescriptionService.downloadFile(blob, `prescriptions_admin_${dayjs().format('YYYY-MM-DD')}.${ext}`);
    },
    onError: () => {
      alert('Export failed');
    },
  });

  // Download PDF (COPY - not original, rule 7.1)
  const handleDownloadPdf = async (id: number) => {
    try {
      const blob = await prescriptionService.downloadPrescriptionPdf(id);
      prescriptionService.downloadFile(blob, `prescription_COPY_${id}.pdf`);
    } catch {
      alert('Failed to download PDF');
    }
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      status: '',
      doctorId: null,
      patientId: null,
      from: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
      to: dayjs().format('YYYY-MM-DD'),
      datePreset: 'last_30_days',
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Stats cards
  const statsCards = useMemo(() => {
    if (!statsData) return null;
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Prescriptions"
          value={statsData.totalPrescriptions ?? 0}
          icon={<ClipboardIcon />}
          color="bg-blue-500"
        />
        <StatCard
          title="Active"
          value={statsData.activePrescriptions ?? 0}
          icon={<CheckCircleIcon />}
          color="bg-green-500"
        />
        <StatCard
          title="Expired"
          value={statsData.expiredPrescriptions ?? 0}
          icon={<XCircleIcon />}
          color="bg-red-500"
        />
        <StatCard
          title="Cancelled / Void"
          value={statsData.cancelledPrescriptions ?? 0}
          icon={<BanIcon />}
          color="bg-amber-500"
        />
        <StatCard
          title="Top Medication"
          value={statsData.mostPrescribedMedications?.[0]?.medicationName || 'N/A'}
          icon={<PillIcon />}
          color="bg-purple-500"
          subtitle={statsData.mostPrescribedMedications?.[0] ? `${statsData.mostPrescribedMedications[0].prescriptionCount} prescriptions` : undefined}
        />
      </div>
    );
  }, [statsData]);

  return (
    <>
      <PageMeta
        title="Prescription Management | MedicalTech Dashboard"
        description="Admin prescription lookup - read-only view for support, reprint, and compliance"
      />
      <PageBreadcrumb pageTitle="Prescription Management" />

      <div className="space-y-6">
        {/* Error Display */}
        {(prescriptionsError || statsError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            <p className="font-bold mb-1">Error Loading Data</p>
            <p className="text-sm">
              {(prescriptionsError as any)?.response?.data?.message || (prescriptionsError as any)?.message ||
               (statsError as any)?.response?.data?.message || (statsError as any)?.message || 'Unknown error'}
            </p>
          </div>
        )}

        {/* Stats Cards */}
        {statsCards}

        {/* Filters & Search */}
        <ComponentCard title="Search &amp; Filters">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  placeholder="Search by Prescription Code, Patient Name (min 3 chars), Doctor Name..."
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent pl-10 pr-4 text-sm focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
                {searchInput.length > 0 && searchInput.length < 3 && (
                  <p className="absolute -bottom-5 left-0 text-xs text-amber-500">
                    Minimum 3 characters required for patient name search
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <FilterIcon />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <RefreshIcon />
                Reset
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {/* Quick Date Range */}
                <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-400">Quick Date Range</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'today', label: 'Today' },
                      { value: 'this_week', label: 'This Week' },
                      { value: 'this_month', label: 'This Month' },
                      { value: 'last_30_days', label: 'Last 30 Days' },
                      { value: 'custom', label: 'Custom Range' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleDatePreset(opt.value)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium shadow-sm transition-colors ${
                          filters.datePreset === opt.value
                            ? 'bg-brand-500 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-400">Date From</label>
                  <input
                    type="date"
                    value={filters.from || ''}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, from: e.target.value || null, datePreset: 'custom' }));
                      setPagination(prev => ({ ...prev, current: 1 }));
                    }}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-400">Date To</label>
                  <input
                    type="date"
                    value={filters.to || ''}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, to: e.target.value || null, datePreset: 'custom' }));
                      setPagination(prev => ({ ...prev, current: 1 }));
                    }}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                {/* Status with CANCELLED */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-400">Status</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[
                      { value: '', label: 'All' },
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'EXPIRED', label: 'Expired' },
                      { value: 'CANCELLED', label: 'Cancelled / Void' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setFilters(prev => ({ ...prev, status: opt.value }));
                          setPagination(prev => ({ ...prev, current: 1 }));
                        }}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium shadow-sm transition-colors ${
                          filters.status === opt.value
                            ? 'bg-brand-500 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* Export - admin data only */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => exportMutation.mutate('EXCEL')}
            disabled={exportMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <DownloadIcon />
            Export Excel
          </button>
          <button
            onClick={() => exportMutation.mutate('CSV')}
            disabled={exportMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <DownloadIcon />
            Export CSV
          </button>
          <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <WarningIcon />
            Export contains administrative data only (code, date, doctor, patient, status, medication count). No diagnosis or medication details.
          </span>
        </div>

        {/* Prescriptions Table - Privacy-compliant */}
        <ComponentCard title="Prescriptions List">
          {isLoading && (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-pulse">Loading prescriptions...</div>
            </div>
          )}
          {!isLoading && !prescriptionsError && (
            <>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Code</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Patient</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Doctor</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Prescribed Date</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Expiry Date</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Medications</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {prescriptionsData?.content?.map((rx: any) => {
                        const status = getStatusLabel(rx);
                        return (
                          <TableRow key={rx.id}>
                            <TableCell className="px-5 py-4 text-start">
                              <span className="font-mono text-sm font-medium text-gray-800 dark:text-white/90">
                                {rx.prescriptionCode || `RX-${rx.id}`}
                              </span>
                            </TableCell>
                            <TableCell className="px-5 py-4 text-start">
                              <div>
                                <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{rx.patientName}</p>
                                {rx.medicalRecordNumber && (
                                  <p className="text-xs text-gray-400">MRN: {rx.medicalRecordNumber}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-5 py-4 text-start">
                              <div>
                                <p className="text-gray-800 text-theme-sm dark:text-white/90">{rx.doctorName}</p>
                                {rx.doctorSpecialization && (
                                  <p className="text-xs text-gray-400">{rx.doctorSpecialization}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                              {rx.prescriptionDate ? dayjs(rx.prescriptionDate).format('MMM DD, YYYY') : '-'}
                            </TableCell>
                            <TableCell className="px-5 py-4 text-start text-theme-sm">
                              {rx.expiryDate ? (
                                <span className={dayjs().isAfter(dayjs(rx.expiryDate)) ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}>
                                  {dayjs(rx.expiryDate).format('MMM DD, YYYY')}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-amber-500 text-xs">
                                  <WarningIcon /> No expiry
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="px-5 py-4 text-start">
                              <Badge size="sm" color="light">
                                {rx.items?.length || rx.medicationCount || 0} items
                              </Badge>
                            </TableCell>
                            <TableCell className="px-5 py-4 text-start">
                              <Badge size="sm" color={getStatusBadgeColor(status)}>
                                {status}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-5 py-4 text-start">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => navigate(`/prescription-list/${rx.id}`)}
                                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                                  title="View Details"
                                >
                                  <EyeIcon /> View
                                </button>
                                <button
                                  onClick={() => handleDownloadPdf(rx.id)}
                                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 transition-colors"
                                  title="Download PDF Copy"
                                >
                                  <DownloadIcon /> PDF
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {(!prescriptionsData?.content || prescriptionsData.content.length === 0) && !isLoading && (
                        <TableRow>
                          <TableCell className="px-5 py-8 text-center text-gray-400 dark:text-gray-500">
                            No prescriptions found. Try adjusting your filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {prescriptionsData && prescriptionsData.totalElements > 0 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-white/[0.05]">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {((pagination.current - 1) * pagination.pageSize) + 1} to{' '}
                    {Math.min(pagination.current * pagination.pageSize, prescriptionsData.totalElements)} of{' '}
                    {prescriptionsData.totalElements} prescriptions
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                      disabled={pagination.current === 1}
                      className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
                      {pagination.current} / {prescriptionsData.totalPages || 1}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                      disabled={pagination.current * pagination.pageSize >= prescriptionsData.totalElements}
                      className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </ComponentCard>
      </div>
    </>
  );
}

