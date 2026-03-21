import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/button/Button';
import Toast from '../common/Toast';
import { useToast } from '../../hooks/useToast';
import consultationService, {
  type ConsultationDTO,
} from '../../services/consultationService';
import appointmentService, {
  type AppointmentDTO,
} from '../../services/appointmentService';

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
  physicalExam: string;
  diagnosis: string;
  diagnosticCode: string;
  plan: string;
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
  physicalExam: '',
  diagnosis: '',
  diagnosticCode: '',
  plan: '',
  followUpInstructions: '',
};

function consultationToForm(c: ConsultationDTO): FormFields {
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
    physicalExam: c.physicalExam || '',
    diagnosis: c.diagnosis || '',
    diagnosticCode: c.diagnosticCode || '',
    plan: c.plan || '',
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
  // Backend returns "HH:MM:SS" — display "HH:MM"
  return t.slice(0, 5);
}

// ---------------------------------------------------------------------------
// UI sub-components
// ---------------------------------------------------------------------------

function RecordStatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const styles: Record<string, string> = {
    DRAFT:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    FINALIZED:
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    AMENDED:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  };
  const icons: Record<string, string> = {
    DRAFT: '📝',
    FINALIZED: '🔒',
    AMENDED: '📝',
  };
  const cls =
    styles[status] ??
    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}
    >
      {icons[status] ?? '•'} {status}
    </span>
  );
}

function ApptStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    IN_PROGRESS:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
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

function SectionCard({
  number,
  title,
  required = false,
  error,
  locked = false,
  children,
}: {
  number: number;
  title: string;
  required?: boolean;
  error?: string;
  locked?: boolean;
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
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className='w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed resize-none'
    />
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

  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<FormFields>(form);
  formRef.current = form;

  const isFinalized =
    consultation?.status === 'FINALIZED' || consultation?.status === 'AMENDED';

  // â”€â”€ Initial load â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!appointmentId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const [consResult, apptResult] = await Promise.allSettled([
          consultationService.getConsultation(appointmentId),
          appointmentService.getDoctorAppointmentDetail(appointmentId),
        ]);
        if (apptResult.status === 'fulfilled') setAppointment(apptResult.value);
        if (consResult.status === 'fulfilled') {
          const c = consResult.value;
          setConsultation(c);
          setForm(consultationToForm(c));
          setLastSavedAt(new Date(c.updatedAt));
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

  // â”€â”€ Autosave (30 s debounce) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          physicalExam: f.physicalExam,
          diagnosis: f.diagnosis,
          diagnosticCode: f.diagnosticCode,
          plan: f.plan,
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

  // â”€â”€ Build payload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      physicalExam: f.physicalExam,
      diagnosis: f.diagnosis,
      diagnosticCode: f.diagnosticCode,
      plan: f.plan,
      followUpInstructions: f.followUpInstructions,
    };
  }, [appointmentId]);

  // â”€â”€ Save Draft â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Finalize â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Addendum â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Field helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ File helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Derived display â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const displayName =
    consultation?.patientName ?? passedInfo?.patientName ?? '—';
  const displayCode =
    appointment?.appointmentCode ?? passedInfo?.appointmentCode ?? '—';
  const visitType = appointment?.appointmentType ?? '—';
  const doctorName = consultation?.doctorName ?? '—';
  const apptStatus = appointment?.status ?? null;
  const recordStatus = consultation?.status ?? 'DRAFT';
  const attachments = consultation?.attachments ?? [];
  const amendments = consultation?.amendments ?? [];

  // â”€â”€ Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
                {displayCode} · {visitType} · {doctorName}
                {appointment?.appointmentDate &&
                  ` · ${appointment.appointmentDate}`}
                {appointment?.startTime &&
                  ` ${fmtTime(appointment.startTime)}`}
                {appointment?.endTime && `–${fmtTime(appointment.endTime)}`}
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
                onClick={handleSaveDraft}
                disabled={saving}
              >
                {saving ? 'Saving...' : '💾 Save Draft'}
              </Button>
            )}
            {!isFinalized && (
              <Button
                onClick={() => setShowFinalizeConfirm(true)}
                disabled={saving}
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
      </div>

      {/* Page body */}
      <div className='mx-auto max-w-4xl space-y-6 px-4 py-6'>
        {/* Clinical alerts */}
        {(passedInfo?.allergies || passedInfo?.medicalHistory) && (
          <div className='space-y-2'>
            {passedInfo.allergies && (
              <div className='flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20'>
                <span className='flex-shrink-0 font-bold text-red-600'>⚠</span>
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
              label='Temperature (°C)'
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

        {/* 4. Physical Exam */}
        <SectionCard number={4} title='Physical Examination'>
          <NoteArea
            placeholder='General appearance, cardiovascular, respiratory, abdomen, neurological, etc.'
            value={form.physicalExam}
            onChange={(v) => setTextField('physicalExam', v)}
            disabled={isFinalized}
            rows={4}
          />
        </SectionCard>

        {/* 5. Diagnosis */}
        <SectionCard number={5} title='Diagnosis' required>
          <NoteArea
            placeholder='Primary and secondary diagnoses'
            value={form.diagnosis}
            onChange={(v) => setTextField('diagnosis', v)}
            disabled={isFinalized}
            rows={3}
          />
          <div className='mt-3'>
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
        </SectionCard>

        {/* 6. Treatment Plan */}
        <SectionCard number={6} title='Treatment Plan'>
          <NoteArea
            placeholder='Medications, investigations ordered, procedures planned, referrals'
            value={form.plan}
            onChange={(v) => setTextField('plan', v)}
            disabled={isFinalized}
            rows={4}
          />
        </SectionCard>

        {/* 7. Prescription */}
        <SectionCard number={7} title='Prescription'>
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

        {/* 8. Follow-up */}
        <SectionCard number={8} title='Follow-up Instructions'>
          <NoteArea
            placeholder='Return visit schedule, home care, warning signs to watch for'
            value={form.followUpInstructions}
            onChange={(v) => setTextField('followUpInstructions', v)}
            disabled={isFinalized}
            rows={3}
          />
        </SectionCard>

        {/* 9. Attachments */}
        <SectionCard number={9} title='Attachments'>
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
            <ul className={`${!isFinalized ? 'mt-4' : ''} space-y-2`}>
              {attachments.map((att) => (
                <li
                  key={att.id}
                  className='flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-700/50'
                >
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium text-gray-900 dark:text-white'>
                      {att.filename}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                      {new Date(att.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!isFinalized && (
                    <button
                      onClick={() => handleRemoveAttachment(att.id)}
                      disabled={saving}
                      aria-label='Remove'
                      className='ml-3 flex-shrink-0 text-red-500 hover:text-red-700 disabled:opacity-40'
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {attachments.length === 0 && isFinalized && (
            <p className='text-sm italic text-gray-400 dark:text-gray-500'>
              No attachments.
            </p>
          )}
        </SectionCard>

        {/* 10. Addenda */}
        {(isFinalized || amendments.length > 0) && (
          <SectionCard number={10} title='Addenda'>
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
                      ✓ Signed {new Date(am.signedAt).toLocaleString()}
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
