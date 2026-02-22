import { useCallback, useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg, DatesSetArg } from "@fullcalendar/core";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import adminService, { Appointment } from "../../services/adminService";

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  PENDING: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e", badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  CONFIRMED: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af", badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  CHECKED_IN: { bg: "#e9d5ff", border: "#8b5cf6", text: "#5b21b6", badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  COMPLETED: { bg: "#d1fae5", border: "#10b981", text: "#065f46", badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  CANCELLED: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b", badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  NO_SHOW: { bg: "#f3f4f6", border: "#6b7280", text: "#374151", badge: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
};

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: Appointment;
}

export default function AppointmentList() {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" });

  const { isOpen, openModal, closeModal } = useModal();

  const fetchAppointments = useCallback(async (from: string, to: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getAppointments({
        from,
        to,
        status: statusFilter || undefined,
        pageNumber: 0,
        pageSize: 500,
      });

      const calendarEvents: CalendarEvent[] = data.content.map((apt) => {
        const colors = STATUS_COLORS[apt.status] || STATUS_COLORS.PENDING;
        const startDateTime = `${apt.appointmentDate}T${apt.startTime}`;
        const endDateTime = `${apt.appointmentDate}T${apt.endTime}`;

        return {
          id: apt.id.toString(),
          title: `${apt.patientName} - Dr. ${apt.doctorName}`,
          start: startDateTime,
          end: endDateTime,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text,
          extendedProps: apt,
        };
      });

      setEvents(calendarEvents);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchAppointments(dateRange.from, dateRange.to);
    }
  }, [dateRange, fetchAppointments]);

  const handleDatesSet = (info: DatesSetArg) => {
    const from = info.startStr.split("T")[0];
    const to = info.endStr.split("T")[0];
    setDateRange({ from, to });
  };

  const handleEventClick = (info: EventClickArg) => {
    const appointment = info.event.extendedProps as Appointment;
    setSelectedAppointment(appointment);
    openModal();
  };

  const formatTime = (timeStr: string) => timeStr?.substring(0, 5) || "";
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      <PageMeta title="Appointment Management | MedicalTech Dashboard" description="Manage appointments in MedicalTech" />
      <PageBreadcrumb pageTitle="Appointment Management" />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 shadow-sm">
        {/* Header + Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appointments Calendar</h3>
            {loading && <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />}
          </div>
          <div className="flex items-center gap-3">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              title="Filter by status"
              className="rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none">
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap gap-3 mb-4">
          {Object.entries(STATUS_COLORS).map(([status, colors]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.border }} />
              <span className="text-xs text-gray-600 dark:text-gray-400">{status.replace("_", " ")}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Calendar */}
        <div className="appointment-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            buttonText={{
              today: "Today",
              month: "Month",
              week: "Week",
              day: "Day",
              list: "List",
            }}
            events={events}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            height="auto"
            editable={false}
            selectable={false}
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              meridiem: false,
              hour12: false,
            }}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
            weekends={true}
            dayMaxEvents={3}
            moreLinkText={(n) => `+${n} more`}
            eventContent={(eventInfo) => {
              const apt = eventInfo.event.extendedProps as Appointment;
              return (
                <div className="px-1 py-0.5 text-xs overflow-hidden cursor-pointer">
                  <div className="font-semibold truncate">{apt.patientName}</div>
                  <div className="truncate opacity-80">Dr. {apt.doctorName}</div>
                  {eventInfo.timeText && (
                    <div className="opacity-70">{eventInfo.timeText}</div>
                  )}
                </div>
              );
            }}
          />
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(STATUS_COLORS).map(([status, colors]) => {
            const count = events.filter((e) => e.extendedProps.status === status).length;
            return (
              <div key={status} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
                <div className="text-2xl font-bold" style={{ color: colors.border }}>{count}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{status.replace("_", " ")}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====== APPOINTMENT DETAIL MODAL ====== */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-lg m-4">
        {selectedAppointment && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appointment Details</h3>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[selectedAppointment.status]?.badge || ""}`}>
                {selectedAppointment.status}
              </span>
            </div>

            <div className="space-y-4">
              {/* Code */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Appointment Code</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedAppointment.appointmentCode}</p>
                </div>
              </div>

              {/* Patient */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Patient</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedAppointment.patientName}</p>
                  {selectedAppointment.patientPhone && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{selectedAppointment.patientPhone}</p>
                  )}
                </div>
              </div>

              {/* Doctor */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Doctor</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Dr. {selectedAppointment.doctorName}</p>
                  {selectedAppointment.doctorSpecialization && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{selectedAppointment.doctorSpecialization}</p>
                  )}
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Date & Time</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(selectedAppointment.appointmentDate)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(selectedAppointment.startTime)} - {formatTime(selectedAppointment.endTime)}
                  </p>
                </div>
              </div>

              {/* Queue Number */}
              {selectedAppointment.queueNumber && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Queue Number</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">#{selectedAppointment.queueNumber}</p>
                  </div>
                </div>
              )}

              {/* Reason */}
              {selectedAppointment.reasonForVisit && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reason for Visit</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedAppointment.reasonForVisit}</p>
                </div>
              )}

              {/* Symptoms */}
              {selectedAppointment.symptoms && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Symptoms</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedAppointment.symptoms}</p>
                </div>
              )}

              {/* Notes */}
              {selectedAppointment.notes && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedAppointment.notes}</p>
                </div>
              )}

              {/* Cancellation Reason */}
              {selectedAppointment.cancellationReason && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-xs text-red-500 dark:text-red-400 mb-1">Cancellation Reason</p>
                  <p className="text-sm text-red-800 dark:text-red-300">{selectedAppointment.cancellationReason}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={closeModal}
                className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Custom Calendar Styles */}
      <style>{`
        .appointment-calendar .fc {
          font-family: inherit;
        }
        .appointment-calendar .fc-toolbar-title {
          font-size: 1.25rem !important;
          font-weight: 600;
        }
        .appointment-calendar .fc-button {
          background-color: #f3f4f6 !important;
          border-color: #e5e7eb !important;
          color: #374151 !important;
          font-size: 0.875rem !important;
          padding: 0.4rem 0.75rem !important;
          border-radius: 0.5rem !important;
          font-weight: 500 !important;
        }
        .appointment-calendar .fc-button:hover {
          background-color: #e5e7eb !important;
        }
        .appointment-calendar .fc-button-active {
          background-color: #14b8a6 !important;
          border-color: #14b8a6 !important;
          color: white !important;
        }
        .appointment-calendar .fc-today-button {
          background-color: #14b8a6 !important;
          border-color: #14b8a6 !important;
          color: white !important;
        }
        .appointment-calendar .fc-today-button:disabled {
          opacity: 0.5;
        }
        .appointment-calendar .fc-day-today {
          background-color: #f0fdfa !important;
        }
        .appointment-calendar .fc-event {
          border-radius: 4px !important;
          border-width: 2px !important;
          cursor: pointer;
        }
        .appointment-calendar .fc-event:hover {
          opacity: 0.85;
          transform: translateY(-1px);
          transition: all 0.15s;
        }
        .appointment-calendar .fc-daygrid-more-link {
          color: #14b8a6 !important;
          font-weight: 600;
        }
        .appointment-calendar .fc th {
          padding: 0.75rem 0;
          font-weight: 600;
          color: #6b7280;
          font-size: 0.8rem;
          text-transform: uppercase;
        }
        .appointment-calendar .fc td {
          border-color: #e5e7eb;
        }
        .appointment-calendar .fc th {
          border-color: #e5e7eb;
        }
        .dark .appointment-calendar .fc-button {
          background-color: #1f2937 !important;
          border-color: #374151 !important;
          color: #d1d5db !important;
        }
        .dark .appointment-calendar .fc-button:hover {
          background-color: #374151 !important;
        }
        .dark .appointment-calendar .fc-button-active {
          background-color: #14b8a6 !important;
          border-color: #14b8a6 !important;
          color: white !important;
        }
        .dark .appointment-calendar .fc-toolbar-title {
          color: #f9fafb;
        }
        .dark .appointment-calendar .fc-day-today {
          background-color: rgba(20, 184, 166, 0.1) !important;
        }
        .dark .appointment-calendar .fc td,
        .dark .appointment-calendar .fc th {
          border-color: #374151;
        }
        .dark .appointment-calendar .fc th {
          color: #9ca3af;
        }
        .dark .appointment-calendar .fc-col-header-cell {
          color: #9ca3af;
        }
        .dark .appointment-calendar .fc-daygrid-day-number {
          color: #d1d5db;
        }
        .dark .appointment-calendar .fc-list-day-cushion {
          background-color: #1f2937 !important;
        }
      `}</style>
    </>
  );
}

