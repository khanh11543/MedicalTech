import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import medicationService, {
  MedicationDTO,
  MedicationCreateDTO,
  MedicationUpdateDTO,
  InventoryUpdateDTO,
  MedicationImportResultDTO,
} from "../../services/medicationService";

// ==================== ICONS ====================
const SearchIcon = () => (
  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const PlusIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);
const EditIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const InventoryIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const RefreshIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);
const UploadIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
  </svg>
);
const FilterIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);
const PillIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);
const XIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const ChevronLeftIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// ==================== STAT CARD ====================
function StatCard({ title, value, icon, color, subtitle }: {
  title: string; value: string | number; icon: React.ReactNode;
  color: string; subtitle?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 flex items-center gap-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color} text-white`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-xl font-bold text-gray-800 dark:text-white truncate">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ==================== CREATE / EDIT MODAL ====================
interface MedFormProps {
  initial?: MedicationDTO | null;
  onClose: () => void;
  onSave: (data: MedicationCreateDTO | MedicationUpdateDTO) => void;
  loading: boolean;
  dynamicOptions?: {
    brandNames: string[];
    manufacturers: string[];
    genericNames: string[];
  };
}

const DOSAGE_FORM_OPTIONS = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Cream",
  "Ointment",
  "Drops",
  "Powder",
  "Solution",
  "Inhaler",
  "Suppository",
];

const UNIT_OPTIONS = [
  "Tablet",
  "Capsule",
  "Bottle",
  "Box",
  "Pack",
  "Sachet",
  "Vial",
  "Ampoule",
  "Tube",
  "Blister",
  "Dropper Bottle",
  "Inhaler",
  "mL",
  "mg",
  "g",
];

const CATEGORY_OPTIONS = [
  "Painkiller",
  "Antibiotic",
  "Antiviral",
  "Antifungal",
  "Anti-inflammatory",
  "Antihistamine",
  "Gastrointestinal",
  "Cardiovascular",
  "Respiratory",
  "Endocrine",
  "Dermatology",
  "Vitamin/Supplement",
  "Other",
];

function MedicationFormModal({ initial, onClose, onSave, loading, dynamicOptions }: MedFormProps) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    code: initial?.code ?? "",
    name: initial?.name ?? "",
    genericName: initial?.genericName ?? "",
    brandName: initial?.brandName ?? "",
    category: initial?.category ?? "",
    dosageForm: initial?.dosageForm ?? "",
    strength: initial?.strength ?? "",
    unit: initial?.unit ?? "",
    manufacturer: initial?.manufacturer ?? "",
    description: initial?.description ?? "",
    sideEffects: initial?.sideEffects ?? "",
    requiresPrescription: initial?.requiresPrescription ?? true,
    unitPrice: initial?.unitPrice?.toString() ?? "",
    initialQuantity: "0",
  });

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const brandDatalistId = isEdit ? `brand-list-${initial!.id}` : "brand-list-new";
  const manufacturerDatalistId = isEdit ? `manufacturer-list-${initial!.id}` : "manufacturer-list-new";
  const genericDatalistId = isEdit ? `generic-list-${initial!.id}` : "generic-list-new";

  useEffect(() => {
    if (isEdit) return;
    let mounted = true;
    medicationService.getNextCode()
      .then((code) => {
        if (!mounted) return;
        setForm((prev) => ({ ...prev, code: code || prev.code }));
      })
      .catch(() => {
        // fallback: allow manual display placeholder if API fails
      });
    return () => { mounted = false; };
  }, [isEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (!isEdit && !form.code.trim()) { toast.error("Code is not ready yet"); return; }

    const payload: any = {
      name: form.name,
      genericName: form.genericName || undefined,
      brandName: form.brandName || undefined,
      category: form.category || undefined,
      dosageForm: form.dosageForm || undefined,
      strength: form.strength || undefined,
      unit: form.unit || undefined,
      manufacturer: form.manufacturer || undefined,
      description: form.description || undefined,
      sideEffects: form.sideEffects || undefined,
      requiresPrescription: form.requiresPrescription,
      unitPrice: form.unitPrice ? parseFloat(form.unitPrice) : undefined,
    };
    if (!isEdit) {
      payload.code = form.code;
      payload.initialQuantity = parseInt(form.initialQuantity) || 0;
    }
    onSave(payload);
  };

  const inputCls = "w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white";
  const labelCls = "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";
  const selectCls = inputCls;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {isEdit ? `Edit: ${initial!.name}` : "Add New Medication"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Code — only on create */}
            {!isEdit && (
              <div>
                <label className={labelCls}>Code <span className="text-red-500">*</span></label>
                <input
                  className={`${inputCls} bg-gray-100 dark:bg-gray-800`}
                  value={form.code}
                  placeholder="Generating..."
                  readOnly
                  disabled
                />
                <p className="mt-1 text-xs text-gray-400">Auto-generated from database</p>
              </div>
            )}
            <div className={isEdit ? "sm:col-span-2" : ""}>
              <label className={labelCls}>Name <span className="text-red-500">*</span></label>
              <input className={inputCls} value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="e.g. Paracetamol 500mg" required />
            </div>
            <div>
              <label className={labelCls}>Generic Name</label>
              <input
                className={inputCls}
                value={form.genericName}
                list={genericDatalistId}
                onChange={e => set("genericName", e.target.value)}
                placeholder="Search/select..."
              />
              <datalist id={genericDatalistId}>
                {(dynamicOptions?.genericNames ?? []).map(v => <option key={v} value={v} />)}
              </datalist>
            </div>
            <div>
              <label className={labelCls}>Brand Name</label>
              <input
                className={inputCls}
                value={form.brandName}
                list={brandDatalistId}
                onChange={e => set("brandName", e.target.value)}
                placeholder="Search/select..."
              />
              <datalist id={brandDatalistId}>
                {(dynamicOptions?.brandNames ?? []).map(v => <option key={v} value={v} />)}
              </datalist>
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select className={selectCls} value={form.category} onChange={e => set("category", e.target.value)}>
                <option value="">—</option>
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Dosage Form</label>
              <select className={selectCls} value={form.dosageForm} onChange={e => set("dosageForm", e.target.value)}>
                <option value="">—</option>
                {DOSAGE_FORM_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Strength</label>
              <input className={inputCls} value={form.strength} onChange={e => set("strength", e.target.value)}
                placeholder="e.g. 500mg, 250mg/5ml" />
            </div>
            <div>
              <label className={labelCls}>Unit</label>
              <select className={selectCls} value={form.unit} onChange={e => set("unit", e.target.value)}>
                <option value="">—</option>
                {UNIT_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Manufacturer</label>
              <input
                className={inputCls}
                value={form.manufacturer}
                list={manufacturerDatalistId}
                onChange={e => set("manufacturer", e.target.value)}
                placeholder="Search/select..."
              />
              <datalist id={manufacturerDatalistId}>
                {(dynamicOptions?.manufacturers ?? []).map(v => <option key={v} value={v} />)}
              </datalist>
            </div>
            <div>
              <label className={labelCls}>Unit Price (VNĐ)</label>
              <input className={inputCls} type="number" min="0" value={form.unitPrice}
                onChange={e => set("unitPrice", e.target.value)} placeholder="0" />
            </div>
            {!isEdit && (
              <div>
                <label className={labelCls}>Initial Quantity</label>
                <input className={inputCls} type="number" min="0" value={form.initialQuantity}
                  onChange={e => set("initialQuantity", e.target.value)} placeholder="0" />
              </div>
            )}
            <div className="flex items-center gap-3 sm:col-span-2">
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="sr-only" checked={form.requiresPrescription}
                  onChange={e => set("requiresPrescription", e.target.checked)} />
                <div className={`h-6 w-11 rounded-full transition-colors ${form.requiresPrescription ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                  <div className={`h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ml-0.5 ${form.requiresPrescription ? "translate-x-5" : "translate-x-0"}`} />
                </div>
              </label>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Requires Prescription</span>
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea className={inputCls} rows={2} value={form.description}
              onChange={e => set("description", e.target.value)} placeholder="Short description..." />
          </div>
          <div>
            <label className={labelCls}>Side Effects</label>
            <textarea className={inputCls} rows={2} value={form.sideEffects}
              onChange={e => set("sideEffects", e.target.value)} placeholder="Known side effects..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Medication"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== INVENTORY MODAL ====================
interface InventoryModalProps {
  medication: MedicationDTO;
  onClose: () => void;
  onSave: (data: InventoryUpdateDTO) => void;
  loading: boolean;
}

function InventoryModal({ medication, onClose, onSave, loading }: InventoryModalProps) {
  const [type, setType] = useState<"IMPORT" | "ADJUST">("IMPORT");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) { toast.error("Quantity must be a non-negative number"); return; }
    if (type === "IMPORT" && qty === 0) { toast.error("Import quantity must be greater than 0"); return; }
    const newQty = type === "IMPORT" ? medication.availableQuantity + qty : qty;
    if (newQty < 0) { toast.error("Resulting quantity cannot be negative"); return; }
    onSave({ type, quantity: qty, note: note || undefined });
  };

  const inputCls = "w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

  const preview = quantity !== "" && !isNaN(parseInt(quantity))
    ? (type === "IMPORT"
      ? medication.availableQuantity + parseInt(quantity)
      : parseInt(quantity))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Update Inventory</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"><XIcon /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Medication info */}
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
            <p className="text-sm font-semibold text-gray-800 dark:text-white">{medication.name}</p>
            <p className="text-xs text-gray-500">{medication.code} · {medication.category}</p>
            <p className="mt-1 text-sm">
              Current stock: <span className={`font-bold ${medication.availableQuantity <= 10 ? "text-red-500" : "text-green-600"}`}>
                {medication.availableQuantity} {medication.unit || "units"}
              </span>
            </p>
          </div>

          {/* Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Operation Type</label>
            <div className="flex gap-3">
              {(["IMPORT", "ADJUST"] as const).map(t => (
                <button key={t} type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-colors ${
                    type === t
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400"
                  }`}>
                  {t === "IMPORT" ? "📦 Import (+)" : "🔧 Adjust (=)"}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {type === "IMPORT" ? "Adds to current stock" : "Sets stock to exact value"}
            </p>
          </div>

          {/* Quantity */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input className={inputCls} type="number" min="0" value={quantity}
              onChange={e => setQuantity(e.target.value)} placeholder="Enter quantity" required />
            {preview !== null && (
              <p className={`mt-1 text-xs ${preview < 0 ? "text-red-500" : "text-green-600"}`}>
                New stock: <strong>{preview}</strong> {medication.unit || "units"}
                {preview < 0 && " — ❌ Cannot be negative!"}
              </p>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Note (optional)</label>
            <input className={inputCls} value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. Nhập từ nhà cung cấp XYZ" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="rounded-lg bg-green-500 px-5 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-60">
              {loading ? "Saving..." : "Update Inventory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== IMPORT MODAL ====================
function ImportMedicationModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: (result: MedicationImportResultDTO) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const importMut = useMutation({
    mutationFn: (f: File) => medicationService.importFile(f),
    onSuccess: (res) => onImported(res),
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to import file"),
  });

  const inputCls =
    "w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Import Medications</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <XIcon />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
            <p className="font-medium">Accepted formats</p>
            <ul className="mt-1 list-disc pl-5 text-xs text-gray-600 dark:text-gray-400">
              <li>.csv (UTF-8)</li>
              <li>.xlsx</li>
            </ul>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Required columns: <span className="font-mono">code</span>, <span className="font-mono">name</span>.
              Optional: genericName, brandName, category, dosageForm, strength, unit, manufacturer, description, sideEffects, requiresPrescription, unitPrice, initialQuantity.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              File <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Selected: <span className="font-medium">{file.name}</span>
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!file || importMut.isPending}
              onClick={() => file && importMut.mutate(file)}
              className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {importMut.isPending ? "Importing..." : "Import"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function MedicationList() {
  const queryClient = useQueryClient();
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    requiresPrescription: "" as "" | "true" | "false",
    isActive: "" as "" | "true" | "false",
    sortBy: "name",
    sortDir: "ASC",
  });
  const [pagination, setPagination] = useState({ page: 0, size: 10 });

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<MedicationDTO | null>(null);
  const [inventoryTarget, setInventoryTarget] = useState<MedicationDTO | null>(null);
  const [showImport, setShowImport] = useState(false);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value }));
      setPagination(prev => ({ ...prev, page: 0 }));
    }, 500);
  }, []);

  useEffect(() => () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); }, []);

  // Query
  const { data, isLoading, error } = useQuery({
    queryKey: ["medications", filters, pagination],
    queryFn: () => medicationService.getAll({
      search: filters.search || undefined,
      category: filters.category || undefined,
      requiresPrescription: filters.requiresPrescription !== "" ? filters.requiresPrescription === "true" : undefined,
      isActive: filters.isActive !== "" ? filters.isActive === "true" : undefined,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
      page: pagination.page,
      size: pagination.size,
    }),
    retry: 1,
  });

  // Mutations
  const createMut = useMutation({
    mutationFn: (dto: any) => medicationService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      toast.success("Medication created successfully");
      setShowCreate(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create medication"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: MedicationUpdateDTO }) =>
      medicationService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      toast.success("Medication updated successfully");
      setEditTarget(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update medication"),
  });

  const inventoryMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: InventoryUpdateDTO }) =>
      medicationService.updateInventory(id, dto),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      toast.success(`Inventory updated. New stock: ${updated.availableQuantity}`);
      setInventoryTarget(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update inventory"),
  });

  const statusMut = useMutation({
    mutationFn: (id: number) => medicationService.toggleStatus(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      toast.success(`Medication ${updated.isActive ? "activated" : "deactivated"}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update status"),
  });

  const handleReset = () => {
    setSearchInput("");
    setFilters({ search: "", category: "", requiresPrescription: "", isActive: "", sortBy: "name", sortDir: "ASC" });
    setPagination({ page: 0, size: 10 });
  };

  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  // Stats computed from data
  const allItems = data?.content ?? [];
  const activeCount = allItems.filter(m => m.isActive).length;
  const lowStockCount = allItems.filter(m => m.availableQuantity <= 10).length;
  const rxCount = allItems.filter(m => m.requiresPrescription).length;

  const dynamicOptions = {
    brandNames: Array.from(new Set(allItems.map(m => (m.brandName || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    manufacturers: Array.from(new Set(allItems.map(m => (m.manufacturer || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    genericNames: Array.from(new Set(allItems.map(m => (m.genericName || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
  };

  const selectCls = "rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white";

  const handleImported = (res: MedicationImportResultDTO) => {
    const errCount = res.errors?.length ?? 0;
    toast.success(
      `Imported: ${res.successCount}/${res.totalRows} (created ${res.createdCount}, updated ${res.updatedCount}, skipped ${res.skippedCount})`
    );
    if (errCount > 0) {
      const preview = res.errors.slice(0, 3).map(e => `Row ${e.rowNumber}: ${e.message}`).join(" | ");
      toast.warning(`Some rows failed (${errCount}). ${preview}${errCount > 3 ? " ..." : ""}`);
    }
    setShowImport(false);
    queryClient.invalidateQueries({ queryKey: ["medications"] });
  };

  return (
    <>
      <PageMeta
        title="Medication Management | MedicalTech Dashboard"
        description="Manage medications catalog and inventory"
      />
      <PageBreadcrumb pageTitle="Medication Management" />

      <div className="space-y-6">
        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            <p className="font-bold">Error Loading Data</p>
            <p className="text-sm">{(error as any)?.response?.data?.message || (error as any)?.message || "Unknown error"}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard title="Total Medications" value={totalElements} icon={<PillIcon />} color="bg-blue-500" />
          <StatCard title="Active" value={activeCount} icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          } color="bg-green-500" />
          <StatCard title="Low Stock (≤10)" value={lowStockCount} icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          } color="bg-amber-500" />
          <StatCard title="Requires Rx" value={rxCount} icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          } color="bg-purple-500" />
        </div>

        {/* Filters & Table */}
        <ComponentCard title="Medications">
          {/* Toolbar */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2"><SearchIcon /></span>
              <input
                type="text"
                placeholder="Search name, code, generic name..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-transparent pl-10 pr-4 text-sm focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setShowFilters(v => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                <FilterIcon /> {showFilters ? "Hide" : "Filter"}
              </button>
              <button onClick={handleReset}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                <RefreshIcon /> Reset
              </button>
              <button onClick={() => setShowImport(true)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                <UploadIcon /> Import CSV/Excel
              </button>
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
                <PlusIcon /> Add Medication
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
                <select className={selectCls} value={filters.isActive}
                  onChange={e => { setFilters(p => ({ ...p, isActive: e.target.value as any })); setPagination(p => ({ ...p, page: 0 })); }}>
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Prescription Required</label>
                <select className={selectCls} value={filters.requiresPrescription}
                  onChange={e => { setFilters(p => ({ ...p, requiresPrescription: e.target.value as any })); setPagination(p => ({ ...p, page: 0 })); }}>
                  <option value="">All</option>
                  <option value="true">Required</option>
                  <option value="false">OTC</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Sort By</label>
                <select className={selectCls} value={filters.sortBy}
                  onChange={e => { setFilters(p => ({ ...p, sortBy: e.target.value })); setPagination(p => ({ ...p, page: 0 })); }}>
                  <option value="name">Name</option>
                  <option value="code">Code</option>
                  <option value="category">Category</option>
                  <option value="price">Price</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Direction</label>
                <select className={selectCls} value={filters.sortDir}
                  onChange={e => { setFilters(p => ({ ...p, sortDir: e.target.value })); setPagination(p => ({ ...p, page: 0 })); }}>
                  <option value="ASC">A → Z</option>
                  <option value="DESC">Z → A</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Category</label>
                <input
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={filters.category}
                  onChange={e => { setFilters(p => ({ ...p, category: e.target.value })); setPagination(p => ({ ...p, page: 0 })); }}
                  placeholder="e.g. Painkiller, Antibiotic..." />
              </div>
            </div>
          )}

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500" />
            </div>
          ) : allItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <PillIcon />
              <p className="mt-2 font-medium">No medications found</p>
              <p className="text-sm">Try adjusting filters or add a new medication</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Code</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Category</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Form / Strength</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Unit</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Price</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Stock</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Rx</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allItems.map((med) => (
                    <TableRow key={med.id}>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{med.code}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">{med.name}</p>
                          {med.genericName && (
                            <p className="text-xs text-gray-400">{med.genericName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="text-sm text-gray-600 dark:text-gray-300">{med.category || "—"}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <span>{med.dosageForm || "—"}</span>
                          {med.strength && <span className="ml-1 text-xs text-gray-400">({med.strength})</span>}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="text-sm">{med.unit || "—"}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="text-sm font-medium">
                          {med.unitPrice != null ? `${med.unitPrice.toLocaleString("vi-VN")} ₫` : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className={`text-sm font-bold ${
                          med.availableQuantity === 0 ? "text-red-600"
                          : med.availableQuantity <= 10 ? "text-amber-500"
                          : "text-green-600"
                        }`}>
                          {med.availableQuantity}
                          {med.availableQuantity === 0 && <span className="ml-1 text-xs">⚠️</span>}
                          {med.availableQuantity > 0 && med.availableQuantity <= 10 && <span className="ml-1 text-xs">🔶</span>}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        {med.requiresPrescription ? (
                          <Badge color="warning">Rx</Badge>
                        ) : (
                          <Badge color="success">OTC</Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        {med.isActive ? (
                          <Badge color="success">Active</Badge>
                        ) : (
                          <Badge color="error">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="flex items-center gap-1">
                          {/* Edit */}
                          <button
                            onClick={() => setEditTarget(med)}
                            title="Edit"
                            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            <EditIcon />
                          </button>
                          {/* Inventory */}
                          <button
                            onClick={() => setInventoryTarget(med)}
                            title="Update Inventory"
                            className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
                            <InventoryIcon />
                          </button>
                          {/* Toggle status */}
                          <button
                            onClick={() => statusMut.mutate(med.id)}
                            title={med.isActive ? "Deactivate" : "Activate"}
                            className={`rounded-lg p-1.5 ${med.isActive
                              ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                              : "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                            }`}>
                            {med.isActive ? (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalElements > 0 && (
            <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {pagination.page * pagination.size + 1}
                  </span>
                  {"–"}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {Math.min((pagination.page + 1) * pagination.size, totalElements)}
                  </span>
                  {" of "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">{totalElements}</span>
                  {" medications"}
                </p>
                <select
                  value={pagination.size}
                  onChange={e => setPagination({ page: 0, size: Number(e.target.value) })}
                  className="rounded-lg border border-gray-300 bg-transparent px-2 py-1 text-xs text-gray-600 focus:outline-none dark:border-gray-600 dark:text-gray-300 dark:bg-gray-900">
                  {[10, 20, 50].map(s => (
                    <option key={s} value={s}>{s} / page</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={pagination.page === 0}
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  className="flex h-8 items-center gap-1 rounded-lg border border-gray-300 px-2.5 text-sm disabled:opacity-40 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800">
                  <ChevronLeftIcon /> Prev
                </button>
                {(() => {
                  const pages: (number | "...")[] = [];
                  if (totalPages <= 7) {
                    for (let i = 0; i < totalPages; i++) pages.push(i);
                  } else {
                    pages.push(0);
                    if (pagination.page > 3) pages.push("...");
                    for (let i = Math.max(1, pagination.page - 1); i <= Math.min(totalPages - 2, pagination.page + 1); i++) pages.push(i);
                    if (pagination.page < totalPages - 4) pages.push("...");
                    pages.push(totalPages - 1);
                  }
                  return pages.map((p, i) =>
                    p === "..." ? (
                      <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-gray-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPagination(prev => ({ ...prev, page: p as number }))}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                          p === pagination.page
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                        }`}>
                        {(p as number) + 1}
                      </button>
                    )
                  );
                })()}
                <button
                  disabled={pagination.page + 1 >= totalPages}
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  className="flex h-8 items-center gap-1 rounded-lg border border-gray-300 px-2.5 text-sm disabled:opacity-40 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800">
                  Next <ChevronRightIcon />
                </button>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>

      {/* Modals */}
      {showCreate && (
        <MedicationFormModal
          onClose={() => setShowCreate(false)}
          onSave={(dto) => createMut.mutate(dto)}
          loading={createMut.isPending}
          dynamicOptions={dynamicOptions}
        />
      )}
      {editTarget && (
        <MedicationFormModal
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(dto) => updateMut.mutate({ id: editTarget.id, dto: dto as MedicationUpdateDTO })}
          loading={updateMut.isPending}
          dynamicOptions={dynamicOptions}
        />
      )}
      {inventoryTarget && (
        <InventoryModal
          medication={inventoryTarget}
          onClose={() => setInventoryTarget(null)}
          onSave={(dto) => inventoryMut.mutate({ id: inventoryTarget.id, dto })}
          loading={inventoryMut.isPending}
        />
      )}
      {showImport && (
        <ImportMedicationModal
          onClose={() => setShowImport(false)}
          onImported={handleImported}
        />
      )}
    </>
  );
}
