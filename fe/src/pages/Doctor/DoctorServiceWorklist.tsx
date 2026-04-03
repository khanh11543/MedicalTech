import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import departmentWorklistService, {
  WorklistItemDTO,
  DEPARTMENT_LABELS,
} from '../../services/departmentWorklistService';
import {
  SERVICE_CATEGORY_LABELS,
  SERVICE_STATUS_STYLES,
} from '../../services/serviceOrderService';

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All (Paid / In Progress / Completed)' },
  { value: 'PAID', label: 'Paid — Ready to Start' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

const PRIORITY_STYLES: Record<string, string> = {
  STAT: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
  URGENT: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30',
  ROUTINE: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-700',
};

export default function DoctorServiceWorklist() {
  const navigate = useNavigate();
  const [items, setItems] = useState<WorklistItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [startingId, setStartingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const fetchDepartment = useCallback(async () => {
    try {
      const info = await departmentWorklistService.getMyDepartment();
      setDepartment(info.department);
      setDoctorName(info.doctorName);
    } catch {
      setError('Failed to load department info');
    }
  }, []);

  const fetchWorklist = useCallback(async () => {
    setLoading(true);
    try {
      const data = await departmentWorklistService.getWorklist(statusFilter || undefined);
      setItems(data);
    } catch {
      setError('Failed to load worklist');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDepartment();
  }, [fetchDepartment]);

  useEffect(() => {
    fetchWorklist();
  }, [fetchWorklist]);

  const handleStartService = async (id: number) => {
    setStartingId(id);
    try {
      await departmentWorklistService.startService(id);
      await fetchWorklist();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start service';
      setError(message);
    } finally {
      setStartingId(null);
    }
  };

  const handleOpenResultForm = (id: number) => {
    navigate(`/doctor/service-worklist/${id}/result`);
  };

  const handleViewResult = (id: number) => {
    navigate(`/doctor/service-worklist/${id}/result`);
  };

  // Filter items by search
  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.patientName?.toLowerCase().includes(q) ||
      item.appointmentCode?.toLowerCase().includes(q) ||
      item.serviceName.toLowerCase().includes(q) ||
      String(item.id).includes(q)
    );
  });

  const departmentLabel = DEPARTMENT_LABELS[department] || department || 'No Department';

  return (
    <>
      <PageMeta
        title="Service Worklist | Doctor Panel"
        description="Department Service Worklist"
      />
      <PageBreadcrumb pageTitle="Service Worklist" />

      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {departmentLabel} Worklist
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Dr. {doctorName}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {filteredItems.length} service{filteredItems.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search patient, appointment code, service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pl-9 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <svg
                className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
            <button
              onClick={() => setError('')}
              className="ml-2 font-medium underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-lg bg-white shadow-md dark:bg-gray-800">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <svg
                className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="font-medium">No service orders found</p>
              <p className="text-sm">
                {department
                  ? 'No services assigned to your department yet'
                  : 'You have not been assigned to a department'}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    SO #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Appt Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Service
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Ordered By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Assigned To
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.map((item) => {
                  const style = SERVICE_STATUS_STYLES[item.status] || {
                    bg: 'bg-gray-100',
                    text: 'text-gray-700',
                  };
                  const priorityStyle = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.ROUTINE;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        SO-{String(item.id).padStart(3, '0')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {item.patientName || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                        {item.appointmentCode || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {item.serviceName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {item.orderedByDoctorName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {SERVICE_CATEGORY_LABELS[item.category] || item.category}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyle}`}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {item.assignedDoctorName || (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
                        >
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <WorklistActions
                          item={item}
                          startingId={startingId}
                          onStart={handleStartService}
                          onOpenResult={handleOpenResultForm}
                          onViewResult={handleViewResult}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

// ── Action Buttons ──

function WorklistActions({
  item,
  startingId,
  onStart,
  onOpenResult,
  onViewResult,
}: {
  item: WorklistItemDTO;
  startingId: number | null;
  onStart: (id: number) => void;
  onOpenResult: (id: number) => void;
  onViewResult: (id: number) => void;
}) {
  if (item.status === 'PAID') {
    return (
      <button
        onClick={() => onStart(item.id)}
        disabled={startingId === item.id}
        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {startingId === item.id ? (
          <>
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Starting...
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Service
          </>
        )}
      </button>
    );
  }

  if (item.status === 'IN_PROGRESS') {
    return (
      <div className="flex gap-1">
        <button
          onClick={() => onOpenResult(item.id)}
          className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {item.hasResult ? 'Continue' : 'Open Result Form'}
        </button>
      </div>
    );
  }

  if (item.status === 'COMPLETED') {
    return (
      <button
        onClick={() => onViewResult(item.id)}
        className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        View Result
      </button>
    );
  }

  return <span className="text-xs text-gray-400">—</span>;
}
