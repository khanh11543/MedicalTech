import { useEffect, useState, useCallback } from "react";
import patientService from "../../../services/patientService";
import type { FrequentPatientDTO } from "../../../services/patientService";
import {
  Spinner,
  EmptyState,
  Pagination,
  Toast,
  GenderBadge,
  InsuranceBadge,
  StatsCard,
} from "./SharedComponents";

interface FrequentPatientsProps {
  onViewDetail: (patientId: number) => void;
  onQuickBook?: (patientId: number, doctorId?: number) => void;
  onSendReminder?: (patientId: number) => void;
  refreshKey?: number;
}

// Lapsed status badge component
function LapsedBadge({ status, days }: { status: string | null; days: number | null }) {
  if (!status || status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Active
      </span>
    );
  }
  if (status === "LAPSED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Lapsed {days != null ? `(${days}d)` : ""}
      </span>
    );
  }
  if (status === "LONG_LAPSED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Long lapsed {days != null ? `(${days}d)` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
      Unknown
    </span>
  );
}

// VIP badge component
function VipBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      VIP
    </span>
  );
}

type LapsedFilter = "ALL" | "ACTIVE_ONLY" | "LAPSED_60" | "LAPSED_90";

export default function FrequentPatients({ onViewDetail, onQuickBook, onSendReminder, refreshKey }: FrequentPatientsProps) {
  const [patients, setPatients] = useState<FrequentPatientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [minVisits, setMinVisits] = useState(3);
  const [lapsedFilter, setLapsedFilter] = useState<LapsedFilter>("ALL");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const lapsedDays = lapsedFilter === "LAPSED_60" ? 60 : lapsedFilter === "LAPSED_90" ? 90 : undefined;
      const data = await patientService.getFrequentPatients({
        minVisits,
        lapsedDays,
        search: search || undefined,
        page,
        size: pageSize,
      });
      let items = data?.content || [];
      // Client-side filter for "ACTIVE_ONLY" (daysSinceLastVisit < 60)
      if (lapsedFilter === "ACTIVE_ONLY") {
        items = items.filter(
          (p) => p.lapsedStatus === "ACTIVE" || (p.daysSinceLastVisit != null && p.daysSinceLastVisit < 60)
        );
      }
      setPatients(items);
      setTotalElements(data?.totalElements || 0);
      setTotalPages(data?.totalPages || 0);
    } catch (error) {
      console.error("Failed to fetch frequent patients:", error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [minVisits, lapsedFilter, search, page, pageSize]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients, refreshKey]);

  const totalSpending = patients.reduce((sum, p) => sum + (p.lifetimeSpending || 0), 0);
  const avgVisits = patients.length > 0 ? Math.round(patients.reduce((sum, p) => sum + p.totalVisits, 0) / patients.length) : 0;
  const lapsedCount = patients.filter((p) => p.lapsedStatus === "LAPSED" || p.lapsedStatus === "LONG_LAPSED").length;
  const vipCount = patients.filter((p) => p.isVip).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Frequent Patients"
          value={totalElements}
          icon="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          color="text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400"
          subLabel={`${minVisits}+ visits`}
        />
        <StatsCard
          label="Avg Visits"
          value={avgVisits}
          icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          color="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400"
        />
        <StatsCard
          label="Lapsed Patients"
          value={lapsedCount}
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          color="text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400"
          subLabel=">60 days no visit"
        />
        <StatsCard
          label="Total Spending"
          value={`${totalSpending.toLocaleString()} VND`}
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
          subLabel={vipCount > 0 ? `${vipCount} VIP patients` : "Current page total"}
        />
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search name or MRN..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Min visits filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Min visits:</span>
            <div className="flex gap-1.5">
              {[3, 5, 10, 15].map((v) => (
                <button
                  key={v}
                  onClick={() => { setMinVisits(v); setPage(0); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    minVisits === v
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {v}+
                </button>
              ))}
            </div>
          </div>

          {/* Lapsed filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Status:</span>
            <div className="flex gap-1.5">
              {([
                { key: "ALL", label: "All" },
                { key: "ACTIVE_ONLY", label: "Active" },
                { key: "LAPSED_60", label: "Lapsed >60d" },
                { key: "LAPSED_90", label: "Lapsed >90d" },
              ] as const).map((f) => (
                <button
                  key={f.key}
                  onClick={() => { setLapsedFilter(f.key); setPage(0); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    lapsedFilter === f.key
                      ? f.key.startsWith("LAPSED")
                        ? "bg-amber-500 text-white"
                        : "bg-brand-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <Spinner />
        ) : patients.length === 0 ? (
          <EmptyState message={`No patients with ${minVisits}+ visits found`} />
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
                      Total Visits
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Last Visit
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Top Doctor
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Lifetime Spent
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Insurance
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
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</div>
                          {p.isVip && <VipBadge />}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                        {p.age ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <GenderBadge gender={p.gender} />
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400">{p.maskedPhone}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                          p.isVip
                            ? "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 ring-2 ring-yellow-300 dark:ring-yellow-700"
                            : "bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
                        }`}>
                          {p.totalVisits}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{p.lastVisit || "—"}</div>
                          {p.daysSinceLastVisit != null && (
                            <div className={`text-xs ${
                              p.daysSinceLastVisit > 90 ? "text-red-500" :
                              p.daysSinceLastVisit > 60 ? "text-amber-500" :
                              "text-gray-400"
                            }`}>
                              {p.daysSinceLastVisit}d ago
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <LapsedBadge status={p.lapsedStatus} days={p.daysSinceLastVisit} />
                      </td>
                      <td className="px-3 py-3">
                        {p.mostVisitedDoctorName ? (
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">{p.mostVisitedDoctorName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {p.visitCountWithTopDoctor} visits
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                        {p.lifetimeSpending ? `${p.lifetimeSpending.toLocaleString()} VND` : "0 VND"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <InsuranceBadge status={p.insuranceStatus} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Profile */}
                          <button
                            onClick={() => onViewDetail(p.id)}
                            title="View Profile"
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 hover:text-brand-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {/* Quick Book — prefill with top doctor */}
                          {onQuickBook && (
                            <button
                              onClick={() => onQuickBook(p.id, p.mostVisitedDoctorId ?? undefined)}
                              title={`Quick book${p.mostVisitedDoctorName ? ` with ${p.mostVisitedDoctorName}` : ""}`}
                              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-gray-500 hover:text-blue-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </button>
                          )}
                          {/* Send Reminder — show for lapsed patients */}
                          {onSendReminder && (p.lapsedStatus === "LAPSED" || p.lapsedStatus === "LONG_LAPSED") && (
                            <button
                              onClick={() => onSendReminder(p.id)}
                              title="Send follow-up reminder"
                              className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors text-amber-500 hover:text-amber-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
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
