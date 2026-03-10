import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  ChartBarSquareIcon,
  ArrowTrendingUpIcon,
  CreditCardIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import ComponentCard from '../../components/common/ComponentCard';
import DateRangeSelector from './components/DateRangeSelector';
import RevenueSummaryCards from './components/RevenueSummaryCards';
import RevenueLineChart from './components/RevenueLineChart';
import MethodPieChart from './components/MethodPieChart';
import DoctorRevenueChart from './components/DoctorRevenueChart';
import AppointmentTypeChart from './components/AppointmentTypeChart';
import RefundAnalysis from './components/RefundAnalysis';
import DrillDownDrawer, { DrillDownConfig } from './components/DrillDownDrawer';
import ExportReportModal from './components/ExportReportModal';
import * as revenueService from '../../services/revenueService';

const RevenueReports: React.FC = () => {
  // ===== Date range =====
  const [dateRange, setDateRange] = useState<revenueService.DateRange>(() => {
    const now = dayjs();
    return {
      startDate: now.startOf('month').format('YYYY-MM-DD'),
      endDate: now.endOf('month').format('YYYY-MM-DD'),
      preset: 'this_month',
    };
  });

  // ===== View controls =====
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [includePrepay, setIncludePrepay] = useState(false);
  const [compareEnabled, setCompareEnabled] = useState(false);

  // ===== Drill-down =====
  const [drillDown, setDrillDown] = useState<DrillDownConfig | null>(null);

  // ===== Export modal =====
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // ===== Queries =====
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['revenue-summary', dateRange.startDate, dateRange.endDate],
    queryFn: () => revenueService.getRevenueSummary(dateRange.startDate, dateRange.endDate),
    enabled: !!dateRange.startDate && !!dateRange.endDate,
  });

  const { data: dailyData, isLoading: loadingDaily } = useQuery({
    queryKey: ['revenue-daily', dateRange.startDate, dateRange.endDate, compareEnabled],
    queryFn: () => revenueService.getDailyRevenue(dateRange.startDate, dateRange.endDate, compareEnabled),
    enabled: !!dateRange.startDate && !!dateRange.endDate,
  });

  const { data: methodData, isLoading: loadingMethods } = useQuery({
    queryKey: ['revenue-methods', dateRange.startDate, dateRange.endDate],
    queryFn: () => revenueService.getRevenueByMethod(dateRange.startDate, dateRange.endDate),
    enabled: !!dateRange.startDate && !!dateRange.endDate &&
      (activeSection === 'overview' || activeSection === 'methods'),
  });

  const { data: doctorData, isLoading: loadingDoctors } = useQuery({
    queryKey: ['revenue-doctors', dateRange.startDate, dateRange.endDate],
    queryFn: () => revenueService.getRevenueByDoctor(dateRange.startDate, dateRange.endDate, 20),
    enabled: !!dateRange.startDate && !!dateRange.endDate &&
      (activeSection === 'overview' || activeSection === 'doctors'),
  });

  const { data: apptTypeData, isLoading: loadingApptTypes } = useQuery({
    queryKey: ['revenue-appt-types', dateRange.startDate, dateRange.endDate, includePrepay],
    queryFn: () => revenueService.getRevenueByAppointmentType(dateRange.startDate, dateRange.endDate, includePrepay),
    enabled: !!dateRange.startDate && !!dateRange.endDate &&
      (activeSection === 'overview' || activeSection === 'appointments'),
  });

  const { data: refundData, isLoading: loadingRefunds } = useQuery({
    queryKey: ['revenue-refunds', dateRange.startDate, dateRange.endDate],
    queryFn: () => revenueService.getRefundAnalysis(dateRange.startDate, dateRange.endDate),
    enabled: !!dateRange.startDate && !!dateRange.endDate &&
      (activeSection === 'overview' || activeSection === 'refunds'),
  });

  // ===== Drill-down handlers =====
  const handleDayDrillDown = useCallback(
    (date: string) => {
      setDrillDown({
        title: `Transactions on ${dayjs(date).format('DD/MM/YYYY')}`,
        date,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    },
    [dateRange],
  );

  const handleMethodDrillDown = useCallback(
    (method: string) => {
      setDrillDown({
        title: `${revenueService.PAYMENT_METHOD_LABELS[method] || method} Transactions`,
        method,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    },
    [dateRange],
  );

  const handleDoctorDrillDown = useCallback(
    (doctorId: number) => {
      const doc = doctorData?.find((d) => d.doctorId === doctorId);
      setDrillDown({
        title: `Transactions for ${doc?.doctorName || `Doctor #${doctorId}`}`,
        doctorId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    },
    [dateRange, doctorData],
  );

  const handleApptTypeDrillDown = useCallback(
    (type: string) => {
      setDrillDown({
        title: `${revenueService.APPOINTMENT_TYPE_LABELS[type] || type} Transactions`,
        appointmentType: type,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    },
    [dateRange],
  );

  // ===== Section nav items =====
  const sectionIcons: Record<string, React.ReactNode> = {
    overview: <ChartBarSquareIcon className="h-4 w-4" />,
    daily: <ArrowTrendingUpIcon className="h-4 w-4" />,
    methods: <CreditCardIcon className="h-4 w-4" />,
    doctors: <UserGroupIcon className="h-4 w-4" />,
    appointments: <ClipboardDocumentListIcon className="h-4 w-4" />,
    refunds: <ArrowPathIcon className="h-4 w-4" />,
  };

  const sections = [
    { id: 'overview', label: 'Overview', desc: 'All charts' },
    { id: 'daily', label: 'Daily Revenue', desc: 'Line chart' },
    { id: 'methods', label: 'Payment Methods', desc: 'Pie + table' },
    { id: 'doctors', label: 'By Doctor', desc: 'Bar + table' },
    { id: 'appointments', label: 'Appointment Types', desc: 'Breakdown' },
    { id: 'refunds', label: 'Refund Analysis', desc: 'Impact' },
  ];

  return (
    <>
      <PageMeta title="Revenue Reports | MedicalTech Dashboard" description="Revenue analytics and reports" />
      <PageBreadcrumb pageTitle="Revenue Reports" />

      <div className="space-y-6">
        {/* Date Range Selector */}
        <DateRangeSelector dateRange={dateRange} onChange={setDateRange} />

        {/* Header: Section Nav + Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Section tabs */}
          <div className="flex flex-wrap gap-1">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  activeSection === sec.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                title={sec.desc}
              >
                <span className="inline-flex items-center gap-1.5">
                  {sectionIcons[sec.id]}
                  {sec.label}
                </span>
              </button>
            ))}
          </div>

          {/* Export */}
          <button
            onClick={() => setExportModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 whitespace-nowrap inline-flex items-center gap-1.5"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            Export / Schedule
          </button>
        </div>

        {/* Summary Cards — always shown */}
        <RevenueSummaryCards data={summary} isLoading={loadingSummary} />

        {/* ===== OVERVIEW shows all ===== */}
        {(activeSection === 'overview' || activeSection === 'daily') && (
          <ComponentCard title="Daily Revenue Trend">
            <div className="mb-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={compareEnabled}
                  onChange={(e) => setCompareEnabled(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-gray-600 dark:text-gray-400">Compare with previous period</span>
              </label>
            </div>
            <RevenueLineChart data={dailyData} isLoading={loadingDaily} onDayClick={handleDayDrillDown} />
          </ComponentCard>
        )}

        {(activeSection === 'overview' || activeSection === 'methods') && (
          <ComponentCard title="Revenue by Payment Method">
            <MethodPieChart data={methodData} isLoading={loadingMethods} onMethodClick={handleMethodDrillDown} />
          </ComponentCard>
        )}

        {(activeSection === 'overview' || activeSection === 'doctors') && (
          <ComponentCard title="Revenue by Doctor">
            <DoctorRevenueChart data={doctorData} isLoading={loadingDoctors} onDoctorClick={handleDoctorDrillDown} />
          </ComponentCard>
        )}

        {(activeSection === 'overview' || activeSection === 'appointments') && (
          <ComponentCard title="Revenue by Appointment Type">
            <AppointmentTypeChart
              data={apptTypeData}
              isLoading={loadingApptTypes}
              includePrepay={includePrepay}
              onIncludePrepayChange={setIncludePrepay}
              onTypeClick={handleApptTypeDrillDown}
            />
          </ComponentCard>
        )}

        {(activeSection === 'overview' || activeSection === 'refunds') && (
          <ComponentCard title="Refund Impact Analysis">
            <RefundAnalysis data={refundData} isLoading={loadingRefunds} />
          </ComponentCard>
        )}

        {/* Revenue Definition Note */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl text-sm text-blue-700 dark:text-blue-300">
          <strong className="inline-flex items-center gap-1.5"><BookOpenIcon className="h-4 w-4" /> Revenue Definitions:</strong>
          <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
            <li><strong>Gross Revenue</strong> = Total amount from COMPLETED payments in the period</li>
            <li><strong>Refunded Amount</strong> = Total from COMPLETED refunds in the period</li>
            <li><strong>Net Revenue</strong> = Gross Revenue − Refunded Amount</li>
            <li><strong>Pending Amount</strong> = Not counted in revenue — awaiting completion</li>
          </ul>
        </div>
      </div>

      {/* Drill-down Drawer */}
      <DrillDownDrawer config={drillDown} onClose={() => setDrillDown(null)} />

      {/* Export Modal */}
      <ExportReportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        dateRange={dateRange}
      />
    </>
  );
};

export default RevenueReports;
