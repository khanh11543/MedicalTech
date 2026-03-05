import { useState, useEffect, useCallback } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";
import SlotDetailDrawer from "./SlotDetailDrawer";
import timeSlotService, {
  TimeSlotDTO,
  TimeSlotFilterDTO,
  DoctorBasicDTO,
  TimeSlotStatus,
  SlotSource,
  CreateSingleSlotDTO,
} from "../../services/timeSlotService";

// =========== HELPERS ===========
const statusBadgeColor = (s: string): "success" | "error" | "dark" | "info" | "warning" | "light" => {
  const map: Record<string, "success" | "error" | "dark" | "info" | "warning"> = {
    AVAILABLE: "success", BOOKED: "error", BLOCKED: "dark", COMPLETED: "info", RESERVED: "warning",
  };
  return map[s] || "light";
};

const fmt = (t: string) => (t ? t.substring(0, 5) : "-");
const fmtDate = (d: string) => {
  if (!d) return "-";
  return new Date(d + "T00:00:00").toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// =========== MAIN COMPONENT ===========
export default function TimeSlotList() {
  // Data
  const [slots, setSlots] = useState<TimeSlotDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);

  // Filters
  const [doctors, setDoctors] = useState<DoctorBasicDTO[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<number | undefined>();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Selected slots for bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Modals
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotDTO | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Create form
  const [createForm, setCreateForm] = useState<CreateSingleSlotDTO>({
    doctorId: 0, slotDate: "", startTime: "", endTime: "",
  });

  // =========== FETCH ===========
  useEffect(() => {
    timeSlotService.getDoctorsList().then(setDoctors).catch(console.error);
  }, []);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const filter: TimeSlotFilterDTO = {
        doctorId: selectedDoctor,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        timeOfDay: timeOfDay || undefined,
        pageNumber: currentPage,
        pageSize,
      };
      const res = await timeSlotService.getAllTimeSlots(filter);
      setSlots(res.content);
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages);
    } catch (e) {
      console.error("Failed to fetch slots:", e);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDoctor, dateFrom, dateTo, statusFilter, sourceFilter, timeOfDay, currentPage, pageSize]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // =========== SELECT LOGIC ===========
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(slots.map((s) => s.id));
    }
    setSelectAll(!selectAll);
  };

  // =========== ACTIONS ===========
  const openDetail = async (slot: TimeSlotDTO) => {
    try {
      const full = await timeSlotService.getTimeSlotById(slot.id);
      setSelectedSlot(full);
    } catch {
      setSelectedSlot(slot);
    }
    setDetailDrawerOpen(true);
  };

  const handleCreate = async () => {
    try {
      await timeSlotService.createTimeSlot(createForm);
      setCreateModalOpen(false);
      setCreateForm({ doctorId: 0, slotDate: "", startTime: "", endTime: "" });
      fetchSlots();
    } catch (e) {
      console.error("Create failed:", e);
    }
  };

  const handleBulkBlock = async () => {
    if (selectedIds.length === 0) return;
    const reason = prompt("Enter block reason (VACATION, MEETING, EMERGENCY, TRAINING, PERSONAL, OTHER):", "OTHER");
    if (!reason) return;
    try {
      await timeSlotService.bulkBlockSlots({ timeSlotIds: selectedIds, reason });
      setSelectedIds([]);
      setSelectAll(false);
      fetchSlots();
    } catch (e) {
      console.error("Bulk block failed:", e);
    }
  };

  const handleBulkUnblock = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Unblock ${selectedIds.length} slot(s)?`)) return;
    try {
      await timeSlotService.bulkUnblockSlots({ timeSlotIds: selectedIds });
      setSelectedIds([]);
      setSelectAll(false);
      fetchSlots();
    } catch (e) {
      console.error("Bulk unblock failed:", e);
    }
  };

  const clearFilters = () => {
    setSelectedDoctor(undefined);
    setDateFrom("");
    setDateTo("");
    setStatusFilter("");
    setSourceFilter("");
    setTimeOfDay("");
    setCurrentPage(0);
  };

  return (
    <>
      <PageMeta title="Time Slot List | MediTech" description="List view of time slots" />
      <PageBreadcrumb pageTitle="Time Slot List" />

      <div className="space-y-6">
        {/* =========== FILTERS =========== */}
        <ComponentCard title="Filters & Search">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters {showFilters ? "▲" : "▼"}
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              + Create Slot
            </button>
            <button onClick={fetchSlots} className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            {(selectedDoctor || dateFrom || dateTo || statusFilter || sourceFilter || timeOfDay) && (
              <button onClick={clearFilters} className="text-sm text-brand-500 hover:text-brand-600">Clear all</button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Doctor</label>
                <select
                  value={selectedDoctor || ""}
                  onChange={(e) => { setSelectedDoctor(e.target.value ? Number(e.target.value) : undefined); setCurrentPage(0); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">All Doctors</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">From</label>
                <input
                  type="date" value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(0); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">To</label>
                <input
                  type="date" value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setCurrentPage(0); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">All</option>
                  {Object.values(TimeSlotStatus).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Source</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => { setSourceFilter(e.target.value); setCurrentPage(0); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">All</option>
                  {Object.values(SlotSource).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Time of Day</label>
                <select
                  value={timeOfDay}
                  onChange={(e) => { setTimeOfDay(e.target.value); setCurrentPage(0); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">All</option>
                  <option value="MORNING">Morning</option>
                  <option value="AFTERNOON">Afternoon</option>
                </select>
              </div>
            </div>
          )}
        </ComponentCard>

        {/* =========== BULK ACTIONS BAR =========== */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-800 dark:bg-brand-900/20">
            <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
              {selectedIds.length} slot(s) selected
            </span>
            <button onClick={handleBulkBlock} className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700">
              Block Selected
            </button>
            <button onClick={handleBulkUnblock} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500">
              Unblock Selected
            </button>
            <button onClick={() => { setSelectedIds([]); setSelectAll(false); }} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400">
              Clear selection
            </button>
          </div>
        )}

        {/* =========== TABLE =========== */}
        <ComponentCard title={`Time Slots (${totalElements} total)`}>
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                  <TableRow>
                    <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} className="rounded" />
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Doctor</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Date</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Time</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Source</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Appointment</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell className="px-4 py-10 text-center">
                        <div className="flex items-center justify-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : slots.length === 0 ? (
                    <TableRow>
                      <TableCell className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                        No time slots found
                      </TableCell>
                    </TableRow>
                  ) : (
                    slots.map((slot) => (
                      <TableRow key={slot.id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                        <TableCell className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(slot.id)}
                            onChange={() => toggleSelect(slot.id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{slot.doctorName}</p>
                            <p className="text-xs text-gray-500">{slot.specialization || ""}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {fmtDate(slot.slotDate)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {fmt(slot.startTime)} - {fmt(slot.endTime)}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge variant="light" size="sm" color={statusBadgeColor(slot.status)}>
                            {slot.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge variant="light" size="sm" color="light">
                            {slot.source || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {slot.appointmentCode || "-"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <button
                            onClick={() => openDetail(slot)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20"
                          >
                            Detail
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let page = i;
                    if (totalPages > 7) {
                      const start = Math.max(0, Math.min(currentPage - 3, totalPages - 7));
                      page = start + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`rounded-lg px-3 py-1.5 text-sm ${
                          currentPage === page
                            ? "bg-brand-500 text-white"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {page + 1}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </ComponentCard>
      </div>

      {/* =========== SLOT DETAIL DRAWER =========== */}
      <SlotDetailDrawer
        isOpen={detailDrawerOpen}
        slot={selectedSlot}
        onClose={() => setDetailDrawerOpen(false)}
        onRefresh={fetchSlots}
      />

      {/* =========== CREATE MODAL =========== */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} className="max-w-lg p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Create Time Slot</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Doctor</label>
            <select
              value={createForm.doctorId || ""}
              onChange={(e) => setCreateForm({ ...createForm, doctorId: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select Doctor</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName} — {d.specialization || "General"}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
            <input type="date" value={createForm.slotDate} onChange={(e) => setCreateForm({ ...createForm, slotDate: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
              <input type="time" value={createForm.startTime} onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">End Time</label>
              <input type="time" value={createForm.endTime} onChange={(e) => setCreateForm({ ...createForm, endTime: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setCreateModalOpen(false)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-300">Cancel</button>
            <button onClick={handleCreate} disabled={!createForm.doctorId || !createForm.slotDate || !createForm.startTime || !createForm.endTime} className="flex-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">Create</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
