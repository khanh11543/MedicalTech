import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import {
  MethodRevenueDTO,
  formatCurrency,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_COLORS,
} from '../../../services/revenueService';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';

interface MethodPieChartProps {
  data: MethodRevenueDTO[] | undefined;
  isLoading: boolean;
  onMethodClick?: (method: string) => void;
}

const MethodPieChart: React.FC<MethodPieChartProps> = ({ data, isLoading, onMethodClick }) => {
  const { labels, values, colors } = useMemo(() => {
    if (!data?.length) return { labels: [] as string[], values: [] as number[], colors: [] as string[] };
    return {
      labels: data.map((d) => PAYMENT_METHOD_LABELS[d.method] || d.method),
      values: data.map((d) => d.grossRevenue),
      colors: data.map((d) => PAYMENT_METHOD_COLORS[d.method] || '#6b7280'),
    };
  }, [data]);

  const pieOptions: ApexOptions = useMemo(() => ({
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'donut',
      offsetX: 8,
      offsetY: 8,
      events: {
        dataPointSelection: (_e: any, _ctx: any, config: any) => {
          if (onMethodClick && data) {
            onMethodClick(data[config.dataPointIndex].method);
          }
        },
      },
    },
    labels,
    colors,
    legend: {
      show: true,
      position: 'bottom',
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: { fontSize: '12px', fontWeight: 600, colors: ['#FFFFFF'] },
    },
    tooltip: {
      y: {
        formatter: (val: number) => formatCurrency(val),
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '55%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Gross',
              formatter: (w: any) => {
                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                return formatCurrency(total);
              },
            },
          },
        },
      },
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: { width: 300 },
        legend: { position: 'bottom' },
      },
    }],
  }), [labels, colors, data, onMethodClick]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-gray-400">No data</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pie Chart */}
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <Chart options={pieOptions} series={values} type="donut" height={320} />
        </div>
      </div>

      {/* Method Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader>Method</TableCell>
              <TableCell isHeader>Gross Revenue</TableCell>
              <TableCell isHeader>Refunded</TableCell>
              <TableCell isHeader>Net Revenue</TableCell>
              <TableCell isHeader>Count</TableCell>
              <TableCell isHeader>Share</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.method}
                className={onMethodClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''}
                onClick={() => onMethodClick?.(row.method)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PAYMENT_METHOD_COLORS[row.method] || '#6b7280' }}
                    />
                    <span className="font-medium">{PAYMENT_METHOD_LABELS[row.method] || row.method}</span>
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(row.grossRevenue)}</TableCell>
                <TableCell className="text-red-500">{formatCurrency(row.refundedAmount)}</TableCell>
                <TableCell className="font-medium">{formatCurrency(row.netRevenue)}</TableCell>
                <TableCell>{row.transactionCount.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${row.percentage}%`,
                          backgroundColor: PAYMENT_METHOD_COLORS[row.method] || '#6b7280',
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

      {onMethodClick && (
        <p className="text-xs text-gray-400 text-center">
          💡 Click a method row or pie slice to drill down into transactions
        </p>
      )}
    </div>
  );
};

export default MethodPieChart;
