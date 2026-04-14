import { useState, useCallback, useRef } from "react";
import queueService, { type QueueCallResultDTO } from "../../../services/queueService";
import receptionistService, { type PatientBasicDTO } from "../../../services/receptionistService";

interface AddWalkInModalProps {
  isOpen: boolean;
  doctorId: number;
  doctorName: string;
  onClose: () => void;
  onSuccess: (result: QueueCallResultDTO) => void;
}

export default function AddWalkInModal({
  isOpen,
  doctorId,
  doctorName,
  onClose,
  onSuccess,
}: AddWalkInModalProps) {
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<PatientBasicDTO[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientBasicDTO | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [reasonForVisit, setReasonForVisit] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Patient search
  const handlePatientSearch = useCallback(
    (query: string) => {
      setPatientSearch(query);
      setSelectedPatient(null);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      if (query.length < 3) {
        setPatientResults([]);
        return;
      }
      searchTimeout.current = setTimeout(async () => {
        try {
          setSearchLoading(true);
          const results = await receptionistService.searchPatients(query);
          setPatientResults(results);
        } catch (error: any) {
          setError(error?.response?.data?.message || "Failed to search patients");
          setPatientResults([]);
        } finally {
          setSearchLoading(false);
        }
      }, 400);
    },
    []
  );

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedPatient) {
      setError("Please select a patient");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const result = await queueService.addWalkIn(doctorId, {
        patientId: selectedPatient.id,
        reasonForVisit: reasonForVisit || undefined,
        preferredTime: preferredTime || undefined,
        urgent,
        note: note || undefined,
      });
      onSuccess(result);
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add walk-in patient");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPatientSearch("");
    setPatientResults([]);
    setSelectedPatient(null);
    setReasonForVisit("");
    setPreferredTime("");
    setUrgent(false);
    setNote("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Walk-In Patient
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Queue for Dr. {doctorName}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Patient Selection */}
          <div>
            <h3 className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Patient <span className="text-red-500">*</span>
            </h3>

            {selectedPatient ? (
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{selectedPatient.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{selectedPatient.maskedPhone} · {selectedPatient.email || "No email"}</div>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => handlePatientSearch(e.target.value)}
                    placeholder="Search patient by name or phone (min 3 characters)..."
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent pr-10"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-3">
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {patientSearch.length > 0 && patientSearch.length < 3 && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">Type at least 3 characters to search</p>
                )}

                {/* Results */}
                {patientResults.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {patientResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedPatient(p); setPatientResults([]); setPatientSearch(""); }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{p.maskedPhone} · {p.email || "No email"}</div>
                      </button>
                    ))}
                  </div>
                )}

                {patientSearch.length >= 3 && patientResults.length === 0 && !searchLoading && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No patients found</p>
                )}
              </>
            )}
          </div>

          {/* Reason for Visit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason for Visit
            </label>
            <input
              type="text"
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              placeholder="e.g. Follow-up, New symptoms..."
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Preferred Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Preferred Time
            </label>
            <input
              type="time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Urgent Flag */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-5 w-9 rounded-full bg-gray-300 peer-checked:bg-red-500 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"></div>
            </label>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Mark as Urgent
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Patient will receive priority in queue
              </p>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedPatient}
            className="px-6 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Adding...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add to Queue
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
