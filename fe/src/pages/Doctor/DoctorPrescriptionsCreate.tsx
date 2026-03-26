import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import Toast from '../../components/common/Toast';
import { useToast } from '../../hooks/useToast';
import prescriptionService, {
  PrescriptionCreateDTO,
  PrescriptionItemDTO,
} from '../../services/prescriptionService';
import medicationService from '../../services/medicationService';
import type { MedicationDTO } from '../../services/medicationService';

interface ConsultationData {
  appointmentId?: number;
  patientId?: number;
  patientName?: string;
  diagnosis?: string;
  followUpInstructions?: string;
  consultationId?: number;
  // Template pre-fill (from Templates page)
  templateItems?: PrescriptionItemDTO[];
  templateName?: string;
  notes?: string;
  followUpDays?: number;
  // Reissue mode
  reissueMode?: boolean;
  reissueFromCode?: string;
  followUpDate?: string;
}

interface PrescriptionForm {
  patientId: number;
  appointmentId?: number;
  prescriptionDate: string;
  diagnosis: string;
  notes: string;
  followUpDate: string;
  items: PrescriptionItemDTO[];
}

// ==================== MEDICINE BLOCK STATE ====================
interface MedicineBlockState extends PrescriptionItemDTO {
  selectedMedication?: MedicationDTO;
  _key: number;
  // Dose schedule checkboxes
  morningEnabled?: boolean;
  noonEnabled?: boolean;
  afternoonEnabled?: boolean;
  eveningEnabled?: boolean;
  // Override quantity manually
  quantityOverride?: boolean;
}

let _keyCounter = 0;
const newBlock = (partial?: Partial<MedicineBlockState>): MedicineBlockState => ({
  _key: ++_keyCounter,
  medicineName: '',
  dosage: '',
  frequency: '',
  duration: '',
  quantity: undefined,
  unit: '',
  instructions: '',
  notes: '',
  morningDose: 0,
  noonDose: 0,
  afternoonDose: 0,
  eveningDose: 0,
  morningEnabled: false,
  noonEnabled: false,
  afternoonEnabled: false,
  eveningEnabled: false,
  quantityOverride: false,
  selectedMedication: undefined,
  ...partial,
});

// ==================== PRESETS ====================
const DOSAGE_PRESETS = ['1 tablet', '2 tablets', '1/2 tablet', '5ml', '10ml', '1 sachet'];
const DURATION_PRESETS = ['3 days', '5 days', '7 days', '10 days', '14 days', '30 days'];
const INSTRUCTION_PRESETS = [
  'Take after meals', 'Take before meals', 'Take in the morning',
  'Take when in pain', 'Do not take on empty stomach', 'Drink plenty of water',
];

// ==================== DOSE SCHEDULE HELPERS ====================
const DOSE_SESSIONS = [
  { key: 'morning', label: 'Morning', enabledKey: 'morningEnabled', doseKey: 'morningDose' },
  { key: 'noon', label: 'Noon', enabledKey: 'noonEnabled', doseKey: 'noonDose' },
  { key: 'afternoon', label: 'Afternoon', enabledKey: 'afternoonEnabled', doseKey: 'afternoonDose' },
  { key: 'evening', label: 'Evening', enabledKey: 'eveningEnabled', doseKey: 'eveningDose' },
] as const;

/** Parse "10 days" → 10 | "7 ngày" → 7 | "14" → 14 */
function parseDurationDays(dur?: string): number {
  if (!dur) return 0;
  const match = dur.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/** Calculate daily total from dose schedule */
function calcDailyTotal(m: MedicineBlockState): number {
  return (m.morningEnabled ? (m.morningDose || 0) : 0)
    + (m.noonEnabled ? (m.noonDose || 0) : 0)
    + (m.afternoonEnabled ? (m.afternoonDose || 0) : 0)
    + (m.eveningEnabled ? (m.eveningDose || 0) : 0);
}

/** Auto-derive frequency string from schedule */
function deriveFrequency(m: MedicineBlockState): string {
  const count = [m.morningEnabled, m.noonEnabled, m.afternoonEnabled, m.eveningEnabled].filter(Boolean).length;
  if (count === 0) return '';
  if (count === 1) return 'Once daily';
  if (count === 2) return 'Twice daily';
  if (count === 3) return 'Three times daily';
  return 'Four times daily';
}

// ==================== PRESET FIELD COMPONENT ====================
function PresetsField({
  label, required, value, presets, onChange, placeholder, toggleable,
}: {
  label: string;
  required?: boolean;
  value: string;
  presets: string[];
  onChange: (v: string) => void;
  placeholder?: string;
  toggleable?: boolean;
}) {
  return (
    <div>
      <label className='mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300'>
        {label} {required && <span className='text-red-500'>*</span>}
      </label>
      <div className='mb-2 flex flex-wrap gap-1.5'>
        {presets.map((p) => (
          <button
            key={p}
            type='button'
            onClick={() => onChange(toggleable && value === p ? '' : p)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              value === p
                ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                : 'border-gray-300 text-gray-600 hover:border-brand-400 hover:text-brand-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:text-brand-400'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <input
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className='w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
      />
    </div>
  );
}

// ==================== MEDICINE BLOCK COMPONENT ====================
interface MedicineBlockProps {
  index: number;
  medicine: MedicineBlockState;
  onChange: (field: keyof MedicineBlockState, value: string | number | boolean | undefined | MedicationDTO) => void;
  onRemove: () => void;
  canRemove: boolean;
  onAddNew: () => void;
}

function MedicineBlock({ index, medicine, onChange, onRemove, canRemove, onAddNew }: MedicineBlockProps) {
  const [searchQuery, setSearchQuery] = useState(medicine.medicineName || '');
  const [searchResults, setSearchResults] = useState<MedicationDTO[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync search input label when selectedMedication is set
  useEffect(() => {
    if (medicine.selectedMedication) {
      const med = medicine.selectedMedication;
      setSearchQuery(`${med.name}${med.strength ? ` — ${med.strength}` : ''}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicine.selectedMedication?.id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      if (medicine.selectedMedication) {
        onChange('selectedMedication', undefined);
        onChange('medicineName', '');
        onChange('unit', '');
      }
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await medicationService.searchForDoctor(query, 0, 20);
        const q = query.toLowerCase();
        const filtered = result.content.filter((m) =>
          m.name.toLowerCase().startsWith(q) ||
          (m.genericName ?? '').toLowerCase().startsWith(q)
        );
        setSearchResults(filtered.slice(0, 10));
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelectMedication = (med: MedicationDTO) => {
    setShowDropdown(false);
    onChange('selectedMedication', med);
    onChange('medicineName', `${med.name}${med.strength ? ` ${med.strength}` : ''}`);
    onChange('unit', med.unit || '');
  };

  const stockInfo = (() => {
    if (!medicine.selectedMedication) return null;
    const qty = medicine.selectedMedication.availableQuantity;
    const unit = medicine.selectedMedication.unit || 'units';
    if (qty === 0)
      return { label: 'Out of stock', badgeCls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    if (qty <= 20)
      return { label: `Low stock: only ${qty} ${unit} left`, badgeCls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
    return { label: `Available: ${qty} ${unit}`, badgeCls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
  })();

  const quantityExceedsStock =
    medicine.selectedMedication != null &&
    medicine.quantity != null &&
    medicine.quantity > medicine.selectedMedication.availableQuantity;

  const isOutOfStock = medicine.selectedMedication?.availableQuantity === 0;

  return (
    <div
      className={`rounded-xl border p-5 dark:border-gray-700 ${
        isOutOfStock
          ? 'border-red-300 bg-red-50/40 dark:bg-red-900/10'
          : 'border-gray-200 bg-white dark:bg-gray-900'
      }`}
    >
      {/* Header */}
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center gap-2 flex-wrap'>
          <span className='flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold dark:bg-brand-900/30 dark:text-brand-300'>
            {index + 1}
          </span>
          <span className='text-sm font-semibold text-gray-800 dark:text-white'>
            {medicine.medicineName || `Medicine #${index + 1}`}
          </span>
          {stockInfo && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stockInfo.badgeCls}`}>
              {stockInfo.label}
            </span>
          )}
        </div>
        {canRemove && (
          <button
            type='button'
            onClick={onRemove}
            className='flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
          >
            ✕ Remove
          </button>
        )}
      </div>

      {/* ─── A. Search Medication ─── */}
      <div className='mb-4' ref={wrapperRef}>
        <p className='mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500'>
          A — Search Medication
        </p>
        <div className='relative'>
          <span className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>
            <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
            </svg>
          </span>
          <input
            type='text'
            value={searchQuery}
            data-medicine-search
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === ',') {
                e.preventDefault();
                setShowDropdown(false);
                onAddNew();
              }
            }}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            placeholder='Search medication… type , to add another'
            className='w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-10 pr-10 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
          />
          {searching && (
            <span className='absolute right-3 top-1/2 -translate-y-1/2'>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-brand-500' />
            </span>
          )}
          {/* Dropdown */}
          {showDropdown && (
            <div className='absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900'>
              <div className='max-h-64 overflow-y-auto'>
                {searchResults.length === 0 && !searching ? (
                  <p className='p-4 text-center text-sm text-gray-400'>No medications found</p>
                ) : (
                  searchResults.map((med) => {
                    const qty = med.availableQuantity;
                    const stockBadge =
                      qty === 0
                        ? { label: 'Out of stock', cls: 'bg-red-100 text-red-700' }
                        : qty <= 20
                        ? { label: `Low stock (${qty})`, cls: 'bg-amber-100 text-amber-700' }
                        : { label: `In stock: ${qty}`, cls: 'bg-green-100 text-green-700' };
                    return (
                      <button
                        key={med.id}
                        type='button'
                        onClick={() => qty > 0 && handleSelectMedication(med)}
                        title={qty === 0 ? 'Out of stock — cannot select' : undefined}
                        className={`flex w-full items-center justify-between border-b border-gray-100 px-4 py-3 text-left last:border-0 dark:border-gray-800 ${
                          qty === 0
                            ? 'cursor-not-allowed opacity-60'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className='min-w-0'>
                          <p className='truncate text-sm font-medium text-gray-900 dark:text-white'>
                            {med.name}{med.strength ? ` — ${med.strength}` : ''}
                          </p>
                          <p className='mt-0.5 text-xs text-gray-500'>
                            {[med.genericName, med.dosageForm, med.unit].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <span className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${stockBadge.cls}`}>
                          {stockBadge.label}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
        {/* Comma tip — outside relative wrapper so it doesn't shift the icon */}
        {medicine.selectedMedication && (
          <p className='mt-1.5 text-[11px] text-gray-400 dark:text-gray-500'>
            Tip: type <kbd className='rounded border border-gray-300 bg-gray-100 px-1 text-[10px] dark:border-gray-600 dark:bg-gray-800'>,</kbd> to quickly add another medicine
          </p>
        )}
      </div>
      {medicine.selectedMedication && (
        <div className='mb-4 rounded-lg border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-800 dark:bg-blue-900/10'>
          <p className='mb-2 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400'>
            B — Medication Info (readonly)
          </p>
          <div className='grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-3'>
            {[
              { label: 'Name', val: medicine.selectedMedication.name },
              { label: 'Active Ingredient', val: medicine.selectedMedication.genericName || '—' },
              { label: 'Strength', val: medicine.selectedMedication.strength || '—' },
              { label: 'Form', val: medicine.selectedMedication.dosageForm || '—' },
              { label: 'Unit', val: medicine.selectedMedication.unit || '—' },
            ].map(({ label, val }) => (
              <div key={label}>
                <p className='text-[10px] text-gray-500 dark:text-gray-400'>{label}</p>
                <p className='text-xs font-semibold text-gray-800 dark:text-white'>{val}</p>
              </div>
            ))}
            <div>
              <p className='text-[10px] text-gray-500 dark:text-gray-400'>In Stock</p>
              <p
                className={`text-xs font-bold ${
                  medicine.selectedMedication.availableQuantity === 0
                    ? 'text-red-600'
                    : medicine.selectedMedication.availableQuantity <= 20
                    ? 'text-amber-600'
                    : 'text-green-600'
                }`}
              >
                {medicine.selectedMedication.availableQuantity}{' '}
                {medicine.selectedMedication.unit || 'units'}
                {medicine.selectedMedication.availableQuantity === 0 && ' — Out of stock'}
                {medicine.selectedMedication.availableQuantity > 0 &&
                  medicine.selectedMedication.availableQuantity <= 20 &&
                  ' — Low stock'}
              </p>
            </div>
          </div>
          {isOutOfStock && (
            <p className='mt-2 rounded-md bg-red-100 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400'>
              ⚠️ This medication is currently out of stock. Please restock before prescribing.
            </p>
          )}
        </div>
      )}

      {/* ─── C. Quick Prescription ─── */}
      <div>
        <p className='mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500'>
          C — Quick Prescription
        </p>
        <div className='space-y-4'>
          {/* 1. Dosage (strength info) */}
          <PresetsField
            label='Dosage'
            required
            value={medicine.dosage}
            presets={DOSAGE_PRESETS}
            onChange={(v) => onChange('dosage', v)}
            placeholder='Or type custom dosage, e.g. 500mg, 2 tablets...'
          />

          {/* 2. Daily Dose Schedule */}
          <div>
            <label className='mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300'>
              Daily Dose Schedule <span className='text-red-500'>*</span>
            </label>
            <div className='rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
              {/* Table header */}
              <div className='grid grid-cols-[1fr_auto_120px] items-center gap-2 bg-gray-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:bg-gray-800 dark:text-gray-400'>
                <span>Session</span>
                <span className='text-center w-10'>Select</span>
                <span className='text-center'>Dose</span>
              </div>
              {/* Session rows */}
              {DOSE_SESSIONS.map(({ key, label, enabledKey, doseKey }) => {
                const enabled = !!(medicine as unknown as Record<string, unknown>)[enabledKey];
                const doseVal = ((medicine as unknown as Record<string, unknown>)[doseKey] as number) || 0;
                return (
                  <div
                    key={key}
                    className={`grid grid-cols-[1fr_auto_120px] items-center gap-2 border-t border-gray-100 px-3 py-2.5 dark:border-gray-800 ${
                      enabled ? 'bg-brand-50/30 dark:bg-brand-900/10' : ''
                    }`}
                  >
                    <span className={`text-sm ${enabled ? 'font-medium text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {label}
                    </span>
                    <div className='flex justify-center w-10'>
                      <input
                        type='checkbox'
                        checked={enabled}
                        onChange={(e) => {
                          onChange(enabledKey as keyof MedicineBlockState, e.target.checked);
                          if (!e.target.checked) {
                            onChange(doseKey as keyof MedicineBlockState, 0);
                          } else if (doseVal === 0) {
                            onChange(doseKey as keyof MedicineBlockState, 1);
                          }
                        }}
                        className='h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600'
                      />
                    </div>
                    <input
                      type='number'
                      min='0'
                      step='0.5'
                      disabled={!enabled}
                      value={enabled ? doseVal : 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onChange(doseKey as keyof MedicineBlockState, isNaN(val) ? 0 : Math.max(0, val));
                      }}
                      className={`w-full rounded-md border px-2.5 py-1.5 text-center text-sm focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white ${
                        enabled
                          ? 'border-gray-300 focus:border-brand-400 focus:ring-brand-500/20 dark:border-gray-600'
                          : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-gray-600'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
            {/* Validation: must select at least one session */}
            {![medicine.morningEnabled, medicine.noonEnabled, medicine.afternoonEnabled, medicine.eveningEnabled].some(Boolean) && (
              <p className='mt-1.5 text-xs text-amber-600 dark:text-amber-400'>
                ⚠ Please select at least one dosing time
              </p>
            )}
            {/* Auto-derived frequency */}
            {[medicine.morningEnabled, medicine.noonEnabled, medicine.afternoonEnabled, medicine.eveningEnabled].some(Boolean) && (
              <p className='mt-1.5 text-xs text-gray-500 dark:text-gray-400'>
                Frequency: <span className='font-semibold text-gray-700 dark:text-gray-200'>{deriveFrequency(medicine)}</span>
              </p>
            )}
          </div>

          {/* 3. Duration */}
          <PresetsField
            label='Duration'
            value={medicine.duration || ''}
            presets={DURATION_PRESETS}
            onChange={(v) => onChange('duration', v)}
            placeholder='Or type custom duration, e.g. 10 days...'
          />

          {/* 4. Auto-Calculated Quantity Summary */}
          {(() => {
            const dailyTotal = calcDailyTotal(medicine);
            const durationDays = parseDurationDays(medicine.duration);
            const autoQty = dailyTotal * durationDays;
            const unit = medicine.selectedMedication?.unit || medicine.unit || 'units';
            const showAutoCalc = dailyTotal > 0 && durationDays > 0;
            return (
              <div>
                {showAutoCalc && !medicine.quantityOverride && (
                  <div className='mb-3 rounded-lg border border-green-200 bg-green-50/60 p-3 dark:border-green-800 dark:bg-green-900/10'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-xs text-gray-600 dark:text-gray-400'>
                          Daily total: <span className='font-bold text-gray-800 dark:text-white'>{dailyTotal} {unit}/day</span>
                        </p>
                        <p className='text-xs text-gray-600 dark:text-gray-400'>
                          Duration: <span className='font-bold text-gray-800 dark:text-white'>{durationDays} days</span>
                        </p>
                        <p className='mt-1 text-sm font-bold text-green-700 dark:text-green-400'>
                          Total quantity: {autoQty} {unit}
                        </p>
                      </div>
                      <button
                        type='button'
                        onClick={() => onChange('quantityOverride', true)}
                        className='shrink-0 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                      >
                        Override
                      </button>
                    </div>
                  </div>
                )}
                {/* Manual quantity input (shown when override or auto-calc not available) */}
                {(medicine.quantityOverride || !showAutoCalc) && (
                  <div>
                    <label className='mb-1.5 flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300'>
                      Quantity
                      {medicine.quantityOverride && showAutoCalc && (
                        <button
                          type='button'
                          onClick={() => onChange('quantityOverride', false)}
                          className='text-[10px] font-medium text-brand-500 hover:underline'
                        >
                          ← Back to auto-calc ({autoQty} {unit})
                        </button>
                      )}
                    </label>
                    <div className='flex items-center gap-3'>
                      <input
                        type='number'
                        min='1'
                        value={medicine.quantity ?? ''}
                        onChange={(e) =>
                          onChange('quantity', e.target.value ? parseInt(e.target.value) : undefined)
                        }
                        placeholder='Enter quantity'
                        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white ${
                          quantityExceedsStock
                            ? 'border-red-400 bg-red-50 focus:ring-red-300 dark:border-red-700 dark:bg-red-900/20'
                            : 'border-gray-300 focus:border-brand-400 focus:ring-brand-500/20 dark:border-gray-600'
                        }`}
                      />
                      {medicine.selectedMedication && (
                        <div className='shrink-0 text-right text-xs'>
                          <p className='text-gray-500'>
                            Unit:{' '}
                            <span className='font-semibold text-gray-700 dark:text-gray-200'>
                              {medicine.selectedMedication.unit || '—'}
                            </span>
                          </p>
                          <p className='text-gray-500'>
                            Available:{' '}
                            <span
                              className={`font-bold ${
                                medicine.selectedMedication.availableQuantity === 0
                                  ? 'text-red-600'
                                  : medicine.selectedMedication.availableQuantity <= 20
                                  ? 'text-amber-600'
                                  : 'text-green-600'
                              }`}
                            >
                              {medicine.selectedMedication.availableQuantity}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                    {quantityExceedsStock && (
                      <p className='mt-1.5 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400'>
                        ⚠️ Requested quantity exceeds available stock. Only{' '}
                        {medicine.selectedMedication!.availableQuantity}{' '}
                        {medicine.selectedMedication!.unit || 'units'} remaining.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* 5. Instructions */}
          <PresetsField
            label='Instructions'
            value={medicine.instructions || ''}
            presets={INSTRUCTION_PRESETS}
            onChange={(v) => onChange('instructions', v)}
            placeholder='Or type custom instructions...'
            toggleable
          />

          {/* 6. Notes */}
          <div>
            <label className='mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300'>
              Notes{' '}
              <span className='font-normal text-gray-400'>(optional)</span>
            </label>
            <input
              type='text'
              value={medicine.notes || ''}
              onChange={(e) => onChange('notes', e.target.value)}
              placeholder='Additional notes for this medicine...'
              className='w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DoctorPrescriptionsCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, showToast, dismissToast } = useToast();

  const consultationData = (location.state as ConsultationData) || {};

  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<PrescriptionForm>({
    patientId: consultationData.patientId || 0,
    appointmentId: consultationData.appointmentId,
    prescriptionDate: new Date().toISOString().split('T')[0],
    diagnosis: consultationData.diagnosis || '',
    notes: consultationData.notes || consultationData.followUpInstructions || '',
    followUpDate: consultationData.followUpDate || '',
    items: [],
  });

  const [medicines, setMedicines] = useState<MedicineBlockState[]>(
    consultationData.templateItems?.length
      ? consultationData.templateItems.map((t) => newBlock(t))
      : [newBlock()]
  );

  const handleFormChange = (
    field: keyof PrescriptionForm,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMedicineChange = (
    index: number,
    field: keyof MedicineBlockState,
    value: string | number | undefined | MedicationDTO | boolean
  ) => {
    setMedicines((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // Auto-derive frequency from schedule
      const doseFields: Array<keyof MedicineBlockState> = [
        'morningEnabled', 'noonEnabled', 'afternoonEnabled', 'eveningEnabled',
        'morningDose', 'noonDose', 'afternoonDose', 'eveningDose',
      ];
      if (doseFields.includes(field) || field === 'duration') {
        item.frequency = deriveFrequency(item);
        // Auto-calculate quantity if not overridden
        if (!item.quantityOverride) {
          const daily = calcDailyTotal(item);
          const days = parseDurationDays(item.duration);
          item.quantity = daily > 0 && days > 0 ? Math.ceil(daily * days) : undefined;
        }
      }
      if (field === 'quantityOverride' && value === false) {
        const daily = calcDailyTotal(item);
        const days = parseDurationDays(item.duration);
        item.quantity = daily > 0 && days > 0 ? Math.ceil(daily * days) : undefined;
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleAddMedicine = () => {
    setMedicines((prev) => [...prev, newBlock()]);
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('[data-medicine-search]');
      const last = inputs[inputs.length - 1];
      if (last) {
        last.scrollIntoView({ behavior: 'smooth', block: 'center' });
        last.focus();
      }
    }, 50);
  };

  const handleRemoveMedicine = (index: number) => {
    if (medicines.length > 1) {
      setMedicines((prev) => prev.filter((_, i) => i !== index));
    } else {
      showToast('❌ At least one medicine is required', 'error');
    }
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validation
      if (!formData.patientId) {
        showToast('❌ Patient ID is missing', 'error');
        return;
      }

      // Check if all medicines have required fields
      const invalidMedicines = medicines.some(
        (m) => !m.medicineName.trim() || !m.dosage.trim()
      );
      if (invalidMedicines) {
        showToast(
          '❌ Please fill in all required fields for medicines (name, dosage)',
          'error'
        );
        return;
      }

      // Check dose schedule — at least one session must be selected
      const noSchedule = medicines.some(
        (m) => ![m.morningEnabled, m.noonEnabled, m.afternoonEnabled, m.eveningEnabled].some(Boolean)
      );
      if (noSchedule) {
        showToast(
          '❌ Please select at least one dosing time for each medicine',
          'error'
        );
        return;
      }

      // Block if any selected medication is out of stock
      const outOfStockItem = medicines.find(
        (m) => m.selectedMedication?.availableQuantity === 0
      );
      if (outOfStockItem) {
        showToast(
          `❌ "${outOfStockItem.medicineName}" is out of stock. Please select a different medication.`,
          'error'
        );
        return;
      }

      // Block if any quantity exceeds available stock
      const overStockItem = medicines.find(
        (m) =>
          m.selectedMedication != null &&
          m.quantity != null &&
          m.quantity > m.selectedMedication.availableQuantity
      );
      if (overStockItem) {
        showToast(
          `❌ Quantity for "${overStockItem.medicineName}" exceeds available stock (only ${overStockItem.selectedMedication!.availableQuantity} ${overStockItem.selectedMedication!.unit || 'units'} remaining).`,
          'error'
        );
        return;
      }

      setCreating(true);
      showToast('💊 Creating prescription...', 'info');

      try {
        const prescriptionDto: PrescriptionCreateDTO = {
          patientId: formData.patientId,
          appointmentId: formData.appointmentId,
          prescriptionDate: formData.prescriptionDate
            ? new Date(formData.prescriptionDate).toISOString().split('T')[0]
            : undefined,
          diagnosis: formData.diagnosis || undefined,
          notes: formData.notes || undefined,
          followUpDate: formData.followUpDate
            ? new Date(formData.followUpDate).toISOString().split('T')[0]
            : undefined,
          items: medicines.map(({ selectedMedication: _sel, _key: _k, morningEnabled: _me, noonEnabled: _ne, afternoonEnabled: _ae, eveningEnabled: _ee, quantityOverride: _qo, ...item }) => ({
            ...item,
            medicationId: _sel?.id,
          })),
        };

        const result =
          await prescriptionService.createPrescription(prescriptionDto);

        showToast(
          `✅ Prescription created successfully (ID: ${result.id})`,
          'success'
        );

        // Navigate to prescription view or back
        setTimeout(() => {
          navigate('/doctor/prescriptions', {
            state: { justCreated: result.id },
          });
        }, 1500);
      } catch (error) {
        console.error('Error creating prescription:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        showToast(`❌ Failed to create prescription: ${errorMessage}`, 'error');
      } finally {
        setCreating(false);
      }
    },
    [formData, medicines, showToast, navigate]
  );

  return (
    <>
      <PageMeta
        title='Create Prescription | Doctor Panel'
        description='Create a new prescription'
      />
      <PageBreadcrumb pageTitle='Create Prescription' />

      <div className='space-y-6'>
        {/* Show info message if not accessed from consultation page */}
        {!consultationData.patientId && (
          <DirectAccessInfo
            onNavigateToConsultation={() => navigate('/doctor/consultation')}
          />
        )}

        {/* Only show form if consultation data is available */}
        {consultationData.patientId && (
          <>
            {/* Context banner */}
            {consultationData.reissueMode ? (
              <div className='rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/10'>
                <div className='mb-3 flex items-center gap-3'>
                  <span className='text-xl'>📋</span>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                    Reissuing Prescription
                  </h3>
                  <span className='inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'>
                    {consultationData.reissueFromCode}
                  </span>
                </div>
                <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>
                  Review and adjust the details below, then click <strong>Sign</strong> to issue the new prescription.
                </p>
                <div>
                  <p className='text-xs font-medium text-gray-600 dark:text-gray-400'>Patient</p>
                  <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                    {consultationData.patientName || 'N/A'}
                  </p>
                </div>
              </div>
            ) : (
              consultationData.patientId && (
                <div className='rounded-lg border border-brand-200 bg-brand-50 p-6 dark:border-brand-900 dark:bg-brand-900/10'>
                  <div className='mb-4 flex items-center justify-between'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                      📋 Consultation Summary
                    </h3>
                    <span className='inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300'>
                      Just Finalized
                    </span>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <p className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                        Patient
                      </p>
                      <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                        {consultationData.patientName || 'N/A'}
                      </p>
                    </div>
                    {consultationData.appointmentId && (
                      <div>
                        <p className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                          Appointment ID
                        </p>
                        <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                          #{consultationData.appointmentId}
                        </p>
                      </div>
                    )}
                    {consultationData.diagnosis && (
                      <div className='md:col-span-2'>
                        <p className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                          Diagnosis
                        </p>
                        <p className='text-sm text-gray-900 dark:text-white'>
                          {consultationData.diagnosis}
                        </p>
                      </div>
                    )}
                    {consultationData.followUpInstructions && (
                      <div className='md:col-span-2'>
                        <p className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                          Follow-up Instructions
                        </p>
                        <p className='text-sm text-gray-900 dark:text-white'>
                          {consultationData.followUpInstructions}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Prescription Form */}
            <div className='rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-800 dark:bg-gray-900'>
              <div className='border-b border-gray-200 px-6 py-4 dark:border-gray-700'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  {consultationData.reissueMode ? 'Reissue Prescription' : 'New Prescription'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className='space-y-6 p-6'>
                {/* Basic Info */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Patient ID
                    </label>
                    <input
                      type='number'
                      value={formData.patientId}
                      onChange={(e) =>
                        handleFormChange(
                          'patientId',
                          parseInt(e.target.value) || 0
                        )
                      }
                      disabled
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 text-gray-600 cursor-not-allowed'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Prescription Date
                    </label>
                    <input
                      type='date'
                      value={formData.prescriptionDate}
                      onChange={(e) =>
                        handleFormChange('prescriptionDate', e.target.value)
                      }
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Follow-up Date (optional)
                    </label>
                    <input
                      type='date'
                      value={formData.followUpDate}
                      onChange={(e) =>
                        handleFormChange('followUpDate', e.target.value)
                      }
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500'
                    />
                  </div>
                </div>

                {/* Diagnosis */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Diagnosis
                  </label>
                  <textarea
                    value={formData.diagnosis}
                    onChange={(e) =>
                      handleFormChange('diagnosis', e.target.value)
                    }
                    rows={3}
                    placeholder='Confirm or modify the diagnosis from consultation'
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500'
                  />
                </div>

                {/* Medicines */}
                <div>
                  <div className='mb-4 flex items-center justify-between'>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Prescribed Medicines{' '}
                      <span className='text-red-600'>*</span>
                    </label>
                    <span className='text-xs text-gray-600 dark:text-gray-400'>
                      {medicines.length} medicine(s)
                    </span>
                  </div>

                  <div className='space-y-4'>
                    {medicines.map((medicine, index) => (
                      <MedicineBlock
                        key={medicine._key}
                        index={index}
                        medicine={medicine}
                        onChange={(field, value) =>
                          handleMedicineChange(index, field, value)
                        }
                        onRemove={() => handleRemoveMedicine(index)}
                        canRemove={medicines.length > 1}
                        onAddNew={handleAddMedicine}
                      />
                    ))}
                  </div>

                  <button
                    type='button'
                    onClick={handleAddMedicine}
                    disabled={creating}
                    className='mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-300 py-3 text-sm font-medium text-brand-600 transition-colors hover:border-brand-400 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-400 dark:hover:border-brand-500 dark:hover:bg-brand-900/10 disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                    </svg>
                    Add Another Medicine
                  </button>
                </div>

                {/* Notes */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Additional Notes (optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    rows={3}
                    placeholder='Additional instructions or notes for the patient'
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500'
                  />
                </div>

                {/* Actions */}
                <div className='flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700 pt-6'>
                  <button
                    type='button'
                    onClick={() => navigate(-1)}
                    disabled={creating}
                    className='px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={creating || medicines.length === 0}
                    className='px-6 py-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-800 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {creating
                      ? consultationData.reissueMode ? 'Signing…' : 'Creating...'
                      : consultationData.reissueMode ? '✍️ Sign' : '💊 Create Prescription'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}

// Direct access info component - shown when page is opened directly
function DirectAccessInfo({
  onNavigateToConsultation,
}: {
  onNavigateToConsultation: () => void;
}) {
  const { showToast } = useToast();

  const handleNavigate = () => {
    showToast('📋 Opening Consultation page...', 'info');
    onNavigateToConsultation();
  };

  return (
    <div className='p-8'>
      <div className='max-w-md mx-auto'>
        <div className='rounded-lg border-2 border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-900/20'>
          {/* Icon */}
          <div className='mb-4 flex justify-center'>
            <svg
              className='h-12 w-12 text-amber-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4v2m0 4v2M9 5h6a2 2 0 012 2v1h2a2 2 0 012 2v3a2 2 0 01-2 2h-2v1a2 2 0 01-2 2H9a2 2 0 01-2-2v-1H5a2 2 0 01-2-2V9a2 2 0 012-2h2V7a2 2 0 012-2z'
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className='mb-2 text-center text-lg font-semibold text-gray-900 dark:text-white'>
            Consultation Required
          </h2>

          {/* Message */}
          <p className='mb-6 text-center text-sm text-gray-700 dark:text-gray-300'>
            To create a prescription, you must first create and finalize a{' '}
            <strong>consultation</strong> for the patient. This will allow you
            to link the prescription to the consultation and auto-fill medical
            information.
          </p>

          {/* Instructions */}
          <div className='mb-6 rounded-lg bg-white p-4 dark:bg-gray-800'>
            <h3 className='mb-3 text-sm font-medium text-gray-900 dark:text-white'>
              Steps to follow:
            </h3>
            <ol className='space-y-2 text-sm text-gray-700 dark:text-gray-300'>
              <li className='flex gap-2'>
                <span className='flex-shrink-0 font-semibold text-amber-600'>
                  1
                </span>
                <span>
                  Go to <strong>Consultation</strong> from the sidebar
                </span>
              </li>
              <li className='flex gap-2'>
                <span className='flex-shrink-0 font-semibold text-amber-600'>
                  2
                </span>
                <span>Fill in the consultation details for the patient</span>
              </li>
              <li className='flex gap-2'>
                <span className='flex-shrink-0 font-semibold text-amber-600'>
                  3
                </span>
                <span>
                  Click <strong>Finalize & Sign</strong> to save the
                  consultation
                </span>
              </li>
              <li className='flex gap-2'>
                <span className='flex-shrink-0 font-semibold text-amber-600'>
                  4
                </span>
                <span>
                  Click <strong>Create Prescription Now</strong> in the success
                  modal
                </span>
              </li>
            </ol>
          </div>

          {/* Navigation */}
          <button
            onClick={handleNavigate}
            className='w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800'
          >
            Go to Consultation Page
          </button>
        </div>
      </div>
    </div>
  );
}
