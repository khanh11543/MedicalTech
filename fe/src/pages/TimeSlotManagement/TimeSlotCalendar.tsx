import { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DateClickArg } from "@fullcalendar/interaction";
import { EventInput } from "@fullcalendar/core";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";
import timeSlotService, {
  CalendarDayDTO,
  SlotStatisticsDTO,
  TimeSlotDTO,
  TimeSlotFilterDTO,
  DoctorBasicDTO,
  BlockSlotRequestDTO,
  BlockReason,
  TimeSlotStatus,
} from "../../services/timeSlotService";

// =========== HELPERS ===========
const statusColors: Record<string, string> = {
  AVAILABLE: "#22c55e",
  BOOKED: "#ef4444",
  BLOCKED: "#1f2937",
  COMPLETED: "#3b82f6",
  RESERVED: "#eab308",
};

const statusBadgeColor = (s: string): "success" | "error" | "dark" | "info" | "warning" | "light" => {
  const map: Record<string, "success" | "error" | "dark" | "info" | "warning"> = {
    AVAILABLE: "success",
    BOOKED: "error",
    BLOCKED: "dark",
    COMPLETED: "info",
    RESERVED: "warning",
  };
  return map[s] || "light";
};

const fmt = (t: string) => (t ? t.substring(0, 5) : "-");

const fmtDate = (d: string) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

/** Format a Date to "YYYY-MM-DD" using LOCAL timezone (avoids UTC shift from toISOString). */
const localDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// =========== STAT CARD ===========
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
        {subtitle && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

// =========== ICONS ===========
const SlotIcon = () => (
  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const CheckIcon = () => (
  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const CalIcon = () => (
  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const ChartIcon = () => (
  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

// =========== MAIN COMPONENT ===========
export default function TimeSlotCalendar() {
  const { toast, showToast, dismissToast } = useToast();
  // Calendar state
  const [, setCalendarData] = useState<CalendarDayDTO[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<EventInput[]>([]);
  const [calendarView, setCalendarView] = useState<"dayGridMonth" | "timeGridWeek" | "timeGridDay">("dayGridMonth");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filters
  const [doctors, setDoctors] = useState<DoctorBasicDTO[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<number | undefined>(undefined);
  const [doctorSearch, setDoctorSearch] = useState("");

  // Stats
  const [stats, setStats] = useState<SlotStatisticsDTO | null>(null);

  // Day detail modal
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [daySlots, setDaySlots] = useState<TimeSlotDTO[]>([]);
  const [dayLoading, setDayLoading] = useState(false);

  // Slot detail drawer
  const [slotDrawerOpen, setSlotDrawerOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotDTO | null>(null);

  // Block modal
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState<string>(BlockReason.OTHER);
  const [blockNote, setBlockNote] = useState("");

  // Loading
  const [loading, setLoading] = useState(false);

  // =========== FETCH DOCTORS ===========
  useEffect(() => {
    timeSlotService.getDoctorsList().then(setDoctors).catch(console.error);
  }, []);

  // =========== FETCH CALENDAR DATA ===========
  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const toDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const from = localDateStr(fromDate);
      const to = localDateStr(toDate);

      const [cal, statsData] = await Promise.all([
        timeSlotService.getCalendarData(from, to, selectedDoctor),
        timeSlotService.getStatistics(localDateStr(new Date()), selectedDoctor),
      ]);

      setCalendarData(cal);
      setStats(statsData);

      // Build calendar events from CalendarDayDTO
      const events: EventInput[] = [];
      cal.forEach((day) => {
        if (day.availableSlots > 0)
          events.push({
            title: `${day.availableSlots} Available`,
            start: day.date,
            backgroundColor: statusColors.AVAILABLE,
            borderColor: statusColors.AVAILABLE,
            textColor: "#fff",
            extendedProps: { type: "AVAILABLE", count: day.availableSlots },
          });
        if (day.bookedSlots > 0)
          events.push({
            title: `${day.bookedSlots} Booked`,
            start: day.date,
            backgroundColor: statusColors.BOOKED,
            borderColor: statusColors.BOOKED,
            textColor: "#fff",
            extendedProps: { type: "BOOKED", count: day.bookedSlots },
          });
        if (day.blockedSlots > 0)
          events.push({
            title: `${day.blockedSlots} Blocked`,
            start: day.date,
            backgroundColor: statusColors.BLOCKED,
            borderColor: statusColors.BLOCKED,
            textColor: "#fff",
            extendedProps: { type: "BLOCKED", count: day.blockedSlots },
          });
        if (day.completedSlots > 0)
          events.push({
            title: `${day.completedSlots} Completed`,
            start: day.date,
            backgroundColor: statusColors.COMPLETED,
            borderColor: statusColors.COMPLETED,
            textColor: "#fff",
            extendedProps: { type: "COMPLETED", count: day.completedSlots },
          });
      });
      setCalendarEvents(events);
    } catch (error) {
      console.error("Failed to fetch calendar:", error);
    } finally {
      setLoading(false);
    }
  }, [currentDate, selectedDoctor]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  // =========== DATE CLICK → SHOW DAY SLOTS ===========
  const handleDateClick = async (info: DateClickArg) => {
    setSelectedDate(info.dateStr);
    setDayModalOpen(true);
    setDayLoading(true);
    try {
      const filter: TimeSlotFilterDTO = {
        date: info.dateStr,
        doctorId: selectedDoctor,
        pageNumber: 0,
        pageSize: 200,
      };
      const res = await timeSlotService.getAllTimeSlots(filter);
      setDaySlots(res.content);
    } catch (e) {
      console.error("Failed to load day slots:", e);
      setDaySlots([]);
    } finally {
      setDayLoading(false);
    }
  };

  // =========== SLOT CLICK → DETAIL DRAWER ===========
  const openSlotDetail = async (slot: TimeSlotDTO) => {
    try {
      const full = await timeSlotService.getTimeSlotById(slot.id);
      setSelectedSlot(full);
      setSlotDrawerOpen(true);
    } catch {
      setSelectedSlot(slot);
      setSlotDrawerOpen(true);
    }
  };

  // =========== BLOCK / UNBLOCK ACTIONS ===========
  const handleBlock = async () => {
    if (!selectedSlot) return;
    try {
      const data: BlockSlotRequestDTO = {
        reason: blockReason,
        note: blockNote || undefined,
      };
      await timeSlotService.blockTimeSlot(selectedSlot.id, data);
      setBlockModalOpen(false);
      setSlotDrawerOpen(false);
      setBlockNote("");
      fetchCalendar();
      if (dayModalOpen) {
        // refresh day view
        const filter: TimeSlotFilterDTO = { date: selectedDate, doctorId: selectedDoctor, pageSize: 200 };
        const res = await timeSlotService.getAllTimeSlots(filter);
        setDaySlots(res.content);
      }
      showToast("Slot blocked", "success");
    } catch (e) {
      console.error("Block failed:", e);
      showToast("Block failed", "error");
    }
  };

  const handleUnblock = async () => {
    if (!selectedSlot) return;
    try {
      await timeSlotService.unblockTimeSlot(selectedSlot.id);
      setSlotDrawerOpen(false);
      fetchCalendar();
      if (dayModalOpen) {
        const filter: TimeSlotFilterDTO = { date: selectedDate, doctorId: selectedDoctor, pageSize: 200 };
        const res = await timeSlotService.getAllTimeSlots(filter);
        setDaySlots(res.content);
      }
      showToast("Slot unblocked", "success");
    } catch (e) {
      console.error("Unblock failed:", e);
      showToast("Unblock failed", "error");
    }
  };

  const handleDeleteSlot = async () => {
    if (!selectedSlot) return;
    if (!confirm("Are you sure you want to delete this slot?")) return;
    try {
      await timeSlotService.deleteTimeSlot(selectedSlot.id);
      setSlotDrawerOpen(false);
      fetchCalendar();
      if (dayModalOpen) {
        const filter: TimeSlotFilterDTO = { date: selectedDate, doctorId: selectedDoctor, pageSize: 200 };
        const res = await timeSlotService.getAllTimeSlots(filter);
        setDaySlots(res.content);
      }
      showToast("Slot deleted", "success");
    } catch (e) {
      console.error("Delete failed:", e);
      showToast("Delete failed", "error");
    }
  };

  // =========== FILTERED DOCTORS ===========
  const filteredDoctors = doctors.filter(
    (d) =>
      d.fullName.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      (d.specialization || "").toLowerCase().includes(doctorSearch.toLowerCase())
  );

  return (
    <>
      <PageMeta title="Time Slot Calendar | MediTech" description="Calendar view of time slots" />
      <PageBreadcrumb pageTitle="Time Slot Calendar" />

      <div className="space-y-6">
        {/* =========== KPI STATS =========== */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Slots Today"
              value={stats.totalSlots}
              subtitle={`${stats.availableSlots} available`}
              icon={<SlotIcon />}
              color="bg-brand-500"
            />
            <StatCard
              title="Booked Today"
              value={stats.bookedSlots}
              subtitle={`${stats.completedSlots} completed`}
              icon={<CalIcon />}
              color="bg-success-500"
            />
            <StatCard
              title="Utilization Rate"
              value={`${stats.utilizationRate.toFixed(1)}%`}
              subtitle={stats.blockedSlots > 0 ? `${stats.blockedSlots} blocked` : undefined}
              icon={<ChartIcon />}
              color="bg-warning-500"
            />
            <StatCard
              title="Lowest Availability"
              value={stats.lowestAvailabilityDoctor || "N/A"}
              subtitle={stats.lowestAvailabilityCount !== undefined ? `${stats.lowestAvailabilityCount} slots left` : undefined}
              icon={<CheckIcon />}
              color="bg-error-500"
            />
          </div>
        )}

        {/* =========== DOCTOR SELECTOR + VIEW MODES =========== */}
        <ComponentCard title="Calendar View">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {/* Doctor selector */}
            <div className="relative min-w-[240px]">
              <input
                type="text"
                placeholder="Search doctor..."
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              {doctorSearch && (
                <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <button
                    onClick={() => { setSelectedDoctor(undefined); setDoctorSearch(""); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    All Doctors
                  </button>
                  {filteredDoctors.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => { setSelectedDoctor(d.id); setDoctorSearch(d.fullName); }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                    >
                      <span className="font-medium">{d.fullName}</span>
                      {d.specialization && (
                        <span className="ml-2 text-xs text-gray-500">({d.specialization})</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Doctor filter display */}
            {selectedDoctor && (
              <Badge variant="light" color="primary">
                {doctors.find((d) => d.id === selectedDoctor)?.fullName || "Doctor"}
                <button onClick={() => { setSelectedDoctor(undefined); setDoctorSearch(""); }} className="ml-1">×</button>
              </Badge>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* View mode buttons */}
            <div className="flex gap-1 rounded-lg border border-gray-200 p-1 dark:border-gray-700">
              {[
                { label: "Month", view: "dayGridMonth" as const },
                { label: "Week", view: "timeGridWeek" as const },
                { label: "Day", view: "timeGridDay" as const },
              ].map((v) => (
                <button
                  key={v.view}
                  onClick={() => setCalendarView(v.view)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    calendarView === v.view
                      ? "bg-brand-500 text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-gray-600 dark:text-gray-400">{status}</span>
              </div>
            ))}
          </div>

          {/* Calendar */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={calendarView}
              key={calendarView}
              events={calendarEvents}
              dateClick={handleDateClick}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "",
              }}
              datesSet={(info) => {
                const viewStart = info.view.currentStart;
                setCurrentDate((prev) =>
                  prev.getTime() === viewStart.getTime() ? prev : viewStart
                );
              }}
              height="auto"
              dayMaxEvents={4}
              eventDisplay="block"
              eventBorderColor="transparent"
            />
          )}
        </ComponentCard>
      </div>

      {/* =========== DAY DETAIL MODAL =========== */}
      <Modal isOpen={dayModalOpen} onClose={() => setDayModalOpen(false)} className="max-w-4xl p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Time Slots — {fmtDate(selectedDate)}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {daySlots.length} slot(s) found
          </p>
        </div>

        {dayLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : daySlots.length === 0 ? (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400">
            No time slots for this date
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-auto">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {daySlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => openSlotDetail(slot)}
                  className="rounded-lg border border-gray-200 p-3 text-left transition-all hover:shadow-md dark:border-gray-700 dark:hover:border-gray-500"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {fmt(slot.startTime)} - {fmt(slot.endTime)}
                    </span>
                    <Badge variant="light" size="sm" color={statusBadgeColor(slot.status)}>
                      {slot.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{slot.doctorName}</p>
                  {slot.specialization && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">{slot.specialization}</p>
                  )}
                  {slot.appointmentCode && (
                    <p className="mt-1 text-xs text-brand-500">Appt: {slot.appointmentCode}</p>
                  )}
                  {slot.blockReason && (
                    <p className="mt-1 text-xs text-error-500">Blocked: {slot.blockReason}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* =========== SLOT DETAIL DRAWER =========== */}
      {slotDrawerOpen && selectedSlot && (
        <div className="fixed inset-0 z-[99999] flex">
          <div className="flex-1 bg-black/30" onClick={() => setSlotDrawerOpen(false)} />
          <div className="w-full max-w-md bg-white shadow-2xl dark:bg-gray-900 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Slot Detail</h3>
              <button onClick={() => setSlotDrawerOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Status badge */}
              <div className="flex items-center gap-3">
                <Badge variant="solid" color={statusBadgeColor(selectedSlot.status)}>
                  {selectedSlot.status}
                </Badge>
                {selectedSlot.source && (
                  <Badge variant="light" size="sm" color="light">
                    {selectedSlot.source}
                  </Badge>
                )}
              </div>

              {/* Doctor info */}
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedSlot.doctorName}</p>
                <p className="text-xs text-gray-500">{selectedSlot.specialization || "General"}</p>
              </div>

              {/* Time info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Date</p>
                  <p className="text-sm text-gray-900 dark:text-white">{fmtDate(selectedSlot.slotDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Time</p>
                  <p className="text-sm text-gray-900 dark:text-white">{fmt(selectedSlot.startTime)} - {fmt(selectedSlot.endTime)}</p>
                </div>
              </div>

              {/* Appointment info */}
              {selectedSlot.appointmentCode && (
                <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Appointment</p>
                  <p className="text-sm font-bold text-blue-800 dark:text-blue-300">{selectedSlot.appointmentCode}</p>
                </div>
              )}

              {/* Block info */}
              {selectedSlot.blockReason && (
                <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">Block Reason</p>
                  <p className="text-sm font-bold text-red-800 dark:text-red-300">{selectedSlot.blockReason}</p>
                  {selectedSlot.blockNote && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{selectedSlot.blockNote}</p>
                  )}
                  {selectedSlot.blockedByName && (
                    <p className="mt-1 text-xs text-red-500">By: {selectedSlot.blockedByName}</p>
                  )}
                </div>
              )}

              {/* Note */}
              {selectedSlot.note && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Note</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedSlot.note}</p>
                </div>
              )}

              {/* Audit info */}
              <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Created</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{selectedSlot.createdAt ? fmtDate(selectedSlot.createdAt) : "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Batch ID</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{selectedSlot.batchId || "-"}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                {selectedSlot.status === TimeSlotStatus.AVAILABLE && (
                  <>
                    <button
                      onClick={() => setBlockModalOpen(true)}
                      className="w-full rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500"
                    >
                      Block This Slot
                    </button>
                    <button
                      onClick={handleDeleteSlot}
                      className="w-full rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      Delete Slot
                    </button>
                  </>
                )}
                {selectedSlot.status === TimeSlotStatus.BLOCKED && (
                  <button
                    onClick={handleUnblock}
                    className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500"
                  >
                    Unblock This Slot
                  </button>
                )}
                {selectedSlot.status === TimeSlotStatus.BOOKED && (
                  <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                    This slot has an active appointment and cannot be modified.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========== BLOCK MODAL =========== */}
      <Modal isOpen={blockModalOpen} onClose={() => setBlockModalOpen(false)} className="max-w-md p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Block Time Slot</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
            <select
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {Object.values(BlockReason).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Note (optional)</label>
            <textarea
              value={blockNote}
              onChange={(e) => setBlockNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Additional note..."
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setBlockModalOpen(false)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleBlock}
              className="flex-1 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500"
            >
              Confirm Block
            </button>
          </div>
        </div>
      </Modal>
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
