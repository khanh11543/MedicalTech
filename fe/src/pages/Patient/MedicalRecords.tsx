import { useEffect, useState, useCallback } from "react";
import PageMeta from "../../components/common/PageMeta";
import patientService, { type MedicalRecord } from "../../services/patientService";

export default function MedicalRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const result = await patientService.getMyRecords({ pageNumber: page, pageSize: 10 });
      setRecords(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (err) {
      console.error("Failed to load records:", err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const openDetail = async (id: number) => {
    try {
      const detail = await patientService.getRecordDetail(id);
      setSelectedRecord(detail);
    } catch (err) {
      console.error("Failed to load record detail:", err);
    }
  };

  return (
    <>
      <PageMeta title="Medical Records | MedicalTech" description="View your medical records" />

      {/* Detail Modal */}
      {selectedRecord && (
        <RecordDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}

      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Medical Records</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalElements} record{totalElements !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Records List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-5 flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div
                key={record.id}
                onClick={() => openDetail(record.id)}
                className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800/50 p-4 sm:p-5 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                        {record.diagnosis || "Visit Record"}
                      </h3>
                      {record.recordCode && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                          {record.recordCode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Dr. {record.doctorName} • {record.doctorSpecialization}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(record.visitDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    {record.chiefComplaint && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-1">
                        <span className="font-medium text-gray-600 dark:text-gray-300">Chief complaint:</span>{" "}
                        {record.chiefComplaint}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              Previous
            </button>
            <span className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-400">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function RecordDetailModal({ record, onClose }: { record: MedicalRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Medical Record</h2>
            {record.recordCode && (
              <p className="text-xs text-gray-400">{record.recordCode}</p>
            )}
          </div>
          <button
            type="button"
            title="Close"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {/* Visit Info */}
          <Section title="Visit Information">
            <Grid>
              <Field label="Doctor" value={`Dr. ${record.doctorName}`} />
              <Field label="Specialty" value={record.doctorSpecialization} />
              <Field label="Visit Date" value={new Date(record.visitDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} />
              {record.followUpDate && (
                <Field label="Follow-up" value={new Date(record.followUpDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} />
              )}
            </Grid>
          </Section>

          {/* Clinical */}
          <Section title="Clinical Details">
            {record.chiefComplaint && <Field label="Chief Complaint" value={record.chiefComplaint} full />}
            {record.presentIllness && <Field label="Present Illness" value={record.presentIllness} full />}
            {record.diagnosis && (
              <div className="mt-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">Diagnosis</p>
                <p className="text-sm text-gray-800 dark:text-white font-medium">{record.diagnosis}</p>
                {record.diagnosisCode && (
                  <p className="text-xs text-gray-500 mt-1">ICD: {record.diagnosisCode}</p>
                )}
              </div>
            )}
          </Section>

          {/* Vitals */}
          {record.vitalSigns && (
            <Section title="Vital Signs">
              <VitalSignsDisplay data={record.vitalSigns} />
            </Section>
          )}

          {/* Treatment */}
          {record.treatmentPlan && (
            <Section title="Treatment Plan">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{record.treatmentPlan}</p>
            </Section>
          )}

          {/* Lab Results */}
          {record.labResults && (
            <Section title="Lab Results">
              <LabResultsDisplay data={record.labResults} />
            </Section>
          )}

          {record.followUpNotes && (
            <Section title="Follow-up Notes">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{record.followUpNotes}</p>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">{children}</div>;
}

function Field({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-sm text-gray-800 dark:text-white mt-0.5">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
        <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-2">No medical records</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Your medical records will appear here after your doctor visits
      </p>
    </div>
  );
}

const VITAL_META: Record<string, { label: string; unit: string; icon: string; color: string; bg: string }> = {
  temperature:       { label: "Temperature",       unit: "°C",          icon: "🌡️", color: "text-red-600",    bg: "bg-red-50 dark:bg-red-900/20" },
  temp:              { label: "Temperature",       unit: "°C",          icon: "🌡️", color: "text-red-600",    bg: "bg-red-50 dark:bg-red-900/20" },
  bloodPressure:     { label: "Blood Pressure",    unit: "mmHg",        icon: "💓", color: "text-rose-600",   bg: "bg-rose-50 dark:bg-rose-900/20" },
  bp:                { label: "Blood Pressure",    unit: "mmHg",        icon: "💓", color: "text-rose-600",   bg: "bg-rose-50 dark:bg-rose-900/20" },
  blood_pressure:    { label: "Blood Pressure",    unit: "mmHg",        icon: "💓", color: "text-rose-600",   bg: "bg-rose-50 dark:bg-rose-900/20" },
  heartRate:         { label: "Heart Rate",        unit: "bpm",         icon: "❤️", color: "text-pink-600",   bg: "bg-pink-50 dark:bg-pink-900/20" },
  heart_rate:        { label: "Heart Rate",        unit: "bpm",         icon: "❤️", color: "text-pink-600",   bg: "bg-pink-50 dark:bg-pink-900/20" },
  pulse:             { label: "Pulse",             unit: "bpm",         icon: "❤️", color: "text-pink-600",   bg: "bg-pink-50 dark:bg-pink-900/20" },
  respiratoryRate:   { label: "Respiratory Rate",  unit: "breaths/min", icon: "🫁", color: "text-cyan-600",   bg: "bg-cyan-50 dark:bg-cyan-900/20" },
  respiratory_rate:  { label: "Respiratory Rate",  unit: "breaths/min", icon: "🫁", color: "text-cyan-600",   bg: "bg-cyan-50 dark:bg-cyan-900/20" },
  spo2:              { label: "SpO₂",             unit: "%",           icon: "🩸", color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-900/20" },
  oxygenSaturation:  { label: "SpO₂",             unit: "%",           icon: "🩸", color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-900/20" },
  oxygen_saturation: { label: "SpO₂",             unit: "%",           icon: "🩸", color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-900/20" },
  weight:            { label: "Weight",            unit: "kg",          icon: "⚖️", color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-900/20" },
  height:            { label: "Height",            unit: "cm",          icon: "📏", color: "text-green-600",  bg: "bg-green-50 dark:bg-green-900/20" },
  bmi:               { label: "BMI",               unit: "kg/m²",       icon: "📊", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-900/20" },
};

function getVitalMeta(key: string) {
  const lower = key.toLowerCase();
  const meta = VITAL_META[key] || VITAL_META[lower];
  if (meta) return meta;

  const label = key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim();
  return { label, unit: "", icon: "📋", color: "text-gray-600", bg: "bg-gray-50 dark:bg-gray-700/30" };
}

function safeParseJson(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) return parsed;
    } catch { /* not valid JSON */ }
  }
  return null;
}

function VitalSignsDisplay({ data }: { data: unknown }) {
  const parsed = safeParseJson(data);
  if (!parsed) return null;

  const entries = Object.entries(parsed);
  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {entries.map(([key, value]) => {
        const meta = getVitalMeta(key);
        const displayValue = String(value ?? "—");
        const hasUnit = meta.unit && !displayValue.includes(meta.unit);

        return (
          <div key={key} className={`p-3 rounded-xl ${meta.bg} transition-colors`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-base leading-none">{meta.icon}</span>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wide">{meta.label}</p>
            </div>
            <p className={`text-lg font-bold ${meta.color} dark:brightness-125`}>
              {displayValue}
              {hasUnit && <span className="text-xs font-medium text-gray-400 dark:text-gray-500 ml-1">{meta.unit}</span>}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function LabResultsDisplay({ data }: { data: unknown }) {
  const parsed = safeParseJson(data);
  if (!parsed) return null;

  const entries = Object.entries(parsed);
  if (entries.length === 0) return null;

  const formatLabel = (key: string) =>
    key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {entries.map(([key, value]) => (
        <div key={key} className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wide">
            {formatLabel(key)}
          </p>
          <p className="text-sm font-semibold text-gray-800 dark:text-white mt-1">{String(value ?? "—")}</p>
        </div>
      ))}
    </div>
  );
}
