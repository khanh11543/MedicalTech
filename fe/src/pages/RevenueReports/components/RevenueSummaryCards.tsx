import React from 'react';
import { RevenueSummaryDTO, formatCurrency, formatCompactCurrency, formatPercent } from '../../../services/revenueService';

interface RevenueSummaryCardsProps {
  data: RevenueSummaryDTO | undefined;
  isLoading: boolean;
}

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  change?: number;
  icon: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, change, icon, color }) => (
  <div className="p-5 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white/90 mt-1">{value}</h3>
        {subValue && <p className="text-xs text-gray-400 mt-0.5">{subValue}</p>}
        {change !== undefined && (
          <p className={`text-sm mt-1 font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change >= 0 ? '↑' : '↓'} {formatPercent(change)}
            <span className="text-gray-400 font-normal ml-1">vs prev period</span>
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <span className="text-xl">{icon}</span>
      </div>
    </div>
  </div>
);

const LoadingCard: React.FC = () => (
  <div className="p-5 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03] animate-pulse">
    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
    <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
  </div>
);

const RevenueSummaryCards: React.FC<RevenueSummaryCardsProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Gross Revenue"
          value={formatCompactCurrency(data.grossRevenue)}
          subValue={formatCurrency(data.grossRevenue)}
          change={data.grossRevenueChange}
          icon="💰"
          color="bg-green-100 dark:bg-green-500/20"
        />
        <StatCard
          label="Net Revenue"
          value={formatCompactCurrency(data.netRevenue)}
          subValue={formatCurrency(data.netRevenue)}
          change={data.netRevenueChange}
          icon="📊"
          color="bg-blue-100 dark:bg-blue-500/20"
        />
        <StatCard
          label="Total Transactions"
          value={data.totalTransactions.toLocaleString()}
          subValue={`${data.completedTransactions} completed`}
          change={data.transactionCountChange}
          icon="🧾"
          color="bg-indigo-100 dark:bg-indigo-500/20"
        />
        <StatCard
          label="Avg Transaction"
          value={formatCurrency(data.averageTransactionValue)}
          icon="📈"
          color="bg-purple-100 dark:bg-purple-500/20"
        />
      </div>

      {/* Secondary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Refunded Amount"
          value={formatCompactCurrency(data.refundedAmount)}
          subValue={`${data.refundCount} refunds`}
          icon="🔄"
          color="bg-red-100 dark:bg-red-500/20"
        />
        <StatCard
          label="Refund Rate"
          value={`${data.refundRate.toFixed(1)}%`}
          subValue={`${data.refundCount} / ${data.completedTransactions}`}
          icon="📉"
          color="bg-orange-100 dark:bg-orange-500/20"
        />
        <StatCard
          label="Pending Amount"
          value={formatCompactCurrency(data.pendingAmount)}
          subValue={`${data.pendingTransactions} pending`}
          icon="⏳"
          color="bg-amber-100 dark:bg-amber-500/20"
        />
        <StatCard
          label="Revenue / Day"
          value={formatCompactCurrency(data.dailyAverageRevenue || (data.grossRevenue / Math.max(data.totalDays || 30, 1)))}
          subValue={data.peakRevenueDay ? `Peak: ${data.peakRevenueDay}` : 'Avg daily gross'}
          icon="📅"
          color="bg-teal-100 dark:bg-teal-500/20"
        />
      </div>
    </div>
  );
};

export default RevenueSummaryCards;
