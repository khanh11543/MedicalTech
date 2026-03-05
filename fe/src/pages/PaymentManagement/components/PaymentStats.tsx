import React from 'react';
import ComponentCard from "../../../components/common/ComponentCard";

// ==================== SVG ICONS ====================
const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const BanknotesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArrowUturnLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChartBarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  pendingPayments: number;
  completedPayments: number;
  failedPayments: number;
  refundedPayments: number;
  todayRevenue: number;
  monthlyRevenue: number;
}

interface PaymentStatsProps {
  stats: PaymentStats;
  isLoading: boolean;
}

const StatCard = ({ title, value, icon, color, isLoading }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  isLoading: boolean;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
          {isLoading ? '...' : value}
        </h3>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} text-white`}>
        {icon}
      </div>
    </div>
  </div>
);

const PaymentStats: React.FC<PaymentStatsProps> = ({ stats, isLoading }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <ComponentCard title="Payment Statistics">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <StatCard
          title="Total Payments"
          value={stats.totalPayments}
          icon={<CreditCardIcon />}
          color="bg-blue-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Amount"
          value={formatCurrency(stats.totalAmount)}
          icon={<BanknotesIcon />}
          color="bg-emerald-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Pending"
          value={stats.pendingPayments}
          icon={<ClockIcon />}
          color="bg-amber-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Completed"
          value={stats.completedPayments}
          icon={<CheckCircleIcon />}
          color="bg-green-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Failed"
          value={stats.failedPayments}
          icon={<XCircleIcon />}
          color="bg-red-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Refunded"
          value={stats.refundedPayments}
          icon={<ArrowUturnLeftIcon />}
          color="bg-orange-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Today Revenue"
          value={formatCurrency(stats.todayRevenue)}
          icon={<CalendarIcon />}
          color="bg-purple-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={<ChartBarIcon />}
          color="bg-indigo-500"
          isLoading={isLoading}
        />
      </div>
    </ComponentCard>
  );
};

export default PaymentStats;