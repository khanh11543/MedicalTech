import React, { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import dayjs from 'dayjs';
import { DailyRevenueComparisonDTO, formatCurrency } from '../../../services/revenueService';

interface RevenueLineChartProps {
  data: DailyRevenueComparisonDTO | undefined;
  isLoading: boolean;
  onDayClick?: (date: string) => void;
}

const RevenueLineChart: React.FC<RevenueLineChartProps> = ({ data, isLoading, onDayClick }) => {
  const [showComparison, setShowComparison] = useState(false);
  const [showNet, setShowNet] = useState(true);

  const { categories, series } = useMemo(() => {
    if (!data?.currentPeriod?.length) {
      return { categories: [] as string[], series: [] as ApexAxisChartSeries };
    }

    const cats = data.currentPeriod.map((d) => dayjs(d.date).format('DD/MM'));

    const seriesArr: ApexAxisChartSeries = [
      {
        name: 'Gross Revenue',
        data: data.currentPeriod.map((d) => d.grossRevenue),
      },
    ];

    if (showNet) {
      seriesArr.push({
        name: 'Net Revenue',
        data: data.currentPeriod.map((d) => d.netRevenue),
      });
    }

    if (showComparison && data.previousPeriod?.length) {
      seriesArr.push({
        name: 'Previous Gross',
        data: data.previousPeriod.map((d) => d.grossRevenue),
      });
      if (showNet) {
        seriesArr.push({
          name: 'Previous Net',
          data: data.previousPeriod.map((d) => d.netRevenue),
        });
      }
    }

    return { categories: cats, series: seriesArr };
  }, [data, showComparison, showNet]);

  const options: ApexOptions = useMemo(() => ({
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'area',
      height: 350,
      toolbar: { show: true },
      zoom: { enabled: true },
      events: {
        dataPointSelection: (_event: any, _chartContext: any, config: any) => {
          if (onDayClick && data?.currentPeriod) {
            const date = data.currentPeriod[config.dataPointIndex]?.date;
            if (date) onDayClick(date);
          }
        },
      },
    },
    colors: ['#465FFF', '#10b981', '#9CA3AF', '#6EE7B7'],
    stroke: {
      curve: 'smooth',
      width: [2, 2, 1, 1],
      dashArray: [0, 0, 5, 5],
    },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.3, opacityTo: 0.05 },
    },
    markers: {
      size: 0,
      hover: { size: 6 },
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        rotate: -45,
        style: { fontSize: '11px' },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => {
          if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M`;
          if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
          return val.toString();
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => formatCurrency(val),
      },
    },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
    },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
  }), [categories, data, onDayClick]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    );
  }

  if (!data?.currentPeriod?.length) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <div className="text-gray-400">No data for selected period</div>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showNet}
            onChange={(e) => setShowNet(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-gray-600 dark:text-gray-400">Net Revenue overlay</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showComparison}
            onChange={(e) => setShowComparison(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-gray-600 dark:text-gray-400">Compare previous period</span>
        </label>
      </div>

      {/* Chart */}
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[700px]">
          <Chart options={options} series={series} type="area" height={350} />
        </div>
      </div>

      {/* Click hint */}
      {onDayClick && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          💡 Click on a data point to view transactions for that day
        </p>
      )}
    </div>
  );
};

export default RevenueLineChart;
