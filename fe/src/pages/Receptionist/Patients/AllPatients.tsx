import { useEffect, useState, useCallback } from "react";
import patientService from "../../../services/patientService";
import type { PatientListDTO, PatientStatsDTO } from "../../../services/patientService";
import {
  Spinner,
  EmptyState,
  Pagination,
  ConfirmDialog,
  Toast,
  GenderBadge,
  InsuranceBadge,
  ActiveBadge,
  StatsCard,
} from "./SharedComponents";

interface AllPatientsProps {
  onViewDetail: (patientId: number) => void;
  refreshKey?: number;
}

export default function AllPatients({ onViewDetail, refreshKey }: AllPatientsProps) {
  // Data
  const [patients, setPatients] = useState<PatientListDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState<PatientStatsDTO | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>(""); // "" | "true" | "false"
  const [insuranceFilter, setInsuranceFilter] = useState<string>(""); // "" | "true" | "false"
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("DESC");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Action states
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [deactivateDialog, setDeactivateDialog] = useState<{ id: number; name: string; open: boolean }>({ id: 0, name: "", open: false });

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Fetch patients
  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await patientService.listAllPatients({
        search: search || undefined,
        gender: genderFilter || undefined,
        isActive: activeFilter ? activeFilter === "true" : undefined,
        hasInsurance: insuranceFilter ? insuranceFilter === "true" : undefined,
        page,
        size: pageSize,
        sort: `${sortBy},${sortDir}`,
      });
      setPatients(data?.content || []);
      setTotalElements(data?.totalElements || 0);
      setTotalPages(data?.totalPages || 0);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [search, genderFilter, activeFilter, insuranceFilter, sortBy, sortDir, page, pageSize]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await patientService.getPatientStats();
      setStats(data);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients, refreshKey]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  // Save / restore filters
  useEffect(() => {
    sessionStorage.setItem(
      "patient_filters",
      JSON.stringify({ search, genderFilter, activeFilter, insuranceFilter, sortBy, sortDir, page, pageSize })
    );
  }, [search, genderFilter, activeFilter, insuranceFilter, sortBy, sortDir, page, pageSize]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("patient_filters");
      if (saved) {
        const f = JSON.parse(saved);
        if (f.search) setSearch(f.search);
        if (f.genderFilter) setGenderFilter(f.genderFilter);
        if (f.activeFilter) setActiveFilter(f.activeFilter);
        if (f.insuranceFilter) setInsuranceFilter(f.insuranceFilter);
        if (f.sortBy) setSortBy(f.sortBy);
        if (f.sortDir) setSortDir(f.sortDir);
        if (f.pageSize) setPageSize(f.pageSize);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // ==================== ACTIONS ====================
  const handleDeactivate = async () => {
    try {
      setActionLoading(deactivateDialog.id);
      await patientService.deactivatePatient(deactivateDialog.id);
      setToast({ message: `Patient ${deactivateDialog.name} deactivated`, type: "success" });
      setDeactivateDialog({ id: 0, name: "", open: false });
      fetchPatients();
      fetchStats();
    } catch {
      setToast({ message: "Failed to deactivate patient", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (patient: PatientListDTO) => {
    try {
      setActionLoading(patient.id);
      await patientService.reactivatePatient(patient.id);
      setToast({ message: `Patient ${patient.name} reactivated`, type: "success" });
      fetchPatients();
      fetchStats();
    } catch {
      setToast({ message: "Failed to reactivate patient", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  // Sort
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(field);
      setSortDir("ASC");
    }
    setPage(0);
  };

  const SortIcon = ({ field }: { field: string }) => (
    <span className="ml-1 text-gray-400">
      {sortBy === field ? (sortDir === "ASC" ? "↑" : "↓") : "↕"}
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            label="Total Patients"
            value={stats.totalPatients}
            icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            color="text-brand-600 bg-brand-50 dark:bg-brand-900/30 dark:text-brand-400"
          />
          <StatsCard
            label="Active"
            value={stats.activePatients}
            icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            color="text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400"
            subLabel={`${stats.deactivatedPatients} deactivated`}
          />
          <StatsCard
            label="New This Month"
            value={stats.newThisMonth}
            icon="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            color="text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400"
          />
          <StatsCard
            label="Insured"
            value={stats.insuredPatients}
            icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            color="text-teal-600 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-400"
            subLabel={`${stats.uninsuredPatients} uninsured`}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search name, MRN, phone, email..."
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          {/* Gender */}
          <select
            value={genderFilter}
            onChange={(e) => {
              setGenderFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
          {/* Active Status */}
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          {/* Clear */}
          <button
            onClick={() => {
              setSearch("");
              setGenderFilter("");
              setActiveFilter("");
              setInsuranceFilter("");
              setPage(0);
              sessionStorage.removeItem("patient_filters");
            }}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Clear filters
          </button>
        </div>
        {/* Insurance filter pills */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            { value: "", label: "All Insurance" },
            { value: "true", label: "Insured" },
            { value: "false", label: "Uninsured" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setInsuranceFilter(opt.value);
                setPage(0);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                insuranceFilter === opt.value
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <Spinner />
        ) : patients.length === 0 ? (
          <EmptyState message="No patients found" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th
                      className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase cursor-pointer"
                      onClick={() => handleSort("mrn")}
                    >
                      MRN <SortIcon field="mrn" />
                    </th>
                    <th
                      className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      Patient <SortIcon field="name" />
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
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Location
                    </th>
                    <th
                      className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase cursor-pointer"
                      onClick={() => handleSort("lastVisit")}
                    >
                      Last Visit <SortIcon field="lastVisit" />
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Visits
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Insurance
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">                  {patients.map((p, index) => (
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
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{p.maskedEmail}</div>
                      </td>
                      <td className="px-3 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                        {p.age ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <GenderBadge gender={p.gender} />
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400">{p.maskedPhone}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400">{p.cityDistrict || "—"}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {p.lastVisit || "Never"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300">
                          {p.totalAppointments}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <InsuranceBadge status={p.insuranceStatus} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <ActiveBadge isActive={p.isActive} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        {actionLoading === p.id ? (
                          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        ) : (
                          <PatientActionMenu
                            patient={p}
                            onViewDetail={onViewDetail}
                            onDeactivate={() => setDeactivateDialog({ id: p.id, name: p.name, open: true })}
                            onReactivate={() => handleReactivate(p)}
                            openUpward={index >= patients.length - 2}
                          />
                        )}
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

      {/* Deactivate dialog */}
      <ConfirmDialog
        isOpen={deactivateDialog.open}
        title="Deactivate Patient"
        message={`Are you sure you want to deactivate "${deactivateDialog.name}"? They will no longer appear in active searches.`}
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateDialog({ id: 0, name: "", open: false })}
      />

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ==================== Patient Action Menu ====================
function PatientActionMenu({
  patient,
  onViewDetail,
  onDeactivate,
  onReactivate,
  openUpward = false,
}: {
  patient: PatientListDTO;
  onViewDetail: (id: number) => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  openUpward?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-40 py-1 ${openUpward ? 'bottom-full mb-1' : 'mt-1'}`}>
            <button
              onClick={() => {
                setOpen(false);
                onViewDetail(patient.id);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Profile
            </button>
            {patient.isActive ? (
              <button
                onClick={() => {
                  setOpen(false);
                  onDeactivate();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Deactivate
              </button>
            ) : (
              <button
                onClick={() => {
                  setOpen(false);
                  onReactivate();
                }}
                className="w-full text-left px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Reactivate
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
