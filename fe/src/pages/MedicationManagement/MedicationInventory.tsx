import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import dayjs from "dayjs";
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
  InventoryUpdateDTO,
  InventoryLogDTO,
} from "../../services/medicationService";

// ==================== ICONS ====================
const SearchIcon = () => (
  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const XIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const RefreshIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
const HistoryIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const InventoryEditIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const WarningIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);
const BoxIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const CheckIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const BanIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);
const TotalIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>
);

// ==================== HELPERS ====================
function StatCard({ title, value, icon, color, subtitle }: {
  title: string; value: string | number; icon: React.ReactNode; color: string; subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color} text-white`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-xl font-bold text-gray-800 dark:text-white">{value}</p>
        {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function stockBadge(qty: number) {
  if (qty === 0) return { label: "Out of Stock", color: "error" as const };
  if (qty <= 10) return { label: "Low Stock", color: "warning" as const };
  return { label: "In Stock", color: "success" as const };
}

function logTypeBadge(type: string) {
  switch (type) {
    case "IMPORT":
    case "INVENTORY_IMPORT": return { label: "Import", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" };
    case "EXPORT":
    case "INVENTORY_EXPORT": return { label: "Export", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" };
    case "ADJUST":
    case "INVENTORY_ADJUST": return { label: "Adjust", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" };
    case "INITIAL": return { label: "Initial", cls: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" };
    case "PRESCRIPTION":
    case "INVENTORY_DEDUCT_BY_PRESCRIPTION": return { label: "Prescription", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" };
    case "INVENTORY_RESTORE_BY_REFUND": return { label: "Refund Restore", cls: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" };
    case "INVENTORY_RESTORE_BY_CANCEL": return { label: "Cancel Restore", cls: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" };
    default: return { label: type, cls: "bg-gray-100 text-gray-600" };
  }
}

// ==================== UPDATE INVENTORY MODAL ====================
interface InventoryModalProps {
  medication: MedicationDTO;
  onClose: () => void;
  onSave: (dto: InventoryUpdateDTO) => void;
  loading: boolean;
}
function InventoryModal({ medication, onClose, onSave, loading }: InventoryModalProps) {
  const [type, setType] = useState<"IMPORT" | "EXPORT" | "ADJUST">("IMPORT");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) { toast.error("Quantity must be a non-negative number"); return; }
    if ((type === "IMPORT" || type === "EXPORT") && qty === 0) { toast.error(`${type === "IMPORT" ? "Import" : "Export"} quantity must be > 0`); return; }
    const newQty = type === "IMPORT" ? medication.availableQuantity + qty : type === "EXPORT" ? medication.availableQuantity - qty : qty;
    if (newQty < 0) { toast.error("Resulting quantity cannot be negative"); return; }
    onSave({ type, quantity: qty, note: note || undefined });
  };

  const inputCls = "w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white";
  const preview = quantity !== "" && !isNaN(parseInt(quantity))
    ? (type === "IMPORT" ? medication.availableQuantity + parseInt(quantity) : type === "EXPORT" ? medication.availableQuantity - parseInt(quantity) : parseInt(quantity))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Update Inventory</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"><XIcon /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* Drug info */}
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
            <p className="font-semibold text-gray-800 dark:text-white text-sm">{medication.name}</p>
            <p className="text-xs text-gray-500">{medication.code} · {medication.category || "—"}</p>
            <p className="mt-1 text-sm">
              Current stock:{" "}
              <span className={`font-bold ${medication.availableQuantity === 0 ? "text-red-600" : medication.availableQuantity <= 10 ? "text-amber-500" : "text-green-600"}`}>
                {medication.availableQuantity} {medication.unit || "units"}
              </span>
            </p>
          </div>
          {/* Type buttons */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Operation Type</label>
            <div className="flex gap-3">
              {(["IMPORT", "EXPORT", "ADJUST"] as const).map(t => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-colors ${type === t
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400"}`}>
                  {t === "IMPORT" ? "📦 Import (+)" : t === "EXPORT" ? "📤 Export (-)" : "🔧 Adjust (=)"}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {type === "IMPORT" ? "Adds to current stock" : type === "EXPORT" ? "Subtracts from current stock" : "Sets stock to exact value"}
            </p>
          </div>
          {/* Quantity */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity <span className="text-red-500">*</span></label>
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

// ==================== HISTORY DRAWER ====================
interface HistoryDrawerProps {
  medication: MedicationDTO;
  onClose: () => void;
}
function HistoryDrawer({ medication, onClose }: HistoryDrawerProps) {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ["inventory-logs", medication.id, page],
    queryFn: () => medicationService.getInventoryLogs(medication.id, page, 15),
  });

  const logs: InventoryLogDTO[] = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-lg flex-col overflow-hidden bg-white shadow-2xl dark:bg-gray-900"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <div>
            <h2 className="text-base font-semibold text-gray-800 dark:text-white">Inventory History</h2>
            <p className="text-sm text-gray-500">{medication.name} · <span className="font-mono text-xs">{medication.code}</span></p>
            <p className="mt-1 text-sm">
              Current stock:{" "}
              <span className={`font-bold ${medication.availableQuantity === 0 ? "text-red-600" : medication.availableQuantity <= 10 ? "text-amber-500" : "text-green-600"}`}>
                {medication.availableQuantity} {medication.unit || "units"}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
            <XIcon />
          </button>
        </div>

        {/* Log list */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <HistoryIcon />
              <p className="mt-2 text-sm">No inventory logs yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map(log => {
                const badge = logTypeBadge(log.type);
                return (
                  <div key={log.id}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                          {badge.label}
                        </span>
                        <span className={`text-sm font-bold ${log.delta > 0 ? "text-green-600" : log.delta < 0 ? "text-red-500" : "text-gray-500"}`}>
                          {log.delta > 0 ? `+${log.delta}` : log.delta}
                        </span>
                        <span className="text-xs text-gray-500">
                          {log.quantityBefore} → {log.quantityAfter}
                        </span>
                      </div>
                      <span className="shrink-0 text-xs text-gray-400">
                        {dayjs(log.changedAt).format("DD/MM/YY HH:mm")}
                      </span>
                    </div>
                    {log.note && (
                      <p className="mt-1 text-xs text-gray-500 italic">"{log.note}"</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <span className="text-xs text-gray-500">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800">
                <ChevronLeftIcon />
              </button>
              <button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800">
                <ChevronRightIcon />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================
type StockFilter = "all" | "out" | "low" | "ok";

export default function MedicationInventory() {
  const queryClient = useQueryClient();
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [pagination, setPagination] = useState({ page: 0, size: 15 });
  const [inventoryTarget, setInventoryTarget] = useState<MedicationDTO | null>(null);
  const [historyTarget, setHistoryTarget] = useState<MedicationDTO | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearch(value);
      setPagination(p => ({ ...p, page: 0 }));
    }, 400);
  }, []);
  useEffect(() => () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); }, []);

  // Map stockFilter to isActive + client-side filtering
  const { data, isLoading, error } = useQuery({
    queryKey: ["medications-inventory", search, pagination],
    queryFn: () => medicationService.getAll({
      search: search || undefined,
      sortBy: "name",
      sortDir: "ASC",
      page: pagination.page,
      size: pagination.size,
    }),
    retry: 1,
  });

  const { data: summary } = useQuery({
    queryKey: ["inventory-summary"],
    queryFn: () => medicationService.getInventorySummary(),
    staleTime: 30_000,
  });

  const inventoryMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: InventoryUpdateDTO }) =>
      medicationService.updateInventory(id, dto),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["medications-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-summary"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-logs", updated.id] });
      toast.success(`Inventory updated → ${updated.availableQuantity} ${updated.unit || "units"}`);
      setInventoryTarget(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update inventory"),
  });

  // Client-side stock filter
  const allItems = data?.content ?? [];
  const filteredItems = allItems.filter(m => {
    if (stockFilter === "out") return m.availableQuantity === 0;
    if (stockFilter === "low") return m.availableQuantity > 0 && m.availableQuantity <= 10;
    if (stockFilter === "ok") return m.availableQuantity > 10;
    return true;
  });

  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const stockFilterBtns: { key: StockFilter; label: string; cls: string }[] = [
    { key: "all",  label: `All (${totalElements})`, cls: "border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300" },
    { key: "out",  label: `⛔ Out of Stock (${summary?.outOfStockCount ?? 0})`, cls: "border-red-300 text-red-700 dark:border-red-700 dark:text-red-400" },
    { key: "low",  label: `⚠️ Low Stock (${summary?.lowStockCount ?? 0})`, cls: "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400" },
    { key: "ok",   label: `✅ In Stock (${summary?.inStockCount ?? 0})`, cls: "border-green-300 text-green-700 dark:border-green-700 dark:text-green-400" },
  ];

  return (
    <>
      <PageMeta
        title="Inventory Management | MedicalTech Dashboard"
        description="Track and update medication stock levels"
      />
      <PageBreadcrumb pageTitle="Inventory Management" />

      <div className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <p className="font-bold">Error</p>
            <p className="text-sm">{(error as any)?.response?.data?.message || (error as any)?.message}</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard title="Total Meds" value={summary?.totalMedications ?? 0}
            icon={<BoxIcon />} color="bg-blue-500" />
          <StatCard title="Active" value={summary?.activeMedications ?? 0}
            icon={<CheckIcon />} color="bg-emerald-500" />
          <StatCard title="In Stock" value={summary?.inStockCount ?? 0}
            icon={<CheckIcon />} color="bg-green-500" subtitle="> 10 units" />
          <StatCard title="Low Stock" value={summary?.lowStockCount ?? 0}
            icon={<WarningIcon />} color="bg-amber-500" subtitle="1–10 units" />
          <StatCard title="Out of Stock" value={summary?.outOfStockCount ?? 0}
            icon={<BanIcon />} color="bg-red-500" subtitle="0 units" />
          <StatCard title="Total Units" value={(summary?.totalUnits ?? 0).toLocaleString()}
            icon={<TotalIcon />} color="bg-purple-500" />
        </div>

        <ComponentCard title="Inventory Status">
          {/* Toolbar */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2"><SearchIcon /></span>
              <input type="text" placeholder="Search medication name, code..."
                value={searchInput} onChange={e => handleSearchChange(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-transparent pl-10 pr-4 text-sm focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            </div>
            <button onClick={() => { setSearchInput(""); setSearch(""); setStockFilter("all"); setPagination({ page: 0, size: 15 }); }}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
              <RefreshIcon /> Reset
            </button>
          </div>

          {/* Stock filter pills */}
          <div className="mb-4 flex flex-wrap gap-2">
            {stockFilterBtns.map(btn => (
              <button key={btn.key} onClick={() => setStockFilter(btn.key)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${stockFilter === btn.key
                  ? "bg-brand-500 text-white border-brand-500"
                  : btn.cls + " bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                {btn.label}
              </button>
            ))}
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <BoxIcon />
              <p className="mt-2 font-medium">No medications match this filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Code</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Medication</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Category</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Unit</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Current Stock</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Stock Status</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Last Note</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Updated</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Active</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map(med => {
                    const sb = stockBadge(med.availableQuantity);
                    return (
                      <TableRow key={med.id}>
                        <TableCell className="px-5 py-4 text-start">
                          <span className="font-mono text-xs text-gray-500">{med.code}</span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white text-sm">{med.name}</p>
                            {med.genericName && <p className="text-xs text-gray-400">{med.genericName}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <span className="text-sm text-gray-600 dark:text-gray-300">{med.category || "—"}</span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <span className="text-sm">{med.unit || "—"}</span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <span className={`text-lg font-bold tabular-nums ${
                            med.availableQuantity === 0 ? "text-red-600"
                            : med.availableQuantity <= 10 ? "text-amber-500"
                            : "text-green-600"}`}>
                            {med.availableQuantity}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <Badge color={sb.color}>{sb.label}</Badge>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <span className="max-w-[120px] truncate text-xs text-gray-400 block" title={med.updatedAt}>
                            —
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <span className="text-xs text-gray-400">
                            {dayjs(med.updatedAt).format("DD/MM/YY")}
                          </span>
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
                            {/* Update inventory */}
                            <button onClick={() => setInventoryTarget(med)} title="Update Inventory"
                              className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
                              <InventoryEditIcon />
                            </button>
                            {/* View history */}
                            <button onClick={() => setHistoryTarget(med)} title="View History"
                              className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                              <HistoryIcon />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
                  {[15, 30, 50].map(s => (
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

      {/* Update Inventory Modal */}
      {inventoryTarget && (
        <InventoryModal
          medication={inventoryTarget}
          onClose={() => setInventoryTarget(null)}
          onSave={dto => inventoryMut.mutate({ id: inventoryTarget.id, dto })}
          loading={inventoryMut.isPending}
        />
      )}

      {/* History Drawer */}
      {historyTarget && (
        <HistoryDrawer
          medication={historyTarget}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </>
  );
}
