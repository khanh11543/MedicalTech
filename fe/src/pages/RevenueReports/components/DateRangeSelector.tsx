import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import * as revenueService from '../../../services/revenueService';

interface DateRangeSelectorProps {
  dateRange: revenueService.DateRange;
  onChange: (range: revenueService.DateRange) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ dateRange, onChange }) => {
  const warning = useMemo(() => {
    if (dateRange.startDate && dateRange.endDate) {
      return revenueService.isRangeExcessive(dateRange.startDate, dateRange.endDate);
    }
    return false;
  }, [dateRange.startDate, dateRange.endDate]);

  const handlePreset = (preset: revenueService.DatePreset) => {
    const now = dayjs();
    let start: dayjs.Dayjs;
    let end: dayjs.Dayjs;

    switch (preset) {
      case 'this_month':
        start = now.startOf('month');
        end = now.endOf('month');
        break;
      case 'last_month':
        start = now.subtract(1, 'month').startOf('month');
        end = now.subtract(1, 'month').endOf('month');
        break;
      case 'this_quarter':
        start = now.startOf('quarter' as any);
        end = now.endOf('quarter' as any);
        break;
      case 'last_quarter':
        start = now.subtract(1, 'quarter' as any).startOf('quarter' as any);
        end = now.subtract(1, 'quarter' as any).endOf('quarter' as any);
        break;
      case 'this_year':
        start = now.startOf('year');
        end = now.endOf('year');
        break;
      case 'custom':
        onChange({ ...dateRange, preset: 'custom' });
        return;
      default:
        start = now.startOf('month');
        end = now.endOf('month');
    }

    onChange({
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
      preset,
    });
  };

  const handleCustomDate = (field: 'startDate' | 'endDate', value: string) => {
    onChange({
      ...dateRange,
      preset: 'custom',
      [field]: value,
    });
  };

  return (
    <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-2">
          {revenueService.DATE_PRESET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handlePreset(opt.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                dateRange.preset === opt.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs */}
        {dateRange.preset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleCustomDate('startDate', e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleCustomDate('endDate', e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            />
          </div>
        )}

        {/* Date Display */}
        <div className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
          {dayjs(dateRange.startDate).format('DD/MM/YYYY')} — {dayjs(dateRange.endDate).format('DD/MM/YYYY')}
          <span className="ml-2 text-xs">
            ({revenueService.getDaysInRange(dateRange.startDate, dateRange.endDate)} days)
          </span>
        </div>
      </div>

      {/* Heavy Report Warning */}
      {warning && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
          <span className="text-amber-500 text-lg">⚠️</span>
          <div>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Report may be heavy — range exceeds 12 months
            </span>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
              Consider narrowing the date range for faster loading. Large reports can take time to generate.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector;
