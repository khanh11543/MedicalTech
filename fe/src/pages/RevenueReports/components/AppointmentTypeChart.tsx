import React, { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import {
  AppointmentTypeRevenueDTO,
  formatCurrency,
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_TYPE_COLORS,
} from '../../../services/revenueService';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';

interface AppointmentTypeChartProps {
  data: AppointmentTypeRevenueDTO[] | undefined;
  isLoading: boolean;
  includePrepay: boolean;
  onIncludePrepayChange: (val: boolean) => void;
  onTypeClick?: (type: string) => void;
}

const AppointmentTypeChart: React.FC<AppointmentTypeChartProps> = ({
  data,
  isLoading,
  includePrepay,
  onIncludePrepayChange,
  onTypeClick,
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const chartData = useMemo(() => {
    if (!data?.length) return { labels: [] as string[], values: [] as number[], colors: [] as string[] };
    return {
      labels: data.map((d) => APPOINTMENT_TYPE_LABELS[d.appointmentType] || d.appointmentType),
      values: data.map((d) => d.grossRevenue),
      colors: data.map((d) => APPOINTMENT_TYPE_COLORS[d.appointmentType] || '#6b7280'),
    };
  }, [data]);

  const barOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        fontFamily: 'Outfit, sans-serif',
        type: 'bar',
        height: 320,
        toolbar: { show: false },
        events: {
          dataPointSelection: (_e: any, _ctx: any, config: any) => {
            if (onTypeClick && data) {
              onTypeClick(data[config.dataPointIndex].appointmentType);
            }
          },
        },
      },
      colors: chartData.colors,
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '50%',
          borderRadius: 6,
          borderRadiusApplication: 'end' as const,
          distributed: true,
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: chartData.labels,
        axisBorder: { show: false },
        axisTicks: { show: false },
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
      legend: { show: false },
      grid: {
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
    }),
    [chartData, data, onTypeClick],
  );

  const barSeries = useMemo(
    () => [{ name: 'Gross Revenue', data: chartData.values }],
    [chartData],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[320px]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includePrepay}
            onChange={(e) => onIncludePrepayChange(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-gray-600 dark:text-gray-400">Include prepaid appointments</span>
        </label>

        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'chart'
                ? 'bg-white dark:bg-gray-600 shadow text-gray-800 dark:text-white'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            📊 Chart
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'table'
                ? 'bg-white dark:bg-gray-600 shadow text-gray-800 dark:text-white'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            📋 Table
          </button>
        </div>
      </div>

      {!data?.length ? (
        <div className="flex items-center justify-center h-[250px]">
          <div className="text-gray-400">No data</div>
        </div>
      ) : viewMode === 'chart' ? (
        <div className="max-w-full overflow-x-auto">
          <Chart options={barOptions} series={barSeries} type="bar" height={320} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Type</TableCell>
                <TableCell isHeader>Gross Revenue</TableCell>
                <TableCell isHeader>Net Revenue</TableCell>
                <TableCell isHeader>Transactions</TableCell>
                <TableCell isHeader>Share</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow
                  key={row.appointmentType}
                  className={onTypeClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''}
                  onClick={() => onTypeClick?.(row.appointmentType)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: APPOINTMENT_TYPE_COLORS[row.appointmentType] || '#6b7280' }}
                      />
                      <span className="font-medium">
                        {APPOINTMENT_TYPE_LABELS[row.appointmentType] || row.appointmentType}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(row.grossRevenue)}</TableCell>
                  <TableCell>{formatCurrency(row.netRevenue)}</TableCell>
                  <TableCell>{row.transactionCount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${row.percentage}%`,
                            backgroundColor: APPOINTMENT_TYPE_COLORS[row.appointmentType] || '#6b7280',
                          }}
                        />
                      </div>
                      <span className="text-sm">{row.percentage.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {onTypeClick && (
        <p className="text-xs text-gray-400 text-center">
          💡 Click an appointment type to drill down into transactions
        </p>
      )}
    </div>
  );
};

export default AppointmentTypeChart;
