import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/button/Button';
import Toast from '../common/Toast';
import { useToast } from '../../hooks/useToast';
import { SAMPLE_CONSULTATION_DATA } from '../../data/sampleConsultationData';
import consultationService, {
  type ConsultationDTO,
} from '../../services/consultationService';
import appointmentService, {
  type AppointmentDTO,
} from '../../services/appointmentService';
import serviceOrderService, {
  type ServiceOrderDTO,
  type ServiceOrderCreateDTO,
  type MedicalServiceDTO,
  ServiceCategory,
  ServicePriority,
  SERVICE_CATEGORY_LABELS,
  SERVICE_STATUS_STYLES,
} from '../../services/serviceOrderService';
import { DEPARTMENT_LABELS } from '../../services/departmentWorklistService';
import ViewServiceResultModal from './ViewServiceResultModal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PatientInfo {
  appointmentCode?: string;
  patientName?: string;
  queueNumber?: number;
  age?: number | null;
  gender?: string | null;
  reasonForVisit?: string | null;
  allergies?: string | null;
  medicalHistory?: string | null;
}

interface ConsultationFormProps {
  appointmentId?: number;
  onBack: () => void;
  patientInfo?: PatientInfo;
  onAutoFill?: (data: any) => void;
}

interface FormFields {
  chiefComplaint: string;
  hpi: string;
  temperature: number | null;
  systolic: number | null;
  diastolic: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  height: number | null;
  weight: number | null;
  bmi: number | null;
  // Structured physical exam sub-sections
  peGeneral: string;
  peCardiovascular: string;
  peRespiratory: string;
  peAbdomen: string;
  peNeurological: string;
  physicalExam: string; // combined, for backward compat with backend
  diagnosis: string;
  secondaryDiagnosis: string;
  diagnosticCode: string;
  plan: string;
  medicationsPlanned: string;
  investigationPlanned: string;
  referrals: string;
  followUpInstructions: string;
}

// ---------------------------------------------------------------------------
// Constants & pure helpers
// ---------------------------------------------------------------------------

const AUTOSAVE_DELAY_MS = 30_000;

const EMPTY_FORM: FormFields = {
  chiefComplaint: '',
  hpi: '',
  temperature: null,
  systolic: null,
  diastolic: null,
  heartRate: null,
  respiratoryRate: null,
  height: null,
  weight: null,
  bmi: null,
  peGeneral: '',
  peCardiovascular: '',
  peRespiratory: '',
  peAbdomen: '',
  peNeurological: '',
  physicalExam: '',
  diagnosis: '',
  secondaryDiagnosis: '',
  diagnosticCode: '',
  plan: '',
  medicationsPlanned: '',
  investigationPlanned: '',
  referrals: '',
  followUpInstructions: '',
};

/** Parse structured physical exam from stored string */
function parsePhysicalExam(pe: string): {
  general: string;
  cardiovascular: string;
  respiratory: string;
  abdomen: string;
  neurological: string;
} {
  const defaults = { general: '', cardiovascular: '', respiratory: '', abdomen: '', neurological: '' };
  if (!pe) return defaults;
  try {
    const parsed = JSON.parse(pe);
    return { ...defaults, ...parsed };
  } catch {
    // Legacy: single textarea content -> put in general
    return { ...defaults, general: pe };
  }
}

/** Combine structured physical exam into a JSON string for backend */
function combinePhysicalExam(f: FormFields): string {
  const obj = {
    general: f.peGeneral,
    cardiovascular: f.peCardiovascular,
    respiratory: f.peRespiratory,
    abdomen: f.peAbdomen,
    neurological: f.peNeurological,
  };
  // Only store if at least one field is non-empty
  if (Object.values(obj).every((v) => !v.trim())) return '';
  return JSON.stringify(obj);
}

/** Combine treatment plan fields */
function combinePlan(f: FormFields): string {
  const parts: string[] = [];
  if (f.plan.trim()) parts.push(f.plan.trim());
  if (f.medicationsPlanned.trim()) parts.push(`[Medications] ${f.medicationsPlanned.trim()}`);
  if (f.investigationPlanned.trim()) parts.push(`[Investigations] ${f.investigationPlanned.trim()}`);
  if (f.referrals.trim()) parts.push(`[Referrals] ${f.referrals.trim()}`);
  return parts.join('\n');
}

/** Parse treatment plan fields from stored string */
function parsePlan(plan: string): { plan: string; medicationsPlanned: string; investigationPlanned: string; referrals: string } {
  const result = { plan: '', medicationsPlanned: '', investigationPlanned: '', referrals: '' };
  if (!plan) return result;
  const lines = plan.split('\n');
  const nonTagged: string[] = [];
  for (const line of lines) {
    if (line.startsWith('[Medications] ')) result.medicationsPlanned = line.replace('[Medications] ', '');
    else if (line.startsWith('[Investigations] ')) result.investigationPlanned = line.replace('[Investigations] ', '');
    else if (line.startsWith('[Referrals] ')) result.referrals = line.replace('[Referrals] ', '');
    else nonTagged.push(line);
  }
  result.plan = nonTagged.join('\n');
  return result;
}

/** Parse diagnosis fields */
function parseDiagnosis(diag: string): { primary: string; secondary: string } {
  if (!diag) return { primary: '', secondary: '' };
  const parts = diag.split('\n[Secondary] ');
  return { primary: parts[0] || '', secondary: parts[1] || '' };
}

function combineDiagnosis(primary: string, secondary: string): string {
  if (!secondary.trim()) return primary;
  return `${primary}\n[Secondary] ${secondary}`;
}

function consultationToForm(c: ConsultationDTO): FormFields {
  const pe = parsePhysicalExam(c.physicalExam);
  const planParts = parsePlan(c.plan);
  const diagParts = parseDiagnosis(c.diagnosis);
  return {
    chiefComplaint: c.chiefComplaint || '',
    hpi: c.hpi || '',
    temperature: c.vitals?.temperature ?? null,
    systolic: c.vitals?.systolic ?? null,
    diastolic: c.vitals?.diastolic ?? null,
    heartRate: c.vitals?.heartRate ?? null,
    respiratoryRate: c.vitals?.respiratoryRate ?? null,
    height: c.vitals?.height ?? null,
    weight: c.vitals?.weight ?? null,
    bmi: c.vitals?.bmi ?? null,
    peGeneral: pe.general,
    peCardiovascular: pe.cardiovascular,
    peRespiratory: pe.respiratory,
    peAbdomen: pe.abdomen,
    peNeurological: pe.neurological,
    physicalExam: c.physicalExam || '',
    diagnosis: diagParts.primary,
    secondaryDiagnosis: diagParts.secondary,
    diagnosticCode: c.diagnosticCode || '',
    plan: planParts.plan,
    medicationsPlanned: planParts.medicationsPlanned,
    investigationPlanned: planParts.investigationPlanned,
    referrals: planParts.referrals,
    followUpInstructions: c.followUpInstructions || '',
  };
}

function bmiLabel(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

function bmiColor(bmi: number): string {
  if (bmi < 18.5) return 'text-blue-600 dark:text-blue-400';
  if (bmi < 25) return 'text-green-600 dark:text-green-400';
  if (bmi < 30) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function bmiCardBg(bmi: number): string {
  if (bmi < 18.5) return 'bg-blue-50 dark:bg-blue-900/20';
  if (bmi < 25) return 'bg-green-50 dark:bg-green-900/20';
  if (bmi < 30) return 'bg-yellow-50 dark:bg-yellow-900/20';
  return 'bg-red-50 dark:bg-red-900/20';
}

function fmtTime(t: string): string {
  return t.slice(0, 5);
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

// ---------------------------------------------------------------------------
// UI sub-components
// ---------------------------------------------------------------------------

function RecordStatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const styles: Record<string, string> = {
    DRAFT:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    AWAITING_RESULTS:
      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    FINALIZED:
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    AMENDED:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  };
  const icons: Record<string, string> = {
    DRAFT: '\u{1F4DD}',
    AWAITING_RESULTS: '\u23F3',
    FINALIZED: '\u{1F512}',
    AMENDED: '\u{1F4DD}',
  };
  const cls =
    styles[status] ??
    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}
    >
      {icons[status] ?? '\u2022'} {status}
    </span>
  );
}

function ApptStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    IN_PROGRESS:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    AWAITING_SERVICE_RESULTS:
      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    COMPLETED:
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    CHECKED_IN:
      'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    CONFIRMED:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    PENDING:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  };
  const cls =
    styles[status] ??
    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function ServiceStatusBadge({ status }: { status: string }) {
  const style = SERVICE_STATUS_STYLES[status] ?? { label: status, bg: 'bg-gray-100', text: 'text-gray-700' };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

function SectionCard({
  number,
  title,
  required = false,
  error,
  locked = false,
  headerRight,
  children,
}: {
  number: number;
  title: string;
  required?: boolean;
  error?: string;
  locked?: boolean;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const hasError = !!error;
  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-shadow hover:shadow-sm ${
        hasError
          ? 'border-red-300 dark:border-red-700'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div
        className={`flex items-center gap-3 px-6 py-3.5 border-b ${
          hasError
            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-700'
            : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700'
        }`}
      >
        <span className='flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center'>
          {number}
        </span>
        <h3 className='font-semibold text-sm text-gray-900 dark:text-white flex-1'>
          {title}
          {required && <span className='ml-1 text-red-500'>*</span>}
        </h3>
        {locked && (
          <span className='text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1'>
            🔒 Read-only
          </span>
        )}
        {hasError && (
          <span className='ml-auto text-xs font-medium text-red-600 dark:text-red-400'>
            {error}
          </span>
        )}
        {headerRight}
      </div>
      <div className='px-6 py-5 bg-white dark:bg-gray-900'>{children}</div>
    </div>
  );
}

function NoteArea({
  value,
  onChange,
  placeholder,
  disabled,
  rows = 4,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  label?: string;
}) {
  return (
    <div>
      {label && (
        <label className='block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'>
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className='w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed resize-none'
      />
    </div>
  );
}

function VitalInput({
  label,
  value,
  onChange,
  placeholder,
  step = '1',
  disabled,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder: string;
  step?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className='block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'>
        {label}
      </label>
      <input
        type='number'
        step={step}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) =>
          onChange(e.target.value !== '' ? parseFloat(e.target.value) : null)
        }
        disabled={disabled}
        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed'
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Service Modal
// ---------------------------------------------------------------------------

function AddServiceModal({
  onClose,
  onAdd,
  saving,
}: {
  onClose: () => void;
  onAdd: (dto: ServiceOrderCreateDTO) => Promise<void>;
  saving: boolean;
}) {
  const [catalog, setCatalog] = useState<MedicalServiceDTO[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [priority, setPriority] = useState<ServicePriority>(ServicePriority.ROUTINE);
  const [notes, setNotes] = useState('');

  // Load service catalog from DB
  useEffect(() => {
    const load = async () => {
      setLoadingCatalog(true);
      try {
        const data = await serviceOrderService.getServiceCatalog();
        setCatalog(data);
      } catch {
        console.error('Failed to load service catalog');
      } finally {
        setLoadingCatalog(false);
      }
    };
    load();
  }, []);

  const filteredCatalog = filterCategory
    ? catalog.filter((s) => s.category === filterCategory)
    : catalog;

  const selectedService = catalog.find((s) => s.id === selectedServiceId) ?? null;

  const handleSubmit = async () => {
    if (!selectedService) return;
    await onAdd({
      serviceName: selectedService.serviceName,
      category: selectedService.category,
      medicalServiceId: selectedService.id,
      price: selectedService.defaultPrice,
      priority,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4'>
      <div className='w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800 max-h-[90vh] overflow-y-auto'>
        <h2 className='mb-4 text-lg font-bold text-gray-900 dark:text-white'>
          Order Service
        </h2>

        {loadingCatalog ? (
          <div className='flex items-center justify-center py-8'>
            <div className='h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent' />
            <span className='ml-2 text-sm text-gray-500'>Loading services...</span>
          </div>
        ) : (
          <>
            {/* Filter by category (department) */}
            <div className='mb-3'>
              <label className='block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'>
                Filter by Department
              </label>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setSelectedServiceId(null);
                }}
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>All Departments ({catalog.length} services)</option>
                {Object.entries(SERVICE_CATEGORY_LABELS).map(([key, label]) => {
                  const count = catalog.filter((s) => s.category === key).length;
                  return (
                    <option key={key} value={key}>
                      {DEPARTMENT_LABELS[key] ?? label} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Service combobox */}
            <div className='mb-3'>
              <label className='block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'>
                Select Service *
              </label>
              <select
                value={selectedServiceId ?? ''}
                onChange={(e) => setSelectedServiceId(e.target.value ? Number(e.target.value) : null)}
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>-- Choose a service --</option>
                {filteredCatalog.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.serviceName} — {formatPrice(s.defaultPrice ?? 0)}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected service details */}
            {selectedService && (
              <div className='mb-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20'>
                <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                  {selectedService.serviceName}
                </p>
                <p className='text-xs text-gray-600 dark:text-gray-400'>
                  {SERVICE_CATEGORY_LABELS[selectedService.category] ?? selectedService.category}
                  &nbsp;&middot;&nbsp;
                  {formatPrice(selectedService.defaultPrice ?? 0)}
                </p>
                {selectedService.description && (
                  <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                    {selectedService.description}
                  </p>
                )}
                {/* Department routing indicator */}
                <div className='mt-2 flex items-center gap-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 px-2.5 py-1.5'>
                  <svg className='h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M13 7l5 5m0 0l-5 5m5-5H6' />
                  </svg>
                  <span className='text-xs font-medium text-indigo-700 dark:text-indigo-300'>
                    Routes to: {DEPARTMENT_LABELS[selectedService.category] ?? selectedService.category} Dept.
                  </span>
                </div>
              </div>
            )}

            {/* Priority */}
            <div className='mb-3'>
              <label className='block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'>
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ServicePriority)}
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value={ServicePriority.ROUTINE}>Routine</option>
                <option value={ServicePriority.URGENT}>Urgent</option>
                <option value={ServicePriority.STAT}>STAT</option>
              </select>
            </div>

            {/* Notes */}
            <div className='mb-4'>
              <label className='block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'>
                Clinical Notes (optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='e.g. Fasting required, contrast dye...'
                className='w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
              />
            </div>

            {/* Actions */}
            <div className='flex gap-3'>
              <Button variant='outline' className='flex-1' onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button className='flex-1' onClick={handleSubmit} disabled={saving || !selectedService}>
                {saving ? 'Ordering...' : 'Order Service'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ConsultationForm({
  appointmentId,
  onBack,
  patientInfo: passedInfo,
}: ConsultationFormProps) {
  const navigate = useNavigate();
  const { toast, showToast, dismissToast } = useToast();

  const [consultation, setConsultation] = useState<ConsultationDTO | null>(null);
  const [appointment, setAppointment] = useState<AppointmentDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormFields>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [addendumText, setAddendumText] = useState('');
  const [showAddendumInput, setShowAddendumInput] = useState(false);
  const [addendumSaving, setAddendumSaving] = useState(false);

  // Service Orders state
  const [serviceOrders, setServiceOrders] = useState<ServiceOrderDTO[]>([]);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [hasPendingOrders, setHasPendingOrders] = useState(false);
  const [serviceOrderSaving, setServiceOrderSaving] = useState(false);
  const [viewResultOrderId, setViewResultOrderId] = useState<number | null>(null);
  const [viewResultServiceName, setViewResultServiceName] = useState('');

  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<FormFields>(form);
  formRef.current = form;

  const isFinalized =
    consultation?.status === 'FINALIZED' || consultation?.status === 'AMENDED';

  // -- Initial load --
  useEffect(() => {
    if (!appointmentId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const [consResult, apptResult, ordersResult] = await Promise.allSettled([
          consultationService.getConsultation(appointmentId),
          appointmentService.getDoctorAppointmentDetail(appointmentId),
          serviceOrderService.getServiceOrders(appointmentId),
        ]);
        if (apptResult.status === 'fulfilled') setAppointment(apptResult.value);
        if (consResult.status === 'fulfilled') {
          const c = consResult.value;
          setConsultation(c);
          setForm(consultationToForm(c));
          setLastSavedAt(new Date(c.updatedAt));
        }
        if (ordersResult.status === 'fulfilled') {
          const orders = ordersResult.value;
          setServiceOrders(orders);
          setHasPendingOrders(
            orders.some((o) => !['COMPLETED', 'CANCELLED'].includes(o.status))
          );
        }
      } catch (err) {
        console.error('Failed to load consultation:', err);
        showToast('Failed to load consultation data', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [appointmentId]);

  // -- Autosave (30 s debounce) --
  useEffect(() => {
    if (!isDirty || isFinalized || !appointmentId) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        const f = formRef.current;
        const updated = await consultationService.saveDraft(appointmentId, {
          chiefComplaint: f.chiefComplaint,
          hpi: f.hpi,
          temperature: f.temperature,
          systolic: f.systolic,
          diastolic: f.diastolic,
          heartRate: f.heartRate,
          respiratoryRate: f.respiratoryRate,
          height: f.height,
          weight: f.weight,
          physicalExam: combinePhysicalExam(f),
          diagnosis: combineDiagnosis(f.diagnosis, f.secondaryDiagnosis),
          diagnosticCode: f.diagnosticCode,
          plan: combinePlan(f),
          followUpInstructions: f.followUpInstructions,
        });
        setConsultation(updated);
        setIsDirty(false);
        setLastSavedAt(new Date());
      } catch {
        /* silent autosave failure */
      }
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [form, isDirty, isFinalized, appointmentId]);

  // -- Build payload --
  const buildPayload = useCallback(() => {
    const f = formRef.current;
    return {
      chiefComplaint: f.chiefComplaint,
      hpi: f.hpi,
      temperature: f.temperature,
      systolic: f.systolic,
      diastolic: f.diastolic,
      heartRate: f.heartRate,
      respiratoryRate: f.respiratoryRate,
      height: f.height,
      weight: f.weight,
      physicalExam: combinePhysicalExam(f),
      diagnosis: combineDiagnosis(f.diagnosis, f.secondaryDiagnosis),
      diagnosticCode: f.diagnosticCode,
      plan: combinePlan(f),
      followUpInstructions: f.followUpInstructions,
    };
  }, [appointmentId]);

  // -- Auto Fill with Sample Data --
  const handleAutoFill = () => {
    const { height, weight, ...otherData } = SAMPLE_CONSULTATION_DATA as any;
    
    // Calculate BMI
    let bmi = null;
    if (height && weight && height > 0) {
      bmi = Math.round((weight / (height / 100) ** 2) * 10) / 10;
    }

    setForm((prev) => ({
      ...prev,
      ...otherData,
      height: height ?? null,
      weight: weight ?? null,
      bmi: bmi,
    }));
    
    setIsDirty(true);
    showToast('📋 Sample data populated! You can now edit and save.', 'success');
  };

  // -- Save Draft --
  const handleSaveDraft = async () => {
    if (!appointmentId) {
      showToast('No appointment selected', 'error');
      return;
    }

    setSaving(true);
    try {
      const updated = await consultationService.saveDraft(
        appointmentId,
        buildPayload()
      );
      setConsultation(updated);
      setIsDirty(false);
      setLastSavedAt(new Date());
      showToast('Draft saved', 'success');
    } catch (err) {
      const msg =
        (err as any)?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to save');
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // -- Finalize --
  const handleFinalizeSubmit = async () => {
    if (!appointmentId) return;
    if (!form.chiefComplaint.trim()) {
      showToast('Chief Complaint is required before finalizing', 'error');
      return;
    }
    if (!form.diagnosis.trim()) {
      showToast('Diagnosis is required before finalizing', 'error');
      return;
    }
    if (hasPendingOrders) {
      showToast('Cannot finalize while ordered services are still pending. Wait for all results or cancel pending orders.', 'error');
      setShowFinalizeConfirm(false);
      return;
    }
    setSaving(true);
    try {
      const updated = await consultationService.finalize(
        appointmentId,
        buildPayload()
      );
      setConsultation(updated);
      setIsDirty(false);
      setShowFinalizeConfirm(false);
      setShowSuccessModal(true);
    } catch (err) {
      const msg =
        (err as any)?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to finalize');
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // -- Service Order handlers --
  const handleAddServiceOrder = async (dto: ServiceOrderCreateDTO) => {
    if (!appointmentId) return;
    setServiceOrderSaving(true);
    try {
      const created = await serviceOrderService.createServiceOrder(appointmentId, dto);
      setServiceOrders((prev) => [...prev, created]);
      setHasPendingOrders(true);
      setShowAddServiceModal(false);
      showToast(`Service "${created.serviceName}" ordered`, 'success');
    } catch (err) {
      const msg =
        (err as any)?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to order service');
      showToast(msg, 'error');
    } finally {
      setServiceOrderSaving(false);
    }
  };

  const handleCancelServiceOrder = async (orderId: number) => {
    if (!appointmentId) return;
    setServiceOrderSaving(true);
    try {
      const updated = await serviceOrderService.cancelServiceOrder(orderId);
      setServiceOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updated : o))
      );
      // Recheck pending
      const remaining = serviceOrders
        .map((o) => (o.id === orderId ? updated : o))
        .filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status));
      setHasPendingOrders(remaining.length > 0);
      showToast('Service order cancelled', 'success');
    } catch (err) {
      const msg =
        (err as any)?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to cancel');
      showToast(msg, 'error');
    } finally {
      setServiceOrderSaving(false);
    }
  };

  const refreshServiceOrders = async () => {
    if (!appointmentId) return;
    try {
      const orders = await serviceOrderService.getServiceOrders(appointmentId);
      setServiceOrders(orders);
      setHasPendingOrders(
        orders.some((o) => !['COMPLETED', 'CANCELLED'].includes(o.status))
      );
    } catch {
      /* silent */
    }
  };

  // -- Addendum --
  const handleAddAmendment = async () => {
    if (!appointmentId || !addendumText.trim()) return;
    setAddendumSaving(true);
    try {
      const newAmendment = await consultationService.addAmendment(
        appointmentId,
        addendumText.trim()
      );
      setConsultation((prev) =>
        prev
          ? {
              ...prev,
              status: 'AMENDED' as const,
              amendments: [...(prev.amendments ?? []), newAmendment],
            }
          : prev
      );
      setAddendumText('');
      setShowAddendumInput(false);
      showToast('Addendum added', 'success');
    } catch (err) {
      const msg =
        (err as any)?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to add addendum');
      showToast(msg, 'error');
    } finally {
      setAddendumSaving(false);
    }
  };

  const handleSignAmendment = async (amendmentId: number) => {
    if (!appointmentId) return;
    try {
      const signedAmendment = await consultationService.signAmendment(
        appointmentId,
        amendmentId
      );
      setConsultation((prev) =>
        prev
          ? {
              ...prev,
              amendments: (prev.amendments ?? []).map((a) =>
                a.id === signedAmendment.id ? signedAmendment : a
              ),
            }
          : prev
      );
      showToast('Addendum signed', 'success');
    } catch (err) {
      const msg =
        (err as any)?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to sign');
      showToast(msg, 'error');
    }
  };

  // -- Field helpers --
  const setTextField = (field: keyof FormFields, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const setVital = (field: keyof FormFields, value: number | null) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      const h = field === 'height' ? value : prev.height;
      const w = field === 'weight' ? value : prev.weight;
      if (h && w && h > 0) {
        next.bmi = Math.round((w / (h / 100) ** 2) * 10) / 10;
      }
      return next;
    });
    setIsDirty(true);
  };

  // -- File helpers --
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!appointmentId || !e.target.files?.length) return;
    const files = Array.from(e.target.files);
    setSaving(true);
    try {
      for (const file of files) {
        const att = await consultationService.uploadAttachment(
          appointmentId,
          file
        );
        setConsultation((prev) =>
          prev
            ? { ...prev, attachments: [...(prev.attachments ?? []), att] }
            : prev
        );
      }
      showToast(`${files.length} file(s) uploaded`, 'success');
    } catch {
      showToast('Upload failed', 'error');
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = async (attachmentId: number) => {
    if (!appointmentId) return;
    setSaving(true);
    try {
      await consultationService.deleteAttachment(
        appointmentId,
        attachmentId.toString()
      );
      setConsultation((prev) =>
        prev
          ? {
              ...prev,
              attachments: (prev.attachments ?? []).filter(
                (a) => a.id !== attachmentId
              ),
            }
          : prev
      );
      showToast('Attachment removed', 'success');
    } catch {
      showToast('Failed to remove attachment', 'error');
    } finally {
      setSaving(false);
    }
  };

  // -- Derived display --
  const displayName =
    consultation?.patientName ?? passedInfo?.patientName ?? '\u2014';
  const displayCode =
    appointment?.appointmentCode ?? passedInfo?.appointmentCode ?? '\u2014';
  const visitType = appointment?.appointmentType ?? '\u2014';
  const doctorName = consultation?.doctorName ?? '\u2014';
  const apptStatus = appointment?.status ?? null;
  const recordStatus = consultation?.status ?? 'DRAFT';
  const attachments = consultation?.attachments ?? [];
  const amendments = consultation?.amendments ?? [];

  // -- Loading --
  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent' />
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Loading consultation...
          </p>
        </div>
      </div>
    );
  }

  // -- Render --
  return (
    <>
      {/* Sticky Header */}
      <div className='sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900'>
        <div className='flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
          {/* Left: patient info */}
          <div className='flex min-w-0 flex-wrap items-center gap-3'>
            <div className='min-w-0'>
              <p className='truncate text-base font-bold text-gray-900 dark:text-white'>
                {displayName}
              </p>
              <p className='truncate text-xs text-gray-500 dark:text-gray-400'>
                {displayCode} &middot; {visitType} &middot; {doctorName}
                {appointment?.appointmentDate &&
                  ` \u00B7 ${appointment.appointmentDate}`}
                {appointment?.startTime &&
                  ` ${fmtTime(appointment.startTime)}`}
                {appointment?.endTime && `\u2013${fmtTime(appointment.endTime)}`}
              </p>
            </div>
            <div className='flex flex-shrink-0 items-center gap-2'>
              {apptStatus && <ApptStatusBadge status={apptStatus} />}
              <RecordStatusBadge status={recordStatus} />
            </div>
          </div>

          {/* Right: actions */}
          <div className='flex flex-shrink-0 items-center gap-2'>
            {lastSavedAt && (
              <span className='hidden text-xs text-gray-400 sm:inline'>
                Saved {lastSavedAt.toLocaleTimeString()}
              </span>
            )}
            {isDirty && !isFinalized && (
              <span className='text-xs font-medium text-amber-500'>
                Unsaved changes
              </span>
            )}
            <Button variant='outline' onClick={onBack} disabled={saving}>
              Back
            </Button>
            {!isFinalized && (
              <Button
                variant='outline'
                onClick={handleAutoFill}
                disabled={saving}
                title='Fill form with sample medical data'
              >
                📋 Auto Fill
              </Button>
            )}
            {!isFinalized && (
              <Button
                variant='outline'
                onClick={handleSaveDraft}
                disabled={saving}
              >
                {saving ? 'Saving...' : '💾 Save Draft'}
              </Button>
            )}
            {!isFinalized && (
              <Button
                onClick={() => setShowFinalizeConfirm(true)}
                disabled={saving || hasPendingOrders}
                title={hasPendingOrders ? 'Cannot finalize while ordered services are pending' : undefined}
              >
                Finalize &amp; Sign
              </Button>
            )}
            {isFinalized && (
              <Button
                variant='outline'
                onClick={() => setShowAddendumInput((v) => !v)}
              >
                + Addendum
              </Button>
            )}
            <Button
              variant='outline'
              onClick={() => window.print()}
              disabled={saving}
            >
              Print
            </Button>
          </div>
        </div>
        {/* Pending orders warning bar */}
        {hasPendingOrders && !isFinalized && (
          <div className='bg-orange-50 border-t border-orange-200 px-4 py-2 dark:bg-orange-900/20 dark:border-orange-800'>
            <p className='text-xs font-medium text-orange-700 dark:text-orange-300'>
              ⚠️ Pending service orders exist. Finalization is blocked until all orders are completed or cancelled.
              <button
                onClick={refreshServiceOrders}
                className='ml-2 underline hover:no-underline'
              >
                Refresh status
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Page body */}
      <div className='mx-auto max-w-4xl space-y-6 px-4 py-6'>
        {/* Clinical alerts */}
        {(passedInfo?.allergies || passedInfo?.medicalHistory) && (
          <div className='space-y-2'>
            {passedInfo.allergies && (
              <div className='flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20'>
                <span className='flex-shrink-0 font-bold text-red-600'>⚠️</span>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-400'>
                    Allergies
                  </p>
                  <p className='text-sm text-red-600 dark:text-red-300'>
                    {passedInfo.allergies}
                  </p>
                </div>
              </div>
            )}
            {passedInfo.medicalHistory && (
              <div className='flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20'>
                <span className='flex-shrink-0 font-bold text-amber-600'>
                  📋
                </span>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400'>
                    Medical History
                  </p>
                  <p className='text-sm text-amber-600 dark:text-amber-300'>
                    {passedInfo.medicalHistory}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Finalized notice */}
        {isFinalized && (
          <div className='rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-900/20'>
            <p className='text-sm font-medium text-emerald-700 dark:text-emerald-300'>
              🔒 This record is finalized and locked.
              {consultation?.finalizedAt &&
                ` Signed on ${new Date(consultation.finalizedAt).toLocaleString()}`}
              {consultation?.finalizedByUserName &&
                ` by ${consultation.finalizedByUserName}`}
              .
            </p>
          </div>
        )}

        {/* 1. Chief Complaint */}
        <SectionCard number={1} title='Chief Complaint' required>
          <NoteArea
            placeholder="Enter the patient's main reason for visit"
            value={form.chiefComplaint}
            onChange={(v) => setTextField('chiefComplaint', v)}
            disabled={isFinalized}
            rows={3}
          />
        </SectionCard>

        {/* 2. HPI */}
        <SectionCard number={2} title='History of Present Illness'>
          <NoteArea
            placeholder='Describe the onset, duration, severity, and associated symptoms'
            value={form.hpi}
            onChange={(v) => setTextField('hpi', v)}
            disabled={isFinalized}
            rows={4}
          />
        </SectionCard>

        {/* 3. Vitals */}
        <SectionCard number={3} title='Vital Signs'>
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
            <VitalInput
              label='Temperature (\u00B0C)'
              placeholder='36.5'
              step='0.1'
              value={form.temperature}
              onChange={(v) => setVital('temperature', v)}
              disabled={isFinalized}
            />
            <VitalInput
              label='Systolic BP (mmHg)'
              placeholder='120'
              value={form.systolic}
              onChange={(v) => setVital('systolic', v)}
              disabled={isFinalized}
            />
            <VitalInput
              label='Diastolic BP (mmHg)'
              placeholder='80'
              value={form.diastolic}
              onChange={(v) => setVital('diastolic', v)}
              disabled={isFinalized}
            />
            <VitalInput
              label='Heart Rate (bpm)'
              placeholder='72'
              value={form.heartRate}
              onChange={(v) => setVital('heartRate', v)}
              disabled={isFinalized}
            />
            <VitalInput
              label='Respiratory Rate (/min)'
              placeholder='16'
              value={form.respiratoryRate}
              onChange={(v) => setVital('respiratoryRate', v)}
              disabled={isFinalized}
            />
          </div>
          {/* BMI */}
          <div className='mt-5 border-t border-gray-200 pt-4 dark:border-gray-700'>
            <p className='mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>
              Body Measurements
            </p>
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
              <VitalInput
                label='Height (cm)'
                placeholder='170'
                value={form.height}
                onChange={(v) => setVital('height', v)}
                disabled={isFinalized}
              />
              <VitalInput
                label='Weight (kg)'
                placeholder='70'
                step='0.1'
                value={form.weight}
                onChange={(v) => setVital('weight', v)}
                disabled={isFinalized}
              />
              {form.bmi != null && (
                <div className={`rounded-xl p-4 ${bmiCardBg(form.bmi)}`}>
                  <p className='text-xs font-medium text-gray-500 dark:text-gray-400'>
                    BMI
                  </p>
                  <p className={`mt-1 text-2xl font-bold ${bmiColor(form.bmi)}`}>
                    {form.bmi}
                  </p>
                  <p className={`mt-1 text-xs ${bmiColor(form.bmi)}`}>
                    {bmiLabel(form.bmi)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* 4. Physical Exam - Structured sub-sections */}
        <SectionCard number={4} title='Physical Examination'>
          <div className='space-y-4'>
            <NoteArea
              label='General Appearance'
              placeholder='Alert, oriented, no acute distress...'
              value={form.peGeneral}
              onChange={(v) => setTextField('peGeneral', v)}
              disabled={isFinalized}
              rows={2}
            />
            <NoteArea
              label='Cardiovascular'
              placeholder='Regular rate and rhythm, no murmurs...'
              value={form.peCardiovascular}
              onChange={(v) => setTextField('peCardiovascular', v)}
              disabled={isFinalized}
              rows={2}
            />
            <NoteArea
              label='Respiratory'
              placeholder='Clear to auscultation bilaterally, no wheezes...'
              value={form.peRespiratory}
              onChange={(v) => setTextField('peRespiratory', v)}
              disabled={isFinalized}
              rows={2}
            />
            <NoteArea
              label='Abdomen'
              placeholder='Soft, non-tender, non-distended, normoactive bowel sounds...'
              value={form.peAbdomen}
              onChange={(v) => setTextField('peAbdomen', v)}
              disabled={isFinalized}
              rows={2}
            />
            <NoteArea
              label='Neurological'
              placeholder='CN II-XII intact, normal gait, sensation intact...'
              value={form.peNeurological}
              onChange={(v) => setTextField('peNeurological', v)}
              disabled={isFinalized}
              rows={2}
            />
          </div>
        </SectionCard>

        {/* 5. Diagnosis - Primary + Secondary */}
        <SectionCard number={5} title='Diagnosis' required>
          <div className='space-y-3'>
            <NoteArea
              label='Primary Diagnosis'
              placeholder='Enter primary diagnosis'
              value={form.diagnosis}
              onChange={(v) => setTextField('diagnosis', v)}
              disabled={isFinalized}
              rows={2}
            />
            <NoteArea
              label='Secondary Diagnosis (optional)'
              placeholder='Enter secondary or differential diagnoses'
              value={form.secondaryDiagnosis}
              onChange={(v) => setTextField('secondaryDiagnosis', v)}
              disabled={isFinalized}
              rows={2}
            />
            <div>
              <label className='mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400'>
                ICD-10 Code (optional)
              </label>
              <input
                type='text'
                placeholder='e.g. J00.9'
                value={form.diagnosticCode}
                onChange={(e) => setTextField('diagnosticCode', e.target.value)}
                disabled={isFinalized}
                className='w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 sm:w-48'
              />
            </div>
          </div>
        </SectionCard>

        {/* 6. Treatment Plan - Structured */}
        <SectionCard number={6} title='Treatment Plan'>
          <div className='space-y-3'>
            <NoteArea
              label='Plan Overview'
              placeholder='Overall treatment plan and approach'
              value={form.plan}
              onChange={(v) => setTextField('plan', v)}
              disabled={isFinalized}
              rows={3}
            />
            <NoteArea
              label='Medications Planned'
              placeholder='Medications to prescribe...'
              value={form.medicationsPlanned}
              onChange={(v) => setTextField('medicationsPlanned', v)}
              disabled={isFinalized}
              rows={2}
            />
            <NoteArea
              label='Investigations Planned'
              placeholder='Lab tests, imaging, other investigations...'
              value={form.investigationPlanned}
              onChange={(v) => setTextField('investigationPlanned', v)}
              disabled={isFinalized}
              rows={2}
            />
            <NoteArea
              label='Referrals'
              placeholder='Specialist referrals if needed...'
              value={form.referrals}
              onChange={(v) => setTextField('referrals', v)}
              disabled={isFinalized}
              rows={2}
            />
          </div>
        </SectionCard>

        {/* 7. Ordered Services */}
        <SectionCard
          number={7}
          title='Ordered Services'
          headerRight={
            !isFinalized ? (
              <Button
                variant='outline'
                onClick={() => setShowAddServiceModal(true)}
                disabled={saving}
              >
                + Add Service
              </Button>
            ) : undefined
          }
        >
          {serviceOrders.length === 0 ? (
            <p className='text-sm italic text-gray-400 dark:text-gray-500'>
              No services ordered yet. Click &quot;+ Add Service&quot; to order lab tests, imaging, etc.
            </p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b border-gray-200 dark:border-gray-700'>
                    <th className='pb-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>Service</th>
                    <th className='pb-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>Category</th>
                    <th className='pb-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>Price</th>
                    <th className='pb-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>Ordered</th>
                    <th className='pb-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>Status</th>
                    <th className='pb-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>Result</th>
                    <th className='pb-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>Action</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100 dark:divide-gray-800'>
                  {serviceOrders.map((order) => (
                    <tr key={order.id} className='hover:bg-gray-50 dark:hover:bg-gray-800/50'>
                      <td className='py-3 pr-3'>
                        <p className='font-medium text-gray-900 dark:text-white'>{order.serviceName}</p>
                        {order.notes && (
                          <p className='mt-0.5 text-xs text-gray-500 dark:text-gray-400'>{order.notes}</p>
                        )}
                      </td>
                      <td className='py-3 pr-3'>
                        <span className='text-xs text-gray-600 dark:text-gray-400'>
                          {SERVICE_CATEGORY_LABELS[order.category] ?? order.category}
                        </span>
                      </td>
                      <td className='py-3 pr-3 text-right whitespace-nowrap'>
                        {order.price ? formatPrice(order.price) : '—'}
                      </td>
                      <td className='py-3 pr-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400'>
                        {order.orderedAt ? new Date(order.orderedAt).toLocaleString() : '—'}
                      </td>
                      <td className='py-3 pr-3'>
                        <ServiceStatusBadge status={order.status} />
                      </td>
                      <td className='py-3 pr-3'>
                        {order.status === 'COMPLETED' ? (
                          <button
                            onClick={() => { setViewResultOrderId(order.id); setViewResultServiceName(order.serviceName); }}
                            className='text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                          >
                            View Result
                          </button>
                        ) : (
                          <span className='text-xs text-gray-400'>—</span>
                        )}
                      </td>
                      <td className='py-3 text-right'>
                        {!['COMPLETED', 'CANCELLED'].includes(order.status) && !isFinalized && (
                          <button
                            onClick={() => handleCancelServiceOrder(order.id)}
                            disabled={serviceOrderSaving}
                            className='text-xs text-red-600 hover:text-red-800 disabled:opacity-40 dark:text-red-400 dark:hover:text-red-300'
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Total */}
              <div className='mt-3 flex justify-end border-t border-gray-200 pt-3 dark:border-gray-700'>
                <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                  Total: {formatPrice(serviceOrders.filter((o) => o.status !== 'CANCELLED').reduce((sum, o) => sum + (o.price ?? 0), 0))}
                </p>
              </div>
            </div>
          )}
        </SectionCard>

        {/* 8. Prescription */}
        <SectionCard number={8} title='Prescription'>
          <div className='flex items-center justify-between gap-4'>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              {isFinalized
                ? 'Record is finalized. Use the button to manage the prescription.'
                : 'Finalize this record first, then create the prescription.'}
            </p>
            <Button
              variant='outline'
              disabled={!isFinalized}
              onClick={() =>
                navigate('/doctor/prescriptions/create', {
                  state: {
                    appointmentId,
                    patientId: consultation?.patientId,
                    patientName: consultation?.patientName,
                    diagnosis: form.diagnosis,
                    followUpInstructions: form.followUpInstructions,
                    consultationId: consultation?.id,
                  },
                })
              }
            >
              Create Prescription
            </Button>
          </div>
        </SectionCard>

        {/* 9. Follow-up */}
        <SectionCard number={9} title='Follow-up Instructions'>
          <NoteArea
            placeholder='Return visit schedule, home care, warning signs to watch for'
            value={form.followUpInstructions}
            onChange={(v) => setTextField('followUpInstructions', v)}
            disabled={isFinalized}
            rows={3}
          />
        </SectionCard>

        {/* 10. Attachments */}
        <SectionCard number={10} title='Attachments'>
          {!isFinalized && (
            <label className='flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center transition-colors hover:border-brand-400 hover:bg-brand-50 dark:border-gray-600 dark:bg-gray-800/50 dark:hover:bg-brand-900/10'>
              <svg
                className='mb-2 h-8 w-8 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'
                />
              </svg>
              <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                Click to upload files
              </span>
              <span className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                Images, PDFs up to 10 MB each
              </span>
              <input
                type='file'
                multiple
                accept='image/*,.pdf'
                className='hidden'
                onChange={handleUpload}
                disabled={saving}
              />
            </label>
          )}
          {attachments.length > 0 && (
            <div className={`${!isFinalized ? 'mt-4' : ''} space-y-2`}>
              {attachments.map((att) => {
                const isImage = att.mimeType?.startsWith('image/');
                const sizeLabel = att.fileSize
                  ? att.fileSize >= 1024 * 1024
                    ? `${(att.fileSize / (1024 * 1024)).toFixed(1)} MB`
                    : `${(att.fileSize / 1024).toFixed(1)} KB`
                  : '';
                return (
                  <div
                    key={att.id}
                    className='flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/50'
                  >
                    {/* Thumbnail / Icon */}
                    {isImage && att.filePath ? (
                      <img
                        src={att.filePath}
                        alt={att.filename}
                        className='h-12 w-12 flex-shrink-0 rounded object-cover'
                      />
                    ) : (
                      <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-gray-600'>
                        <svg className='h-6 w-6 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' />
                        </svg>
                      </div>
                    )}

                    {/* File Info */}
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-medium text-gray-900 dark:text-white'>
                        {att.filename}
                      </p>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        {sizeLabel}{sizeLabel && ' · '}{new Date(att.createdAt).toLocaleString()}
                        {att.uploadedByUserName && ` · ${att.uploadedByUserName}`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className='flex flex-shrink-0 items-center gap-1'>
                      {att.filePath && (
                        <a
                          href={att.filePath}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='rounded p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30'
                          title='Open file'
                        >
                          <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' />
                          </svg>
                        </a>
                      )}
                      {!isFinalized && (
                        <button
                          onClick={() => handleRemoveAttachment(att.id)}
                          disabled={saving}
                          className='rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-900/30'
                          title='Delete'
                        >
                          <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {attachments.length === 0 && isFinalized && (
            <p className='text-sm italic text-gray-400 dark:text-gray-500'>
              No attachments.
            </p>
          )}
        </SectionCard>

        {/* 11. Addenda */}
        {(isFinalized || amendments.length > 0) && (
          <SectionCard number={11} title='Addenda'>
            {showAddendumInput && (
              <div className='mb-4 space-y-2'>
                <NoteArea
                  placeholder='Enter addendum text...'
                  value={addendumText}
                  onChange={setAddendumText}
                  rows={3}
                />
                <div className='flex justify-end gap-2'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setShowAddendumInput(false);
                      setAddendumText('');
                    }}
                    disabled={addendumSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddAmendment}
                    disabled={addendumSaving || !addendumText.trim()}
                  >
                    {addendumSaving ? 'Saving...' : 'Add Addendum'}
                  </Button>
                </div>
              </div>
            )}
            {amendments.length === 0 && (
              <p className='text-sm italic text-gray-400 dark:text-gray-500'>
                No addenda yet.
              </p>
            )}
            {amendments.map((am, idx) => (
              <div
                key={am.id ?? idx}
                className='mb-3 rounded-lg border border-gray-200 p-4 last:mb-0 dark:border-gray-700'
              >
                <div className='mb-2 flex items-center justify-between'>
                  <span className='text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>
                    Addendum {idx + 1}
                    {am.createdAt &&
                      ` - ${new Date(am.createdAt).toLocaleString()}`}
                    {am.createdByUserName && ` - ${am.createdByUserName}`}
                  </span>
                  {!am.signedAt ? (
                    <Button
                      variant='outline'
                      onClick={() => handleSignAmendment(am.id!)}
                    >
                      Sign
                    </Button>
                  ) : (
                    <span className='text-xs font-medium text-emerald-600 dark:text-emerald-400'>
                      \u2713 Signed {new Date(am.signedAt).toLocaleString()}
                      {am.signedByUserName && ` by ${am.signedByUserName}`}
                    </span>
                  )}
                </div>
                <p className='whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200'>
                  {am.content}
                </p>
              </div>
            ))}
          </SectionCard>
        )}
      </div>

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <AddServiceModal
          onClose={() => setShowAddServiceModal(false)}
          onAdd={handleAddServiceOrder}
          saving={serviceOrderSaving}
        />
      )}

      {/* View Service Result Modal */}
      <ViewServiceResultModal
        isOpen={viewResultOrderId !== null}
        serviceOrderId={viewResultOrderId}
        serviceName={viewResultServiceName}
        onClose={() => { setViewResultOrderId(null); setViewResultServiceName(''); }}
      />

      {/* Finalize Confirm Modal */}
      {showFinalizeConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4'>
          <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800'>
            <h2 className='mb-2 text-lg font-bold text-gray-900 dark:text-white'>
              Finalize &amp; Sign Record?
            </h2>
            <p className='mb-6 text-sm text-gray-600 dark:text-gray-400'>
              Once finalized, this record is locked. You can add addenda later
              but cannot edit the main content.
              <br />
              Please confirm Chief Complaint and Diagnosis are complete.
            </p>
            <div className='flex gap-3'>
              <Button
                variant='outline'
                className='flex-1'
                onClick={() => setShowFinalizeConfirm(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                className='flex-1'
                onClick={handleFinalizeSubmit}
                disabled={saving}
              >
                {saving ? 'Finalizing...' : 'Confirm & Sign'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4'>
          <div className='w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-gray-800'>
            <div className='mb-4 text-5xl'>🎉</div>
            <h2 className='mb-2 text-xl font-bold text-gray-900 dark:text-white'>
              Record Finalized!
            </h2>
            <p className='mb-6 text-sm text-gray-600 dark:text-gray-400'>
              The medical record has been signed and locked. You can now create
              a prescription for this patient.
            </p>
            <div className='flex gap-3'>
              <Button
                variant='outline'
                className='flex-1'
                onClick={() => {
                  setShowSuccessModal(false);
                  onBack();
                }}
              >
                Done
              </Button>
              <Button
                className='flex-1'
                onClick={() =>
                  navigate('/doctor/prescriptions/create', {
                    state: {
                      appointmentId,
                      patientId: consultation?.patientId,
                      patientName: consultation?.patientName,
                      diagnosis: form.diagnosis,
                      followUpInstructions: form.followUpInstructions,
                      consultationId: consultation?.id,
                    },
                  })
                }
              >
                Create Prescription
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
