import { useEffect, useState, useCallback } from "react";
import PageMeta from "../../components/common/PageMeta";
import patientService, { type Prescription } from "../../services/patientService";

export default function MyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await patientService.getMyPrescriptions({ pageNumber: page, pageSize: 10 });
      setPrescriptions(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (err) {
      console.error("Failed to load prescriptions:", err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const openDetail = async (id: number) => {
    try {
      const detail = await patientService.getPrescriptionDetail(id);
      setSelectedPrescription(detail);
    } catch (err) {
      console.error("Failed to load prescription detail:", err);
    }
  };

  return (
    <>
      <PageMeta title="My Prescriptions | MedicalTech" description="View your prescriptions" />

      {selectedPrescription && (
        <PrescriptionDetailModal
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
        />
      )}

      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Prescriptions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalElements} prescription{totalElements !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Prescriptions List */}
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
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-2">No prescriptions</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your prescriptions will appear here after a doctor visit
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {prescriptions.map((rx) => (
              <div
                key={rx.id}
                onClick={() => openDetail(rx.id)}
                className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800/50 p-4 sm:p-5 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                        {rx.diagnosis || "Prescription"}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          rx.isActive
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {rx.isActive ? "Active" : "Expired"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Dr. {rx.doctorName} • {rx.doctorSpecialization}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(rx.prescriptionDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {" • "}
                      {rx.items.length} medication{rx.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>

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

function PrescriptionDetailModal({
  prescription: rx,
  onClose,
}: {
  prescription: Prescription;
  onClose: () => void;
}) {
  /** Parse "10 days" → 10 */
  const parseDays = (d?: string) => {
    if (!d) return 0;
    const m = d.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">

        {/* ══════════ PRESCRIPTION HEADER ══════════ */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-wide uppercase">
              Prescription
            </h2>
            <button
              type="button"
              title="Close"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors print:hidden"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Patient & Prescription Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
            <div className="flex gap-2">
              <span className="text-gray-500 dark:text-gray-400 w-28 shrink-0">Full Name:</span>
              <span className="font-semibold text-gray-800 dark:text-white">{rx.patientName}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 dark:text-gray-400 w-28 shrink-0">Date of Birth:</span>
              <span className="text-gray-800 dark:text-white">
                {rx.patientDateOfBirth
                  ? new Date(rx.patientDateOfBirth).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                  : "—"}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 dark:text-gray-400 w-28 shrink-0">Gender:</span>
              <span className="text-gray-800 dark:text-white">{rx.patientGender || "—"}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 dark:text-gray-400 w-28 shrink-0">Phone:</span>
              <span className="text-gray-800 dark:text-white">{rx.patientPhone || "—"}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 dark:text-gray-400 w-28 shrink-0">Booked by:</span>
              <span className="text-gray-800 dark:text-white">{rx.patientName}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 dark:text-gray-400 w-28 shrink-0">Prescription #:</span>
              <span className="font-mono font-semibold text-gray-800 dark:text-white">{rx.prescriptionCode || `RX-${rx.id}`}</span>
            </div>
          </div>
        </div>

        {/* ══════════ DIAGNOSIS ══════════ */}
        {rx.diagnosis && (
          <div className="px-6 pt-4">
            <div className="flex gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400 w-28 shrink-0 font-medium">Diagnosis:</span>
              <span className="text-gray-800 dark:text-white">{rx.diagnosis}</span>
            </div>
          </div>
        )}

        {/* ══════════ PRESCRIBED MEDICINES ══════════ */}
        <div className="px-6 py-5">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
            Prescribed Medicines
          </h3>

          <div className="space-y-4">
            {rx.items.map((item, idx) => {
              const hasDoseSchedule = !!(item.morningDose || item.noonDose || item.afternoonDose || item.eveningDose);
              const dailyTotal = (item.morningDose || 0) + (item.noonDose || 0) + (item.afternoonDose || 0) + (item.eveningDose || 0);
              const days = parseDays(item.duration);
              const totalQty = item.quantity || (dailyTotal > 0 && days > 0 ? dailyTotal * days : 0);
              const unit = item.unit || "units";

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Medicine name header */}
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white">
                        {item.medicineName}
                      </h4>
                      {item.dosage && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({item.dosage})
                        </span>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                      {item.duration && <span>x {item.duration}</span>}
                      {totalQty > 0 && <span className="ml-1 font-semibold text-gray-700 dark:text-gray-200">= {totalQty} {unit}</span>}
                    </div>
                  </div>

                  {/* Dose schedule table */}
                  {hasDoseSchedule ? (
                    <div className="px-4 py-3">
                      <div className="grid grid-cols-4 gap-3 text-center text-xs mb-2">
                        <div>
                          <p className="text-gray-400 dark:text-gray-500 mb-1">Morning</p>
                          <p className={`text-lg font-bold ${item.morningDose ? 'text-gray-800 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>
                            {item.morningDose || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 dark:text-gray-500 mb-1">Noon</p>
                          <p className={`text-lg font-bold ${item.noonDose ? 'text-gray-800 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>
                            {item.noonDose || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 dark:text-gray-500 mb-1">Afternoon</p>
                          <p className={`text-lg font-bold ${item.afternoonDose ? 'text-gray-800 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>
                            {item.afternoonDose || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 dark:text-gray-500 mb-1">Evening</p>
                          <p className={`text-lg font-bold ${item.eveningDose ? 'text-gray-800 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>
                            {item.eveningDose || "—"}
                          </p>
                        </div>
                      </div>
                      {/* Summary line */}
                      {dailyTotal > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-2 mt-1">
                          Daily total: <span className="font-semibold text-gray-700 dark:text-gray-200">{dailyTotal} {unit}/day</span>
                          {days > 0 && (
                            <>
                              {" · "}Duration: <span className="font-semibold text-gray-700 dark:text-gray-200">{days} days</span>
                              {" · "}Total: <span className="font-bold text-gray-800 dark:text-white">{dailyTotal * days} {unit}</span>
                            </>
                          )}
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Fallback: old-style frequency/quantity display */
                    <div className="px-4 py-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-gray-400 dark:text-gray-500">Frequency</span>
                          <p className="font-medium text-gray-700 dark:text-gray-300">{item.frequency || "—"}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 dark:text-gray-500">Duration</span>
                          <p className="font-medium text-gray-700 dark:text-gray-300">{item.duration || "—"}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 dark:text-gray-500">Quantity</span>
                          <p className="font-medium text-gray-700 dark:text-gray-300">{item.quantity || "—"}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 dark:text-gray-500">Unit</span>
                          <p className="font-medium text-gray-700 dark:text-gray-300">{item.unit || "—"}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  {item.instructions && (
                    <div className="px-4 pb-3 text-xs text-gray-600 dark:text-gray-400 italic border-t border-gray-100 dark:border-gray-700 pt-2 mx-4">
                      Usage: {item.instructions}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════════ NOTES ══════════ */}
        {rx.notes && (
          <div className="px-6 pb-4">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase mb-1">Notes</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{rx.notes}</p>
            </div>
          </div>
        )}

        {/* ══════════ FOLLOW-UP ══════════ */}
        {rx.followUpDate && (
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 px-4 py-2.5 text-sm">
              <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span className="text-blue-700 dark:text-blue-300">
                <strong>Follow-up:</strong>{" "}
                {new Date(rx.followUpDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>
        )}

        {/* ══════════ FOOTER — DOCTOR SIGNATURE ══════════ */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-5">
          <div className="flex justify-between items-end">
            <div className="text-xs text-gray-400 dark:text-gray-500">
              <p>Prescribed: {new Date(rx.prescriptionDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
              {rx.prescriptionCode && <p className="font-mono">{rx.prescriptionCode}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Prescribing Doctor</p>
              <p className="text-sm font-bold text-gray-800 dark:text-white">Dr. {rx.doctorName}</p>
              {rx.doctorSpecialization && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{rx.doctorSpecialization}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
