import { useEffect, useState, useCallback } from "react";
import patientService from "../../../services/patientService";
import type { NewPatientDTO } from "../../../services/patientService";
import {
  Spinner,
  EmptyState,
  Pagination,
  Toast,
  GenderBadge,
  InsuranceBadge,
  StatsCard,
  NewBadge,
} from "./SharedComponents";

interface NewPatientsProps {
  onViewDetail: (patientId: number) => void;
  onSchedule?: (patient: { patientId: number; patientName: string; maskedPhone?: string }) => void;
  refreshKey?: number;
}

export default function NewPatients({ onViewDetail, onSchedule, refreshKey }: NewPatientsProps) {
  const [patients, setPatients] = useState<NewPatientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchNewPatients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await patientService.getNewPatients({ page, size: pageSize });
      setPatients(data?.content || []);
      setTotalElements(data?.totalElements || 0);
      setTotalPages(data?.totalPages || 0);
    } catch (error) {
      console.error("Failed to fetch new patients:", error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchNewPatients();
  }, [fetchNewPatients, refreshKey]);

  const currentMonth = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const withAppointment = patients.filter((p) => p.hasAppointment).length;
  const withoutAppointment = patients.filter((p) => !p.hasAppointment).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          label={`New in ${currentMonth}`}
          value={totalElements}
          icon="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          color="text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <StatsCard
          label="Has Appointment"
          value={withAppointment}
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          color="text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400"
        />
        <StatsCard
          label="Needs Scheduling"
          value={withoutAppointment}
          icon="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          color="text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400"
          subLabel="Schedule first appointment"
        />
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-center gap-3">
        <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Showing patients registered in <strong>{currentMonth}</strong>. Patients without appointments can be scheduled from their profile.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <Spinner />
        ) : patients.length === 0 ? (
          <EmptyState message="No new patients this month" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      MRN
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Patient
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Age
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Gender
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Phone
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Insurance
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Registered
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Appointment
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-3 py-3">
                        <button
                          onClick={() => onViewDetail(p.id)}
                          className="text-sm font-mono text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          {p.mrn}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {p.name}
                        </span>
                        {p.isNew && <NewBadge />}
                      </td>
                      <td className="px-3 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                        {p.age ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <GenderBadge gender={p.gender} />
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400">{p.maskedPhone}</td>
                      <td className="px-3 py-3 text-center">
                        <InsuranceBadge status={p.insuranceStatus} />
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {p.registeredAt
                          ? new Date(p.registeredAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {p.hasAppointment ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Scheduled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            None
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewDetail(p.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md text-white bg-brand-500 hover:bg-brand-600 transition-colors"
                          >
                            View
                          </button>
                          {!p.hasAppointment && (
                            <button
                              onClick={() =>
                                onSchedule
                                  ? onSchedule({ patientId: p.id, patientName: p.name, maskedPhone: p.maskedPhone })
                                  : onViewDetail(p.id)
                              }
                              className="px-2.5 py-1 text-xs font-semibold rounded-md text-white bg-green-500 hover:bg-green-600 transition-colors"
                            >
                              Schedule
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(0);
              }}
            />
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
