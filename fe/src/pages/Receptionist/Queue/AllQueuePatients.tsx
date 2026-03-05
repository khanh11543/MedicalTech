import { useState, useEffect, useCallback } from "react";
import queueService, { QueuePatientDTO } from "../../../services/queueService";
import {
  QueueBadge,
  PatientStatusBadge,
  QueueLoading,
  QueueEmpty,
  formatTime,
  formatWaitTime,
  canMarkNoShow,
} from "./SharedComponents";

interface AllQueuePatientsProps {
  refreshKey: number;
  onMarkNoShow: (appointmentId: number, patientName: string) => void;
  onMoveDoctor: (appointmentId: number, patientName: string, fromDoctorId: number) => void;
}

type SortField = "queueNumber" | "waitTime" | "doctorName" | "appointmentTime";
type SortDir = "ASC" | "DESC";

export default function AllQueuePatients({
  refreshKey,
  onMarkNoShow,
  onMoveDoctor,
}: AllQueuePatientsProps) {
  const [patients, setPatients] = useState<QueuePatientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortField>("queueNumber");
  const [sortDir, setSortDir] = useState<SortDir>("ASC");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await queueService.getAllQueuedPatients(sortBy, sortDir);
      setPatients(data || []);
    } catch (error) {
      console.error("Failed to fetch all queue patients:", error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortDir]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData, refreshKey]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(field);
      setSortDir("ASC");
    }
  };

  const filtered = search
    ? patients.filter(
        (p) =>
          p.patientName?.toLowerCase().includes(search.toLowerCase()) ||
          p.appointmentCode?.toLowerCase().includes(search.toLowerCase()) ||
          p.doctorName?.toLowerCase().includes(search.toLowerCase()) ||
          String(p.queueNumber).includes(search)
      )
    : patients;

  if (loading) return <QueueLoading />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, code, doctor..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>

        {/* Sort buttons */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 dark:text-gray-400">Sort:</span>
          {(
            [
              { key: "queueNumber", label: "Queue #" },
              { key: "waitTime", label: "Wait Time" },
              { key: "doctorName", label: "Doctor" },
              { key: "appointmentTime", label: "Appt Time" },
            ] as { key: SortField; label: string }[]
          ).map((s) => (
            <button
              key={s.key}
              onClick={() => handleSort(s.key)}
              className={`px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
                sortBy === s.key
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {s.label}
              {sortBy === s.key && (
                <span className="ml-1">{sortDir === "ASC" ? "↑" : "↓"}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {filtered.length} patient{filtered.length !== 1 ? "s" : ""} in queue
      </p>

      {/* Patient Table */}
      {filtered.length === 0 ? (
        <QueueEmpty
          message={search ? "No patients match your search" : "No patients in queue"}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Queue
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Patient
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Doctor
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Time
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Wait
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((p) => {
                  return (
                    <tr
                      key={p.appointmentId}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        p.waitTimeAlertLevel === "CRITICAL"
                          ? "bg-red-50/60 dark:bg-red-900/15"
                          : p.isUrgent
                          ? "bg-red-50/50 dark:bg-red-900/10"
                          : p.waitTimeAlertLevel === "WARNING"
                          ? "bg-amber-50/40 dark:bg-amber-900/10"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <QueueBadge number={p.queueNumber} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {p.patientName || "—"}
                            {p.isUrgent && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold uppercase tracking-wider animate-pulse">
                                URGENT
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {p.appointmentCode} • {p.maskedPhone}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900 dark:text-white">
                          Dr. {p.doctorName}
                        </p>
                        {p.roomNumber && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Room {p.roomNumber}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900 dark:text-white">
                          {formatTime(p.appointmentTime)}
                        </p>
                        {p.checkedInAt && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            In: {formatTime(p.checkedInAt)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-medium ${
                            p.waitTimeAlertLevel === "CRITICAL"
                              ? "text-red-600 dark:text-red-400 font-bold animate-pulse"
                              : p.waitTimeAlertLevel === "WARNING"
                              ? "text-amber-600 dark:text-amber-400 font-semibold"
                              : "text-green-600 dark:text-green-400"
                          }`}
                        >
                          {p.waitTimeAlertLevel === "CRITICAL" && "⚠ "}
                          {formatWaitTime(p.waitTimeMinutes)}
                          {p.waitTimeAlertLevel === "CRITICAL" && " !"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <PatientStatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              onMoveDoctor(p.appointmentId, p.patientName, p.doctorId)
                            }
                            title="Move to another doctor"
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-purple-500 hover:bg-purple-600 text-white transition-colors whitespace-nowrap shadow-sm"
                          >
                            Move
                          </button>
                          {canMarkNoShow(p.status, p.appointmentTime) && (
                            <button
                              onClick={() => onMarkNoShow(p.appointmentId, p.patientName)}
                              title="Mark as no-show"
                              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors whitespace-nowrap shadow-sm"
                            >
                              No-show
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
