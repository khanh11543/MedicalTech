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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Prescription Details</h2>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                rx.isActive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              }`}
            >
              {rx.isActive ? "Active" : "Expired"}
            </span>
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

        <div className="px-6 py-5 space-y-6">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <p className="text-xs text-gray-400">Doctor</p>
              <p className="text-sm text-gray-800 dark:text-white font-medium mt-0.5">Dr. {rx.doctorName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Specialty</p>
              <p className="text-sm text-gray-800 dark:text-white mt-0.5">{rx.doctorSpecialization}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Date</p>
              <p className="text-sm text-gray-800 dark:text-white mt-0.5">
                {new Date(rx.prescriptionDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            {rx.followUpDate && (
              <div>
                <p className="text-xs text-gray-400">Follow-up</p>
                <p className="text-sm text-gray-800 dark:text-white mt-0.5">
                  {new Date(rx.followUpDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
            )}
          </div>

          {/* Diagnosis */}
          {rx.diagnosis && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">Diagnosis</p>
              <p className="text-sm text-gray-800 dark:text-white">{rx.diagnosis}</p>
            </div>
          )}

          {/* Medications Table */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Medications ({rx.items.length})
            </h3>
            <div className="space-y-3">
              {rx.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                      {item.medicationName}
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Dosage</span>
                      <p className="text-gray-700 dark:text-gray-300 font-medium">{item.dosage}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Frequency</span>
                      <p className="text-gray-700 dark:text-gray-300 font-medium">{item.frequency}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Duration</span>
                      <p className="text-gray-700 dark:text-gray-300 font-medium">{item.duration}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Quantity</span>
                      <p className="text-gray-700 dark:text-gray-300 font-medium">{item.quantity}</p>
                    </div>
                  </div>
                  {item.instructions && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                      📋 {item.instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {rx.notes && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Notes</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{rx.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
