import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { LightBulbIcon } from '@heroicons/react/24/outline';
import {
  DoctorRevenueDTO,
  formatCurrency,
  formatCompactCurrency,
} from '../../../services/revenueService';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';

interface DoctorRevenueChartProps {
  data: DoctorRevenueDTO[] | undefined;
  isLoading: boolean;
  onDoctorClick?: (doctorId: number) => void;
}

const DoctorRevenueChart: React.FC<DoctorRevenueChartProps> = ({ data, isLoading, onDoctorClick }) => {
  const top10 = useMemo(() => (data || []).slice(0, 10), [data]);

  const barOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        fontFamily: 'Outfit, sans-serif',
        type: 'bar',
        height: 400,
        toolbar: { show: false },
        events: {
          dataPointSelection: (_e: any, _ctx: any, config: any) => {
            if (onDoctorClick && top10[config.dataPointIndex]) {
              onDoctorClick(top10[config.dataPointIndex].doctorId);
            }
          },
        },
      },
      colors: ['#465FFF', '#10b981'],
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          barHeight: '60%',
          dataLabels: { position: 'top' },
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: top10.map((d) => d.doctorName),
        labels: {
          formatter: (val: string) => {
            const num = Number(val);
            if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(0)}M`;
            if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
            return val;
          },
        },
      },
      yaxis: {
        labels: {
          style: { fontSize: '12px' },
          maxWidth: 150,
        },
      },
      tooltip: {
        y: {
          formatter: (val: number) => formatCurrency(val),
        },
      },
      legend: { position: 'top', horizontalAlign: 'left' },
      grid: {
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
      },
    }),
    [top10, onDoctorClick],
  );

  const barSeries = useMemo(
    () => [
      { name: 'Gross Revenue', data: top10.map((d) => d.grossRevenue) },
      { name: 'Net Revenue', data: top10.map((d) => d.netRevenue) },
    ],
    [top10],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-gray-400">No doctor revenue data</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bar Chart — Top 10 */}
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[600px]">
          <Chart options={barOptions} series={barSeries} type="bar" height={400} />
        </div>
      </div>

      {/* Full Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader>#</TableCell>
              <TableCell isHeader>Doctor</TableCell>
              <TableCell isHeader>Specialization</TableCell>
              <TableCell isHeader>Gross Revenue</TableCell>
              <TableCell isHeader>Net Revenue</TableCell>
              <TableCell isHeader>Transactions</TableCell>
              <TableCell isHeader>Avg Fee</TableCell>
              <TableCell isHeader>Refund Rate</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((doc, idx) => (
              <TableRow
                key={doc.doctorId}
                className={onDoctorClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''}
                onClick={() => onDoctorClick?.(doc.doctorId)}
              >
                <TableCell>{idx + 1}</TableCell>
                <TableCell>
                  <span className="font-medium text-gray-800 dark:text-white/90">{doc.doctorName}</span>
                </TableCell>
                <TableCell className="text-gray-500 text-sm">{doc.specialization}</TableCell>
                <TableCell className="font-medium">{formatCompactCurrency(doc.grossRevenue)}</TableCell>
                <TableCell>{formatCompactCurrency(doc.netRevenue)}</TableCell>
                <TableCell>{doc.transactionCount.toLocaleString()}</TableCell>
                <TableCell>{formatCurrency(doc.averageFee)}</TableCell>
                <TableCell>
                  <span
                    className={`text-sm font-medium ${
                      doc.refundRate > 10 ? 'text-red-500' : doc.refundRate > 5 ? 'text-amber-500' : 'text-green-500'
                    }`}
                  >
                    {doc.refundRate.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-400 ml-1">({doc.refundCount})</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {onDoctorClick && (
        <p className="text-xs text-gray-400 text-center">
          <LightBulbIcon className="h-4 w-4 inline text-yellow-400" /> Click a doctor row or bar to view their transactions
        </p>
      )}
    </div>
  );
};

export default DoctorRevenueChart;
