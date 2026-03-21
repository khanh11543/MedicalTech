import { useState, useEffect, useCallback } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import Badge from '../../components/ui/badge/Badge';
import { useToast } from '../../hooks/useToast';
import doctorScheduleService, {
  TimeOffRequestDTO,
  TimeOffType,
  TimeOffStatus,
  AffectedAppointmentDTO,
} from '../../services/doctorScheduleService';

// ============= Icons =============
const IconPlus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const IconX = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IconTrash = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IconEdit = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const IconAlertTriangle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
const IconChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);
const IconInfo = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconRefresh = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// ============= Constants =============
const TIME_OFF_TYPES: { value: TimeOffType; label: string; description: string }[] = [
  { value: 'FULL_DAY', label: 'Full-day Time Off', description: 'Off the entire day (leave, conference, sick day)' },
  { value: 'PARTIAL_DAY', label: 'Partial-day Time Off', description: 'Off for part of the day (morning/afternoon)' },
  { value: 'BREAK', label: 'Break', description: 'Short break during the day (lunch, meeting)' },
  { value: 'BLOCKED_TIME', label: 'Blocked Time', description: 'Block specific hours from booking' },
];

const REASON_SUGGESTIONS: Record<TimeOffType, string[]> = {
  FULL_DAY: ['Annual leave', 'Sick leave', 'Conference / seminar', 'Business trip', 'Personal day'],
  PARTIAL_DAY: ['Morning off', 'Afternoon off', 'Half-day medical appointment', 'Partial sick leave'],
  BREAK: ['Lunch break', 'Meeting', 'Mid-shift rest', 'Prayer break'],
  BLOCKED_TIME: ['Administrative work', 'Special procedure', 'Training', 'Personal errand'],
};

// ============= Type helpers =============
function typeLabel(type: TimeOffType): string {
  return TIME_OFF_TYPES.find(t => t.value === type)?.label ?? type;
}

function statusColor(status: TimeOffStatus): 'success' | 'warning' | 'error' | 'dark' {
  switch (status) {
    case 'APPROVED': return 'success';
    case 'PENDING_REVIEW': return 'warning';
    case 'REJECTED': return 'error';
    case 'CANCELLED': return 'dark';
    default: return 'dark';
  }
}

function statusLabel(status: TimeOffStatus): string {
  switch (status) {
    case 'APPROVED': return 'Approved';
    case 'PENDING_REVIEW': return 'Pending Review';
    case 'REJECTED': return 'Rejected';
    case 'CANCELLED': return 'Cancelled';
    default: return status;
  }
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
}

function formatTime(t?: string | null): string {
  return t ?? '';
}

function formatDateTime(dt?: string | null): string {
  if (!dt) return '—';
  try {
    return new Date(dt).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dt;
  }
}

function isEditable(req: TimeOffRequestDTO): boolean {
  if (req.status === 'PENDING_REVIEW') return true;
  if (req.status === 'APPROVED') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(req.date) > today;
  }
  return false;
}

function isCancellable(req: TimeOffRequestDTO): boolean {
  if (req.status === 'REJECTED' || req.status === 'CANCELLED') return false;
  if (req.status === 'APPROVED') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(req.date) > today;
  }
  return true;
}

// ============= FormState =============
interface FormState {
  type: TimeOffType;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  notes: string;
}

const defaultForm = (): FormState => ({
  type: 'FULL_DAY', date: '', startTime: '', endTime: '', reason: '', notes: '',
});

// ============= RequestForm Modal =============
interface RequestFormProps {
  initial?: FormState;
  onSubmit: (data: FormState) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  title: string;
}

function RequestForm({ initial, onSubmit, onCancel, submitting, title }: RequestFormProps) {
  const [form, setForm] = useState<FormState>(initial ?? defaultForm());
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const needsTime = form.type !== 'FULL_DAY';

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.date) e.date = 'Date is required';
    if (!form.reason.trim()) e.reason = 'Reason is required';
    if (needsTime) {
      if (!form.startTime) e.startTime = 'Start time is required';
      if (!form.endTime) e.endTime = 'End time is required';
      if (form.startTime && form.endTime && form.startTime >= form.endTime)
        e.endTime = 'End time must be after start time';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  }

  const suggestions = REASON_SUGGESTIONS[form.type] ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TIME_OFF_TYPES.map(t => (
                <label
                  key={t.value}
                  className={`flex cursor-pointer flex-col rounded-xl border p-3 transition-colors ${
                    form.type === t.value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <input type="radio" className="sr-only" checked={form.type === t.value} onChange={() => set('type', t.value)} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{t.label}</span>
                  <span className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{t.description}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                errors.date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
          </div>

          {/* Times */}
          {needsTime && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={e => set('startTime', e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    errors.startTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.startTime && <p className="mt-1 text-xs text-red-500">{errors.startTime}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={e => set('endTime', e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    errors.endTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.endTime && <p className="mt-1 text-xs text-red-500">{errors.endTime}</p>}
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Reason <span className="text-red-500">*</span>
            </label>
            {suggestions.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {suggestions.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('reason', s)}
                    className={`rounded-full px-3 py-0.5 text-xs transition-colors ${
                      form.reason === s
                        ? 'bg-brand-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <input
              type="text"
              value={form.reason}
              onChange={e => set('reason', e.target.value)}
              placeholder="Enter reason..."
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                errors.reason ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.reason && <p className="mt-1 text-xs text-red-500">{errors.reason}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes <span className="text-xs text-gray-400">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder="Any additional notes..."
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-3.5 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Conflict notice */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-3 flex gap-2">
            <IconInfo className="h-4 w-4 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              The system will check for conflicting patient appointments.
              Requests without conflicts are <strong>auto-approved</strong>.
              Those with conflicts are set to <strong>Pending Review</strong>.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-gray-300 dark:border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============= AffectedAppointmentsModal =============
function AffectedModal({
  req, items, onClose,
}: { req: TimeOffRequestDTO; items: AffectedAppointmentDTO[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto max-h-[80vh]">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Affected Appointments</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {typeLabel(req.type)} &middot; {formatDate(req.date)}
              {req.type !== 'FULL_DAY' && req.startTime ? ` · ${req.startTime}–${req.endTime}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <IconX className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No conflicting appointments found.</p>
          ) : (
            <>
              {req.hasHeavyConflict && (
                <div className="mb-3 rounded-xl border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30 p-3 flex gap-2">
                  <IconAlertTriangle className="h-4 w-4 mt-0.5 text-red-600 dark:text-red-400 shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-300">
                    One or more appointments are in a <strong>critical state</strong> (checked-in or in-progress).
                    This request requires manual admin review.
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {items.length} appointment{items.length !== 1 ? 's' : ''} will be affected:
              </p>
              <ul className="space-y-2">
                {items.map(a => (
                  <li key={a.appointmentId}
                    className={`rounded-xl border p-3 ${
                      a.heavyConflict
                        ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30'
                        : 'border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {a.patientName || `Appointment #${a.appointmentId}`}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(a.appointmentDate)} &middot; {formatTime(a.startTime)}–{formatTime(a.endTime)}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.heavyConflict
                          ? 'bg-red-200 text-red-800 dark:bg-red-800/50 dark:text-red-300'
                          : 'bg-amber-200 text-amber-800 dark:bg-amber-800/50 dark:text-amber-300'
                      }`}>{a.status}</span>
                    </div>
                    {a.heavyConflict && (
                      <p className="mt-1.5 text-xs font-semibold text-red-700 dark:text-red-400">
                        ⚠ This appointment is currently active — requires urgent admin review.
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="mt-5 flex justify-end">
            <button onClick={onClose}
              className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= Confirm Cancel Modal =============
function ConfirmCancelModal({
  req, onConfirm, onClose, cancelling,
}: { req: TimeOffRequestDTO; onConfirm: () => Promise<void>; onClose: () => void; cancelling: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-2xl p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Cancel Request?</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to cancel the <strong>{typeLabel(req.type)}</strong> request for{' '}
          <strong>{formatDate(req.date)}</strong>?
          {req.type !== 'FULL_DAY' && req.startTime && ` (${req.startTime}–${req.endTime})`}
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose}
            className="rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            No, keep it
          </button>
          <button onClick={onConfirm} disabled={cancelling}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 transition-colors">
            {cancelling ? 'Cancelling...' : 'Yes, cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============= RequestCard =============
function RequestCard({
  req, onEdit, onCancel, onShowAffected,
}: {
  req: TimeOffRequestDTO;
  onEdit: (r: TimeOffRequestDTO) => void;
  onCancel: (r: TimeOffRequestDTO) => void;
  onShowAffected: (r: TimeOffRequestDTO) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const cardBg =
    req.hasHeavyConflict && req.status === 'PENDING_REVIEW'
      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20'
      : req.status === 'PENDING_REVIEW'
      ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20'
      : req.status === 'APPROVED'
      ? 'border-green-200 dark:border-green-800 bg-white dark:bg-gray-900'
      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 opacity-75';

  return (
    <div className={`rounded-2xl border transition-shadow hover:shadow-md ${cardBg} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{typeLabel(req.type)}</span>
            <Badge color={statusColor(req.status as TimeOffStatus)}>
              {statusLabel(req.status as TimeOffStatus)}
            </Badge>
            {req.hasHeavyConflict && req.status === 'PENDING_REVIEW' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
                <IconAlertTriangle className="h-3 w-3" /> Critical conflict
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {formatDate(req.date)}
            {req.type !== 'FULL_DAY' && req.startTime && (
              <span className="ml-1 text-gray-500 dark:text-gray-400">
                &middot; {formatTime(req.startTime)}–{formatTime(req.endTime)}
              </span>
            )}
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Reason:</span> {req.reason}
          </p>
          {req.notes && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500 italic">{req.notes}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {/* Affected count */}
          {(req.affectedAppointmentsCount ?? 0) > 0 ? (
            <>
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                req.hasHeavyConflict ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                <IconAlertTriangle className="h-3.5 w-3.5" />
                {req.affectedAppointmentsCount} appt{(req.affectedAppointmentsCount ?? 0) !== 1 ? 's' : ''}
                {req.hasHeavyConflict ? ' (critical)' : ''}
              </span>
              <button onClick={() => onShowAffected(req)}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                View
              </button>
            </>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">No conflict</span>
          )}

          <div className="flex items-center gap-1 mt-1">
            {isEditable(req) && (
              <button onClick={() => onEdit(req)} title="Edit"
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <IconEdit className="h-4 w-4" />
              </button>
            )}
            {isCancellable(req) && (
              <button onClick={() => onCancel(req)} title="Cancel"
                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <IconTrash className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <button onClick={() => setExpanded(x => !x)}
        className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <IconChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        {expanded ? 'Hide details' : 'Show details'}
      </button>

      {expanded && (
        <div className="mt-2 border-t border-gray-100 dark:border-gray-800 pt-2 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
          <p>Created: {formatDateTime(req.createdAt)}</p>
          {req.updatedAt && req.updatedAt !== req.createdAt && <p>Updated: {formatDateTime(req.updatedAt)}</p>}
          <p>ID: #{req.id}</p>
        </div>
      )}
    </div>
  );
}

// ============= Main Page =============
export default function DoctorScheduleTimeOff() {
  const { showToast } = useToast();

  const [requests, setRequests] = useState<TimeOffRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReq, setEditingReq] = useState<TimeOffRequestDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [filterStatus, setFilterStatus] = useState<TimeOffStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<TimeOffType | 'ALL'>('ALL');

  const [affectedModal, setAffectedModal] = useState<{ req: TimeOffRequestDTO; items: AffectedAppointmentDTO[] } | null>(null);
  const [loadingAffected, setLoadingAffected] = useState(false);

  const [cancelModal, setCancelModal] = useState<TimeOffRequestDTO | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await doctorScheduleService.listTimeOffRequests();
      setRequests(data);
    } catch {
      showToast('Failed to load time-off requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const filtered = requests.filter(r => {
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    if (filterType !== 'ALL' && r.type !== filterType) return false;
    return true;
  });

  async function handleCreate(form: FormState) {
    try {
      setSubmitting(true);
      const created = await doctorScheduleService.createTimeOffRequest({
        type: form.type,
        date: form.date,
        startTime: form.type !== 'FULL_DAY' ? form.startTime : undefined,
        endTime: form.type !== 'FULL_DAY' ? form.endTime : undefined,
        reason: form.reason,
        notes: form.notes || undefined,
      });
      setRequests(prev => [created, ...prev]);
      setShowForm(false);
      if (created.status === 'APPROVED') {
        showToast('Request approved — no conflicts found.', 'success');
      } else {
        showToast(`Request submitted. ${created.affectedAppointmentsCount} appointment(s) affected — pending review.`, 'warning');
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to submit request', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(form: FormState) {
    if (!editingReq?.id) return;
    try {
      setSubmitting(true);
      const updated = await doctorScheduleService.updateTimeOffRequest(editingReq.id, {
        type: form.type,
        date: form.date,
        startTime: form.type !== 'FULL_DAY' ? form.startTime : undefined,
        endTime: form.type !== 'FULL_DAY' ? form.endTime : undefined,
        reason: form.reason,
        notes: form.notes || undefined,
      });
      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
      setEditingReq(null);
      showToast('Request updated successfully', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update request', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmCancel() {
    if (!cancelModal?.id) return;
    try {
      setCancelling(true);
      const updated = await doctorScheduleService.cancelTimeOffRequest(cancelModal.id);
      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
      setCancelModal(null);
      showToast('Request cancelled', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to cancel request', 'error');
    } finally {
      setCancelling(false);
    }
  }

  async function handleShowAffected(req: TimeOffRequestDTO) {
    if (!req.id) return;
    try {
      setLoadingAffected(true);
      const items = await doctorScheduleService.getAffectedAppointments(req.id);
      setAffectedModal({ req, items });
    } catch {
      showToast('Failed to load affected appointments', 'error');
    } finally {
      setLoadingAffected(false);
    }
  }

  function editInitForm(req: TimeOffRequestDTO): FormState {
    return { type: req.type, date: req.date, startTime: req.startTime ?? '', endTime: req.endTime ?? '', reason: req.reason, notes: req.notes ?? '' };
  }

  const pendingCount = requests.filter(r => r.status === 'PENDING_REVIEW').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length;

  return (
    <>
      <PageMeta title="Time Off & Breaks | MediTech" description="Manage your personal time-off requests and breaks" />
      <PageBreadcrumb pageTitle="Time Off & Breaks" />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Time Off & Breaks</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Declare your unavailability windows — breaks, leaves, and blocked times.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading} title="Refresh"
              className="rounded-xl border border-gray-300 dark:border-gray-600 p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors">
              <IconPlus className="h-4 w-4" /> Add Request
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', count: requests.length, cls: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
            { label: 'Pending', count: pendingCount, cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
            { label: 'Approved', count: approvedCount, cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
          ].map(c => (
            <div key={c.label} className={`rounded-xl p-3 text-center ${c.cls}`}>
              <p className="text-2xl font-bold">{c.count}</p>
              <p className="text-xs mt-0.5 opacity-80">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Info bar */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-3 flex gap-2">
          <IconInfo className="h-4 w-4 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
            <p><strong>Auto-approved</strong> if no patient appointments conflict with the requested time.</p>
            <p><strong>Pending Review</strong> if conflicts exist — admin/receptionist will handle rescheduling.</p>
            <p><strong>Critical conflicts</strong> (checked-in / in-progress patients) always require manual review.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="mr-1.5 text-xs text-gray-500 dark:text-gray-400">Status:</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as TimeOffStatus | 'ALL')}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="ALL">All statuses</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="mr-1.5 text-xs text-gray-500 dark:text-gray-400">Type:</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value as TimeOffType | 'ALL')}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="ALL">All types</option>
              {TIME_OFF_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center">
            <p className="text-base font-medium text-gray-500 dark:text-gray-400">
              {requests.length === 0 ? 'No requests yet' : 'No requests match the current filter'}
            </p>
            {requests.length === 0 && (
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                Click <strong>Add Request</strong> to declare your first time-off window.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => (
              <RequestCard key={req.id} req={req}
                onEdit={r => setEditingReq(r)}
                onCancel={r => setCancelModal(r)}
                onShowAffected={handleShowAffected}
              />
            ))}
          </div>
        )}

        {loadingAffected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 text-sm text-gray-700 dark:text-gray-300">
              Loading affected appointments…
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <RequestForm title="New Time-Off Request" onSubmit={handleCreate} onCancel={() => setShowForm(false)} submitting={submitting} />
      )}
      {editingReq && (
        <RequestForm title="Edit Request" initial={editInitForm(editingReq)} onSubmit={handleUpdate} onCancel={() => setEditingReq(null)} submitting={submitting} />
      )}
      {affectedModal && (
        <AffectedModal req={affectedModal.req} items={affectedModal.items} onClose={() => setAffectedModal(null)} />
      )}
      {cancelModal && (
        <ConfirmCancelModal req={cancelModal} onConfirm={handleConfirmCancel} onClose={() => setCancelModal(null)} cancelling={cancelling} />
      )}
    </>
  );
}
