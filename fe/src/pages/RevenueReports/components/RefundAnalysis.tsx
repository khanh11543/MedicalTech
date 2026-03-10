import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import dayjs from 'dayjs';
import {
  RefundAnalysisDTO,
  formatCurrency,
  formatCompactCurrency,
} from '../../../services/revenueService';

interface RefundAnalysisProps {
  data: RefundAnalysisDTO | undefined;
  isLoading: boolean;
}

const RefundAnalysis: React.FC<RefundAnalysisProps> = ({ data, isLoading }) => {
  // ===== Reason distribution donut =====
  const { reasonLabels, reasonValues, reasonColors } = useMemo(() => {
    if (!data?.reasonDistribution?.length) {
      return { reasonLabels: [] as string[], reasonValues: [] as number[], reasonColors: [] as string[] };
    }
    const palette = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#6b7280'];
    return {
      reasonLabels: data.reasonDistribution.map((r) => r.reason.replace(/_/g, ' ')),
      reasonValues: data.reasonDistribution.map((r) => r.count),
      reasonColors: data.reasonDistribution.map((_, i) => palette[i % palette.length]),
    };
  }, [data]);

  const reasonDonutOptions: ApexOptions = useMemo(
    () => ({
      chart: { fontFamily: 'Outfit, sans-serif', type: 'donut' },
      labels: reasonLabels,
      colors: reasonColors,
      legend: { position: 'bottom', fontSize: '12px' },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(1)}%`,
      },
      tooltip: {
        y: { formatter: (val: number) => `${val} refunds` },
      },
      plotOptions: {
        pie: {
          donut: {
            size: '50%',
            labels: {
              show: true,
              total: { show: true, label: 'Total', formatter: (w: any) =>
                w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toString(),
              },
            },
          },
        },
      },
    }),
    [reasonLabels, reasonColors],
  );

  // ===== Refund trend line =====
  const trendOptions: ApexOptions = useMemo(() => {
    if (!data?.trendData?.length) return {} as ApexOptions;
    return {
      chart: {
        fontFamily: 'Outfit, sans-serif',
        type: 'area',
        height: 250,
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      colors: ['#ef4444', '#f59e0b'],
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.25, opacityTo: 0.05 } },
      xaxis: {
        categories: data.trendData.map((t) => dayjs(t.date).format('DD/MM')),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { rotate: -45, style: { fontSize: '10px' } },
      },
      yaxis: [
        {
          title: { text: 'Amount' },
          labels: {
            formatter: (val: number) => {
              if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M`;
              if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
              return val.toString();
            },
          },
        },
        {
          opposite: true,
          title: { text: 'Count' },
          labels: { formatter: (val: number) => val.toFixed(0) },
        },
      ],
      tooltip: {
        y: {
          formatter: (val: number, opts: any) => {
            if (opts.seriesIndex === 0) return formatCurrency(val);
            return `${val} refunds`;
          },
        },
      },
      dataLabels: { enabled: false },
      legend: { position: 'top', horizontalAlign: 'left' },
    };
  }, [data]);

  const trendSeries = useMemo(() => {
    if (!data?.trendData?.length) return [];
    return [
      { name: 'Refund Amount', data: data.trendData.map((t) => t.amount) },
      { name: 'Refund Count', data: data.trendData.map((t) => t.count) },
    ];
  }, [data]);

  // ===== Refund rate trend =====
  const rateTrendOptions: ApexOptions = useMemo(() => {
    if (!data?.refundRateTrend?.length) return {} as ApexOptions;
    return {
      chart: {
        fontFamily: 'Outfit, sans-serif',
        type: 'line',
        height: 220,
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      colors: ['#8b5cf6'],
      stroke: { curve: 'smooth', width: 2 },
      markers: { size: 3, hover: { size: 5 } },
      xaxis: {
        categories: data.refundRateTrend.map((t) => dayjs(t.date).format('DD/MM')),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { rotate: -45, style: { fontSize: '10px' } },
      },
      yaxis: {
        title: { text: 'Rate (%)' },
        labels: { formatter: (val: number) => `${val.toFixed(1)}%` },
        min: 0,
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val.toFixed(2)}%`,
        },
      },
      dataLabels: { enabled: false },
      annotations: {
        yaxis: [
          {
            y: 5,
            borderColor: '#f59e0b',
            strokeDashArray: 4,
            label: {
              text: '5% threshold',
              style: { color: '#f59e0b', background: 'transparent' },
              position: 'left',
            },
          },
        ],
      },
    };
  }, [data]);

  const rateTrendSeries = useMemo(() => {
    if (!data?.refundRateTrend?.length) return [];
    return [{ name: 'Refund Rate', data: data.refundRateTrend.map((t) => t.rate) }];
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-gray-400">Loading refund analysis...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[250px]">
        <div className="text-gray-400">No refund data</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400">Total Refunded</p>
          <p className="text-lg font-bold text-red-700 dark:text-red-300">{formatCompactCurrency(data.totalRefunded)}</p>
          <p className="text-xs text-red-500">{formatCurrency(data.totalRefunded)}</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-600 dark:text-amber-400">Refund Count</p>
          <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{data.refundCount.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-purple-600 dark:text-purple-400">Avg Refund</p>
          <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{formatCurrency(data.averageRefundAmount)}</p>
        </div>
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400">Refund Rate</p>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{data.refundRate.toFixed(2)}%</p>
        </div>
      </div>

      {/* Two-column: Reason distribution + Refund trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reason donut */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-white/80 mb-3">Reason Distribution</h4>
          {data.reasonDistribution?.length ? (
            <Chart options={reasonDonutOptions} series={reasonValues} type="donut" height={280} />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400">No reason data</div>
          )}

          {/* Reason table */}
          {data.reasonDistribution?.length > 0 && (
            <div className="mt-3 space-y-1">
              {data.reasonDistribution.map((r) => (
                <div key={r.reason} className="flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <span className="text-gray-600 dark:text-gray-400">{r.reason.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">{r.count}</span>
                    <span className="font-medium text-red-600">{formatCurrency(r.amount)}</span>
                    <span className="text-xs text-gray-400">{r.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Refund trend */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-white/80 mb-3">Refund Trend</h4>
          {data.trendData?.length ? (
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[400px]">
                <Chart options={trendOptions} series={trendSeries} type="area" height={250} />
              </div>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">No trend data</div>
          )}
        </div>
      </div>

      {/* Refund Rate Trend (full width) */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-white/80 mb-3">
          Refund Rate Trend
          <span className="ml-2 text-xs font-normal text-gray-400">(% of completed transactions refunded)</span>
        </h4>
        {data.refundRateTrend?.length ? (
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[500px]">
              <Chart options={rateTrendOptions} series={rateTrendSeries} type="line" height={220} />
            </div>
          </div>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-gray-400">No rate trend data</div>
        )}
      </div>
    </div>
  );
};

export default RefundAnalysis;
