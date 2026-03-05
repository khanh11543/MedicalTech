import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import PageMeta from '../../components/common/PageMeta';
import Badge from '../../components/ui/badge/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '../../components/ui/table';
import * as maintService from '../../services/maintenanceService';
import type {
  MaintenanceDashboard,
  MaintenanceWindowCreateDTO,
  ActivateMaintenanceDTO,
  MaintenanceRecord,
  MaintenanceType,
} from '../../services/maintenanceService';

type Tab = 'dashboard' | 'schedule' | 'activate' | 'history';

const ScheduledMaintenance: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [historyPage, setHistoryPage] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Schedule form
  const [schedForm, setSchedForm] = useState<MaintenanceWindowCreateDTO>({
    title: '',
    description: '',
    maintenanceType: 'SCHEDULED',
    startTime: '',
    endTime: '',
    message: '',
    notifyBeforeMinutes: 30,
    allowAdminAccess: true,
    whitelistedIps: [],
    impact: '',
    affectedServices: '',
  });
  const [ipInput, setIpInput] = useState('');

  // Activate form
  const [activateForm, setActivateForm] = useState<ActivateMaintenanceDTO>({
    message: '',
    durationMinutes: 60,
    whitelistedIps: [],
    allowAdminAccess: true,
  });
  const [activateIpInput, setActivateIpInput] = useState('');

  // ==================== QUERIES ====================
  const { data: dashboard, isLoading: dashLoading } = useQuery<MaintenanceDashboard>({
    queryKey: ['maintenance-dashboard'],
    queryFn: maintService.getMaintenanceDashboard,
    refetchInterval: 30000,
  });

  const { data: history, isLoading: histLoading } = useQuery({
    queryKey: ['maintenance-history', historyPage],
    queryFn: () =>
      maintService.getMaintenanceHistory({
        pageNumber: historyPage,
        pageSize: 10,
        sortBy: 'startTime',
        sortDir: 'DESC',
      }),
    enabled: activeTab === 'history',
  });

  const { data: detail } = useQuery<MaintenanceRecord>({
    queryKey: ['maintenance-detail', selectedId],
    queryFn: () => maintService.getMaintenanceDetail(selectedId!),
    enabled: showDetailModal && !!selectedId,
  });

  // ==================== MUTATIONS ====================
  const scheduleMutation = useMutation({
    mutationFn: (dto: MaintenanceWindowCreateDTO) => maintService.scheduleMaintenance(dto),
    onSuccess: () => {
      alert('Maintenance window scheduled successfully!');
      queryClient.invalidateQueries({ queryKey: ['maintenance-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-history'] });
      resetSchedForm();
      setActiveTab('dashboard');
    },
    onError: (err: any) => alert(err?.response?.data?.message || 'Failed to schedule maintenance'),
  });

  const activateMutation = useMutation({
    mutationFn: (dto: ActivateMaintenanceDTO) => maintService.activateMaintenanceNow(dto),
    onSuccess: () => {
      alert('Maintenance mode activated!');
      queryClient.invalidateQueries({ queryKey: ['maintenance-dashboard'] });
      resetActivateForm();
      setActiveTab('dashboard');
    },
    onError: (err: any) => alert(err?.response?.data?.message || 'Failed to activate maintenance'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => maintService.deactivateMaintenance(id),
    onSuccess: () => {
      alert('Maintenance mode deactivated!');
      queryClient.invalidateQueries({ queryKey: ['maintenance-dashboard'] });
    },
    onError: (err: any) => alert(err?.response?.data?.message || 'Failed to deactivate'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => maintService.cancelMaintenance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-history'] });
      alert('Maintenance cancelled');
    },
    onError: (err: any) => alert(err?.response?.data?.message || 'Failed to cancel'),
  });

  const resetSchedForm = () =>
    setSchedForm({
      title: '',
      description: '',
      maintenanceType: 'SCHEDULED',
      startTime: '',
      endTime: '',
      message: '',
      notifyBeforeMinutes: 30,
      allowAdminAccess: true,
      whitelistedIps: [],
      impact: '',
      affectedServices: '',
    });

  const resetActivateForm = () =>
    setActivateForm({
      message: '',
      durationMinutes: 60,
      whitelistedIps: [],
      allowAdminAccess: true,
    });

  const addIp = (list: string[], ip: string, setter: (ips: string[]) => void, inputSetter: (v: string) => void) => {
    const trimmed = ip.trim();
    if (trimmed && !list.includes(trimmed)) {
      setter([...list, trimmed]);
    }
    inputSetter('');
  };

  const removeIp = (list: string[], ip: string, setter: (ips: string[]) => void) => {
    setter(list.filter((i) => i !== ip));
  };

  // ==================== TAB: DASHBOARD ====================
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Current Status */}
      <ComponentCard title="Current Status">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold ${
                dashboard?.isMaintenanceActive
                  ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                  : 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
              }`}
            >
              {dashboard?.isMaintenanceActive ? '' : ''}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                System Maintenance
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <Badge color={dashboard?.isMaintenanceActive ? 'error' : 'success'}>
                  {dashboard?.isMaintenanceActive ? 'ACTIVE' : 'OFF'}
                </Badge>
                {dashboard?.activeMaintenance && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    — {dashboard.activeMaintenance.title}
                  </span>
                )}
              </div>
            </div>
          </div>
          {dashboard?.isMaintenanceActive && dashboard.activeMaintenance && (
            <button
              type="button"
              onClick={() => deactivateMutation.mutate(dashboard.activeMaintenance!.id)}
              disabled={deactivateMutation.isPending}
              className="rounded-lg border border-green-400 px-5 py-2 text-sm font-medium text-green-600 hover:bg-green-50 disabled:opacity-50 dark:text-green-400 dark:hover:bg-green-500/10"
            >
              {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </button>
          )}
        </div>

        {/* Active maintenance details */}
        {dashboard?.activeMaintenance && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-600 dark:bg-red-500/10">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {maintService.getMaintenanceTypeLabel(dashboard.activeMaintenance.maintenanceType)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Started</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {maintService.formatDateTime(dashboard.activeMaintenance.actualStartTime)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Expected End</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {maintService.formatDateTime(dashboard.activeMaintenance.endTime)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {maintService.formatMinutes(dashboard.activeMaintenance.remainingMinutes)}
                </p>
              </div>
            </div>
            {dashboard.activeMaintenance.message && (
              <p className="mt-3 text-sm text-red-700 dark:text-red-300">
                {dashboard.activeMaintenance.message}
              </p>
            )}
          </div>
        )}
      </ComponentCard>

      {/* Stats Cards */}
      {dashboard?.stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Scheduled', value: dashboard.stats.totalScheduled, color: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
            { label: 'Completed', value: dashboard.stats.totalCompleted, color: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' },
            { label: 'Cancelled', value: dashboard.stats.totalCancelled, color: 'bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400' },
            { label: 'Last Maintenance', value: dashboard.stats.lastMaintenanceAt ? new Date(dashboard.stats.lastMaintenanceAt).toLocaleDateString() : 'Never', color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400', isText: true },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
              <p className="text-xs opacity-75">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Schedule */}
      <ComponentCard title="Upcoming Maintenance">
        {!dashboard?.upcomingMaintenance?.length ? (
          <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No upcoming maintenance scheduled
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Title</TableCell>
                  <TableCell isHeader>Type</TableCell>
                  <TableCell isHeader>Start Time</TableCell>
                  <TableCell isHeader>End Time</TableCell>
                  <TableCell isHeader>Duration</TableCell>
                  <TableCell isHeader>Impact</TableCell>
                  <TableCell isHeader>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.upcomingMaintenance.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <span className="font-medium text-gray-800 dark:text-white">{item.title}</span>
                    </TableCell>
                    <TableCell>
                      <Badge color={item.maintenanceType === 'EMERGENCY' ? 'error' : 'primary'}>
                        {maintService.getMaintenanceTypeLabel(item.maintenanceType)}
                      </Badge>
                    </TableCell>
                    <TableCell>{maintService.formatDateTime(item.startTime)}</TableCell>
                    <TableCell>{maintService.formatDateTime(item.endTime)}</TableCell>
                    <TableCell>{maintService.formatMinutes(item.durationMinutes)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.impact || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Cancel this scheduled maintenance?')) {
                            cancelMutation.mutate(item.id);
                          }
                        }}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Cancel
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </ComponentCard>
    </div>
  );

  // ==================== TAB: SCHEDULE ====================
  const renderSchedule = () => (
    <ComponentCard title="Schedule Maintenance Window">
      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={schedForm.title}
            onChange={(e) => setSchedForm({ ...schedForm, title: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            placeholder="e.g. Weekly Database Maintenance"
          />
        </div>

        {/* Type */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Maintenance Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['SCHEDULED', 'EMERGENCY', 'ROUTINE'] as MaintenanceType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSchedForm({ ...schedForm, maintenanceType: type })}
                className={`rounded-lg border-2 py-3 text-center text-sm font-medium transition-all ${
                  schedForm.maintenanceType === type
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-400'
                }`}
              >
                {type === 'SCHEDULED' ? '' : type === 'EMERGENCY' ? '' : ''}{' '}
                {maintService.getMaintenanceTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>

        {/* Start / End */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={schedForm.startTime}
              onChange={(e) => setSchedForm({ ...schedForm, startTime: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              End Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={schedForm.endTime}
              onChange={(e) => setSchedForm({ ...schedForm, endTime: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            User-facing Message
          </label>
          <textarea
            value={schedForm.message || ''}
            onChange={(e) => setSchedForm({ ...schedForm, message: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            placeholder="Message displayed to users during maintenance..."
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Internal Description
          </label>
          <textarea
            value={schedForm.description || ''}
            onChange={(e) => setSchedForm({ ...schedForm, description: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            placeholder="Internal notes about this maintenance..."
          />
        </div>

        {/* Impact & Services */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Impact
            </label>
            <input
              type="text"
              value={schedForm.impact || ''}
              onChange={(e) => setSchedForm({ ...schedForm, impact: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="e.g. User login unavailable"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Affected Services
            </label>
            <input
              type="text"
              value={schedForm.affectedServices || ''}
              onChange={(e) => setSchedForm({ ...schedForm, affectedServices: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="e.g. Auth, Appointment, Payment"
            />
          </div>
        </div>

        {/* Notification & Access */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notify Before (minutes)
            </label>
            <input
              type="number"
              min={0}
              value={schedForm.notifyBeforeMinutes || 30}
              onChange={(e) =>
                setSchedForm({ ...schedForm, notifyBeforeMinutes: parseInt(e.target.value) || 0 })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={schedForm.allowAdminAccess ?? true}
                onChange={(e) =>
                  setSchedForm({ ...schedForm, allowAdminAccess: e.target.checked })
                }
                className="h-4 w-4 rounded text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Allow admin access during maintenance
              </span>
            </label>
          </div>
        </div>

        {/* Whitelisted IPs */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Whitelisted IPs
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addIp(schedForm.whitelistedIps || [], ipInput, (ips) => setSchedForm({ ...schedForm, whitelistedIps: ips }), setIpInput);
                }
              }}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Enter IP and press Enter"
            />
            <button
              type="button"
              onClick={() => addIp(schedForm.whitelistedIps || [], ipInput, (ips) => setSchedForm({ ...schedForm, whitelistedIps: ips }), setIpInput)}
              className="rounded-lg bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Add
            </button>
          </div>
          {schedForm.whitelistedIps && schedForm.whitelistedIps.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {schedForm.whitelistedIps.map((ip) => (
                <span
                  key={ip}
                  className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs dark:bg-gray-700"
                >
                  {ip}
                  <button
                    type="button"
                    onClick={() => removeIp(schedForm.whitelistedIps || [], ip, (ips) => setSchedForm({ ...schedForm, whitelistedIps: ips }))}
                    className="ml-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={resetSchedForm}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => {
              if (!schedForm.title.trim()) return alert('Title is required');
              if (!schedForm.startTime) return alert('Start time is required');
              if (!schedForm.endTime) return alert('End time is required');
              scheduleMutation.mutate(schedForm);
            }}
            disabled={scheduleMutation.isPending}
            className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {scheduleMutation.isPending ? 'Scheduling...' : 'Schedule Maintenance'}
          </button>
        </div>
      </div>
    </ComponentCard>
  );

  // ==================== TAB: ACTIVATE NOW ====================
  const renderActivateNow = () => (
    <ComponentCard title="Activate Maintenance Now">
      <div className="space-y-5">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-600 dark:bg-yellow-500/10">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            This will immediately put the system into maintenance mode. All non-admin users will be locked out.
          </p>
        </div>

        {/* Message */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Maintenance Message <span className="text-red-500">*</span>
          </label>
          <textarea
            value={activateForm.message}
            onChange={(e) => setActivateForm({ ...activateForm, message: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            placeholder="Reason for maintenance..."
          />
        </div>

        {/* Duration */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Duration (minutes) <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[15, 30, 60, 120].map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => setActivateForm({ ...activateForm, durationMinutes: min })}
                className={`rounded-lg border-2 py-2 text-center text-sm font-medium transition-all ${
                  activateForm.durationMinutes === min
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-400'
                }`}
              >
                {maintService.formatMinutes(min)}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={1}
            value={activateForm.durationMinutes}
            onChange={(e) =>
              setActivateForm({ ...activateForm, durationMinutes: parseInt(e.target.value) || 60 })
            }
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Admin Access Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-600">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-white">
              Allow Admin Access
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Admins can still access the system during maintenance
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setActivateForm({ ...activateForm, allowAdminAccess: !activateForm.allowAdminAccess })
            }
            className={`relative h-6 w-11 rounded-full transition-colors ${
              activateForm.allowAdminAccess ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                activateForm.allowAdminAccess ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Whitelisted IPs */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Whitelisted IPs
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={activateIpInput}
              onChange={(e) => setActivateIpInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addIp(
                    activateForm.whitelistedIps || [],
                    activateIpInput,
                    (ips) => setActivateForm({ ...activateForm, whitelistedIps: ips }),
                    setActivateIpInput
                  );
                }
              }}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Enter IP and press Enter"
            />
            <button
              type="button"
              onClick={() =>
                addIp(
                  activateForm.whitelistedIps || [],
                  activateIpInput,
                  (ips) => setActivateForm({ ...activateForm, whitelistedIps: ips }),
                  setActivateIpInput
                )
              }
              className="rounded-lg bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Add
            </button>
          </div>
          {activateForm.whitelistedIps && activateForm.whitelistedIps.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {activateForm.whitelistedIps.map((ip) => (
                <span
                  key={ip}
                  className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs dark:bg-gray-700"
                >
                  {ip}
                  <button
                    type="button"
                    onClick={() =>
                      removeIp(
                        activateForm.whitelistedIps || [],
                        ip,
                        (ips) => setActivateForm({ ...activateForm, whitelistedIps: ips })
                      )
                    }
                    className="ml-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={resetActivateForm}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => {
              if (!activateForm.message.trim()) return alert('Message is required');
              if (confirm('Are you sure you want to activate maintenance mode NOW?')) {
                activateMutation.mutate(activateForm);
              }
            }}
            disabled={activateMutation.isPending || dashboard?.isMaintenanceActive}
            className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {activateMutation.isPending ? 'Activating...' : 'Activate Now'}
          </button>
        </div>

        {dashboard?.isMaintenanceActive && (
          <p className="text-center text-sm text-yellow-600 dark:text-yellow-400">
            System is already in maintenance mode. Deactivate first to activate a new one.
          </p>
        )}
      </div>
    </ComponentCard>
  );

  // ==================== TAB: HISTORY ====================
  const renderHistory = () => (
    <ComponentCard title="Maintenance History">
      <div className="space-y-4">
        {histLoading ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        ) : !history?.content?.length ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No maintenance history found
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Title</TableCell>
                    <TableCell isHeader>Type</TableCell>
                    <TableCell isHeader>Start</TableCell>
                    <TableCell isHeader>End</TableCell>
                    <TableCell isHeader>Duration</TableCell>
                    <TableCell isHeader>Reason</TableCell>
                    <TableCell isHeader>Status</TableCell>
                    <TableCell isHeader>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.content.map((record) => {
                    const start = record.actualStartTime || record.startTime;
                    const end = record.actualEndTime || record.endTime;
                    const dur = start && end
                      ? Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
                      : record.durationMinutes;
                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => { setSelectedId(record.id); setShowDetailModal(true); }}
                            className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                          >
                            {record.title}
                          </button>
                        </TableCell>
                        <TableCell>
                          <Badge
                            color={
                              record.maintenanceType === 'EMERGENCY'
                                ? 'error'
                                : record.maintenanceType === 'ROUTINE'
                                ? 'info'
                                : 'primary'
                            }
                          >
                            {maintService.getMaintenanceTypeLabel(record.maintenanceType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {maintService.formatDateTime(start)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {maintService.formatDateTime(end)}
                        </TableCell>
                        <TableCell>{dur ? maintService.formatMinutes(dur) : '-'}</TableCell>
                        <TableCell>
                          <span className="line-clamp-1 max-w-[160px] text-sm text-gray-600 dark:text-gray-400">
                            {record.impact || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge color={maintService.getMaintenanceStatusColor(record.status)}>
                            {maintService.getMaintenanceStatusLabel(record.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => { setSelectedId(record.id); setShowDetailModal(true); }}
                            className="text-xs text-brand-600 hover:underline dark:text-brand-400"
                          >
                            Detail
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {history.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Total: {history.totalElements} records
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                    disabled={historyPage === 0}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-gray-600"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, history.totalPages) }, (_, i) => {
                    const start = Math.max(0, Math.min(historyPage - 2, history.totalPages - 5));
                    const page = start + i;
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setHistoryPage(page)}
                        className={`rounded-lg border px-3 py-1.5 text-xs ${
                          page === historyPage
                            ? 'border-brand-500 bg-brand-500 text-white'
                            : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600'
                        }`}
                      >
                        {page + 1}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setHistoryPage((p) => Math.min(history.totalPages - 1, p + 1))}
                    disabled={historyPage >= history.totalPages - 1}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-gray-600"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ComponentCard>
  );

  // ==================== DETAIL MODAL ====================
  const renderDetailModal = () => {
    if (!showDetailModal || !detail) return null;
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Maintenance Detail
            </h3>
            <button
              type="button"
              onClick={() => setShowDetailModal(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          <div className="space-y-3">
            <InfoRow label="Title" value={detail.title} />
            <InfoRow label="Type" value={maintService.getMaintenanceTypeLabel(detail.maintenanceType)} />
            <InfoRow label="Status">
              <Badge color={maintService.getMaintenanceStatusColor(detail.status)}>
                {maintService.getMaintenanceStatusLabel(detail.status)}
              </Badge>
            </InfoRow>
            <InfoRow label="Scheduled Start" value={maintService.formatDateTime(detail.startTime)} />
            <InfoRow label="Scheduled End" value={maintService.formatDateTime(detail.endTime)} />
            {detail.actualStartTime && (
              <InfoRow label="Actual Start" value={maintService.formatDateTime(detail.actualStartTime)} />
            )}
            {detail.actualEndTime && (
              <InfoRow label="Actual End" value={maintService.formatDateTime(detail.actualEndTime)} />
            )}
            {detail.message && <InfoRow label="Message" value={detail.message} />}
            {detail.description && <InfoRow label="Description" value={detail.description} />}
            {detail.impact && <InfoRow label="Impact" value={detail.impact} />}
            {detail.affectedServices && <InfoRow label="Affected Services" value={detail.affectedServices} />}
            <InfoRow label="Admin Access" value={detail.allowAdminAccess ? 'Yes' : 'No'} />
            {detail.notifyBeforeMinutes !== undefined && (
              <InfoRow label="Notify Before" value={`${detail.notifyBeforeMinutes} minutes`} />
            )}
            {detail.whitelistedIps && detail.whitelistedIps.length > 0 && (
              <InfoRow label="Whitelisted IPs" value={detail.whitelistedIps.join(', ')} />
            )}
            {detail.createdByName && <InfoRow label="Created By" value={detail.createdByName} />}
            {detail.createdAt && <InfoRow label="Created At" value={maintService.formatDateTime(detail.createdAt)} />}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setShowDetailModal(false)}
              className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: '' },
    { key: 'schedule', label: 'Schedule', icon: '' },
    { key: 'activate', label: 'Activate Now', icon: '' },
    { key: 'history', label: 'History', icon: '' },
  ];

  return (
    <>
      <PageMeta title="Scheduled Maintenance | MediTech Admin" />
      <PageBreadcrumb pageTitle="Scheduled Maintenance" />

      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {dashLoading && activeTab === 'dashboard' ? (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">Loading dashboard...</div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'schedule' && renderSchedule()}
            {activeTab === 'activate' && renderActivateNow()}
            {activeTab === 'history' && renderHistory()}
          </>
        )}
      </div>

      {renderDetailModal()}
    </>
  );
};

// Reusable info row
const InfoRow: React.FC<{
  label: string;
  value?: string;
  children?: React.ReactNode;
}> = ({ label, value, children }) => (
  <div className="grid grid-cols-3 gap-2 text-sm">
    <span className="text-gray-500 dark:text-gray-400">{label}:</span>
    <span className="col-span-2 font-medium text-gray-800 dark:text-white">
      {children || value || '-'}
    </span>
  </div>
);

export default ScheduledMaintenance;
