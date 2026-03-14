import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ArrowUpTrayIcon, TableCellsIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Badge from '../../../components/ui/badge/Badge';
import * as revenueService from '../../../services/revenueService';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange: revenueService.DateRange;
}

const ExportReportModal: React.FC<ExportReportModalProps> = ({ isOpen, onClose, dateRange }) => {
  const queryClient = useQueryClient();

  // ===== Export state =====
  const [activeTab, setActiveTab] = useState<'export' | 'schedule'>('export');
  const [exportFormat, setExportFormat] = useState<revenueService.ExportFormat>('pdf');
  const [exportSections, setExportSections] = useState<revenueService.ExportSection[]>([
    'summary', 'transactions', 'methods', 'doctors', 'appointments', 'refunds',
  ]);
  const [includeCharts, setIncludeCharts] = useState(true);

  // ===== Schedule state =====
  const [schedFrequency, setSchedFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [schedRecipients, setSchedRecipients] = useState('');
  const [schedSections, setSchedSections] = useState<revenueService.ExportSection[]>(['summary', 'methods']);
  const [schedFormat, setSchedFormat] = useState<revenueService.ExportFormat>('excel');

  // ===== Queries =====
  const { data: scheduledReports, isLoading: loadingSchedules } = useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: revenueService.getScheduledReports,
    enabled: isOpen && activeTab === 'schedule',
  });

  // ===== Mutations =====
  const exportMutation = useMutation({
    mutationFn: async () => {
      const blob = await revenueService.exportReport({
        format: exportFormat,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        sections: exportSections,
        includeCharts: exportFormat === 'pdf' ? includeCharts : undefined,
      });
      const ext = exportFormat === 'pdf' ? 'pdf' : 'xlsx';
      const filename = `revenue_report_${dateRange.startDate}_${dateRange.endDate}.${ext}`;
      revenueService.downloadBlob(blob, filename);
    },
    onSuccess: () => {
      alert('Report exported successfully!');
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to export report');
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: async () => {
      const recipients = schedRecipients.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
      if (!recipients.length) throw new Error('At least one recipient email required');
      return await revenueService.createScheduledReport({
        frequency: schedFrequency,
        recipients,
        sections: schedSections,
        format: schedFormat,
        active: true,
      });
    },
    onSuccess: () => {
      alert('Scheduled report created!');
      setSchedRecipients('');
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
    },
    onError: (error: any) => {
      alert(error?.message || error?.response?.data?.message || 'Failed to create schedule');
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: revenueService.deleteScheduledReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
    },
  });

  // Section toggle helper
  const toggleSection = (section: revenueService.ExportSection, list: revenueService.ExportSection[], setter: React.Dispatch<React.SetStateAction<revenueService.ExportSection[]>>) => {
    setter(list.includes(section) ? list.filter((s) => s !== section) : [...list, section]);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm" />
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white inline-flex items-center gap-2"><ArrowUpTrayIcon className="h-5 w-5" /> Export & Schedule Reports</h3>
            <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"><XMarkIcon className="h-5 w-5" /></button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 px-5">
            <button
              onClick={() => setActiveTab('export')}
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📥 Export Now
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'schedule'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📅 Schedule Reports
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {activeTab === 'export' ? (
              <>
                {/* Date display */}
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-300">
                  📅 <strong>Period:</strong> {dayjs(dateRange.startDate).format('DD/MM/YYYY')} — {dayjs(dateRange.endDate).format('DD/MM/YYYY')}
                </div>

                {/* Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Format</label>
                  <div className="flex gap-3">
                    <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                      exportFormat === 'pdf' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'
                    }`}>
                      <input
                        type="radio"
                        name="format"
                        value="pdf"
                        checked={exportFormat === 'pdf'}
                        onChange={() => setExportFormat('pdf')}
                        className="text-blue-600"
                      />
                      <div>
                        <span className="font-medium">📄 PDF</span>
                        <p className="text-xs text-gray-500">Formatted report with charts, watermarked</p>
                      </div>
                    </label>
                    <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                      exportFormat === 'excel' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'
                    }`}>
                      <input
                        type="radio"
                        name="format"
                        value="excel"
                        checked={exportFormat === 'excel'}
                        onChange={() => setExportFormat('excel')}
                        className="text-blue-600"
                      />
                      <div>
                        <span className="font-medium inline-flex items-center gap-1"><TableCellsIcon className="h-4 w-4" /> Excel</span>
                        <p className="text-xs text-gray-500">Data-only, multi-sheet workbook</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Sections */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Include Sections
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {revenueService.EXPORT_SECTION_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition ${
                          exportSections.includes(opt.value)
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={exportSections.includes(opt.value)}
                          onChange={() => toggleSection(opt.value, exportSections, setExportSections)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Include Charts (PDF-only) */}
                {exportFormat === 'pdf' && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={includeCharts}
                      onChange={(e) => setIncludeCharts(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-gray-600 dark:text-gray-400">Include charts & visualizations in PDF</span>
                  </label>
                )}

                {/* Watermark notice */}
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                  ⚠️ Exported files are watermarked with your username and timestamp. Download links expire after 24 hours.
                </div>

                {/* Export button */}
                <button
                  onClick={() => exportMutation.mutate()}
                  disabled={exportMutation.isPending || exportSections.length === 0}
                  className="w-full py-2.5 px-4 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {exportMutation.isPending ? 'Generating...' : `Export ${exportFormat.toUpperCase()}`}
                </button>
              </>
            ) : (
              <>
                {/* Create new schedule */}
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">New Scheduled Report</h4>

                  {/* Frequency */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Frequency</label>
                    <div className="flex gap-2">
                      {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setSchedFrequency(f)}
                          className={`px-3 py-1.5 text-sm rounded-lg border ${
                            schedFrequency === f
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recipients */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Recipients (emails, comma-separated)
                    </label>
                    <textarea
                      value={schedRecipients}
                      onChange={(e) => setSchedRecipients(e.target.value)}
                      placeholder="admin@clinic.com, finance@clinic.com"
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    />
                  </div>

                  {/* Format + Sections */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Format</label>
                      <select
                        value={schedFormat}
                        onChange={(e) => setSchedFormat(e.target.value as revenueService.ExportFormat)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                      >
                        <option value="pdf">PDF</option>
                        <option value="excel">Excel</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Sections</label>
                      <div className="flex flex-wrap gap-1">
                        {revenueService.EXPORT_SECTION_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => toggleSection(opt.value, schedSections, setSchedSections)}
                            className={`px-2 py-0.5 text-xs rounded-full border ${
                              schedSections.includes(opt.value)
                                ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300'
                                : 'border-gray-300 dark:border-gray-600 text-gray-500'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => createScheduleMutation.mutate()}
                    disabled={createScheduleMutation.isPending || !schedRecipients.trim() || schedSections.length === 0}
                    className="w-full py-2 px-4 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {createScheduleMutation.isPending ? 'Creating...' : 'Create Schedule'}
                  </button>
                </div>

                {/* Existing schedules */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Existing Scheduled Reports
                  </h4>
                  {loadingSchedules ? (
                    <div className="text-sm text-gray-400">Loading...</div>
                  ) : !scheduledReports?.length ? (
                    <div className="text-sm text-gray-400 py-4 text-center">No scheduled reports yet</div>
                  ) : (
                    <div className="space-y-2">
                      {scheduledReports.map((sr) => (
                        <div
                          key={sr.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge size="sm" color={sr.active ? 'success' : 'light'}>
                                {sr.active ? 'Active' : 'Paused'}
                              </Badge>
                              <span className="text-sm font-medium capitalize">{sr.frequency}</span>
                              <span className="text-xs text-gray-400">{sr.format.toUpperCase()}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              To: {sr.recipients.join(', ')}
                            </p>
                            <div className="flex gap-2 text-xs text-gray-400 mt-1">
                              {sr.lastSentAt && <span>Last sent: {dayjs(sr.lastSentAt).format('DD/MM/YYYY')}</span>}
                              <span>Next: {dayjs(sr.nextSendAt).format('DD/MM/YYYY')}</span>
                              <span>Created by: {sr.createdBy}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (confirm('Delete this scheduled report?')) {
                                deleteScheduleMutation.mutate(sr.id);
                              }
                            }}
                            className="ml-3 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-xs text-blue-700 dark:text-blue-400">
                  ℹ️ Only admin/finance roles can create scheduled reports. Each send logs a "REPORT_SENT" event.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ExportReportModal;
