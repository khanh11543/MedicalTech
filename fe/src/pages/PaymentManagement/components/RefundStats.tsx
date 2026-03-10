import React from 'react';
import ComponentCard from "../../../components/common/ComponentCard";
import * as refundService from '../../../services/refundService';

interface RefundStatsProps {
  stats: refundService.RefundStatsDTO;
  isLoading: boolean;
}

const StatCard = ({ title, value, icon, color, isLoading, subtitle }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  isLoading: boolean;
  subtitle?: string;
}) => (
  <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="flex flex-1 items-start justify-between">
      <div className="flex flex-col">
        <p className="min-h-[40px] text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
          {isLoading ? '...' : value}
        </h3>
        <p className="mt-0.5 min-h-[16px] text-xs text-gray-400 dark:text-gray-500">
          {subtitle || '\u00A0'}
        </p>
      </div>
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${color} text-white`}>
        {icon}
      </div>
    </div>
  </div>
);

// SVG Icons
const RequestedIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ProcessingIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const CompletedIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FailedIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UrgentIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const MoneyIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefundStats: React.FC<RefundStatsProps> = ({ stats, isLoading }) => {
  return (
    <ComponentCard title="Refund Statistics">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Pending Requested"
          value={stats.requestedCount}
          icon={<RequestedIcon />}
          color="bg-amber-500"
          isLoading={isLoading}
          subtitle="Awaiting approval"
        />
        <StatCard
          title="Processing"
          value={stats.processingCount}
          icon={<ProcessingIcon />}
          color="bg-blue-500"
          isLoading={isLoading}
          subtitle="Being processed"
        />
        <StatCard
          title="Completed"
          value={stats.completedCount}
          icon={<CompletedIcon />}
          color="bg-green-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Failed"
          value={stats.failedCount}
          icon={<FailedIcon />}
          color="bg-red-500"
          isLoading={isLoading}
          subtitle="Need attention"
        />
        <StatCard
          title="Rejected"
          value={stats.rejectedCount}
          icon={<UrgentIcon />}
          color="bg-orange-600"
          isLoading={isLoading}
          subtitle="Rejected requests"
        />
        <StatCard
          title="Total Refunded"
          value={refundService.formatCurrency(stats.totalRefundAmount)}
          icon={<MoneyIcon />}
          color="bg-purple-500"
          isLoading={isLoading}
          subtitle={`Completed: ${refundService.formatCurrency(stats.completedAmount)}`}
        />
      </div>
    </ComponentCard>
  );
};

export default RefundStats;
