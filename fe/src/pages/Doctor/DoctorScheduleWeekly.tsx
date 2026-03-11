import { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ScheduleForm from "../../components/forms/ScheduleForm";
import ScheduleExceptionForm from "../../components/forms/ScheduleExceptionForm";
import {
  getDoctorSchedules,
  createDoctorSchedule,
  updateDoctorSchedule,
  deleteDoctorSchedule,
  listTimeSlots,
  generateTimeSlots,
  addScheduleException,
  listScheduleExceptions,
  deleteScheduleException,
  DoctorScheduleDTO,
  TimeSlotDTO,
  ScheduleExceptionDTO,
  getDayName,
  getDayShortName,
} from "../../services/doctorScheduleService";

export default function DoctorScheduleWeekly() {
  // Time Slots state
  const [timeSlots, setTimeSlots] = useState<TimeSlotDTO[]>([]);

  // Schedules state
  const [schedules, setSchedules] = useState<DoctorScheduleDTO[]>([]);

  // Exceptions state
  const [exceptions, setExceptions] = useState<ScheduleExceptionDTO[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<"schedule" | "exception">("schedule");
  const [editingSchedule, setEditingSchedule] = useState<DoctorScheduleDTO | null>(null);
  const [editingException, setEditingException] = useState<ScheduleExceptionDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "schedule" | "exception"; id: number } | null>(null);
  const [generatingSlots, setGeneratingSlots] = useState(false);

  // Calculate next week dates
  const nextWeekInfo = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();

    // Calculate current week's Sunday
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - dayOfWeek);
    currentWeekStart.setHours(0, 0, 0, 0);

    // Calculate next week's Sunday
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(currentWeekStart.getDate() + 7);

    // Build dates for next week
    const dates: { dayOfWeek: number; date: Date; dateStr: string; label: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(nextWeekStart);
      date.setDate(nextWeekStart.getDate() + i);
      dates.push({
        dayOfWeek: i,
        date,
        dateStr: date.toISOString().split("T")[0],
        label: `${getDayShortName(i)} ${date.getDate()}`,
      });
    }

    return { nextWeekStart, dates };
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch schedules and exceptions
        const schedulesData = await getDoctorSchedules();
        const exceptionsData = await listScheduleExceptions();
        setSchedules(schedulesData);
        setExceptions(exceptionsData);

        // Fetch time slots for next week
        const startDate = nextWeekInfo.dates[0].dateStr;
        const endDate = nextWeekInfo.dates[6].dateStr;
        const slotsData = await listTimeSlots(startDate, endDate);
        setTimeSlots(slotsData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch data";
        setError(errorMessage);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [nextWeekInfo]);

  const handleRetry = async () => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const schedulesData = await getDoctorSchedules();
        const exceptionsData = await listScheduleExceptions();
        setSchedules(schedulesData);
        setExceptions(exceptionsData);
        const startDate = nextWeekInfo.dates[0].dateStr;
        const endDate = nextWeekInfo.dates[6].dateStr;
        const slotsData = await listTimeSlots(startDate, endDate);
        setTimeSlots(slotsData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch data";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  };

  // Schedule handlers
  const handleSubmitSchedule = async (data: Omit<DoctorScheduleDTO, "id" | "doctorId">) => {
    try {
      setSubmitting(true);

      if (editingSchedule?.id) {
        const updated = await updateDoctorSchedule(editingSchedule.id, data);
        setSchedules((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        toast.success(`Schedule for ${getDayName(data.dayOfWeek)} updated successfully`);
      } else {
        const created = await createDoctorSchedule(data);
        setSchedules((prev) => [...prev, created]);
        toast.success(`Schedule for ${getDayName(data.dayOfWeek)} created successfully`);
      }

      setEditingSchedule(null);
    } catch (err) {
      console.log(err)
      const errorMessage = err instanceof Error ? err.message : "Failed to save schedule";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      setSubmitting(true);
      await deleteDoctorSchedule(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      setDeleteConfirm(null);
      toast.success("Schedule deleted successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete schedule";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Exception handlers
  const handleSubmitException = async (data: Omit<ScheduleExceptionDTO, "id" | "doctorId">) => {
    try {
      setSubmitting(true);

      if (editingException?.id) {
        // For now, we'll delete and recreate since backend might not support update
        await deleteScheduleException(editingException.id);
        const created = await addScheduleException(data);
        setExceptions((prev) => prev.filter((e) => e.id !== editingException.id).concat(created));
        toast.success(`Exception updated successfully`);
      } else {
        const created = await addScheduleException(data);
        setExceptions((prev) => [...prev, created]);
        const exceptionType = data.exceptionType === "OFF" ? "Day off" : `${data.exceptionType} exception`;
        toast.success(`${exceptionType} added successfully`);
      }

      setEditingException(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save exception";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteException = async (id: number) => {
    try {
      setSubmitting(true);
      await deleteScheduleException(id);
      setExceptions((prev) => prev.filter((e) => e.id !== id));
      setDeleteConfirm(null);
      toast.success("Exception deleted successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete exception";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Generate time slots
  const handleGenerateSlots = async () => {
    try {
      setGeneratingSlots(true);

      const startDate = nextWeekInfo.dates[0].dateStr;
      const endDate = nextWeekInfo.dates[6].dateStr;

      await generateTimeSlots({
        startDate,
        endDate,
        overwriteExisting: false,
      });

      // Refresh time slots
      const slotsData = await listTimeSlots(startDate, endDate);
      setTimeSlots(slotsData);
      
      toast.success(`Generated ${slotsData.length} time slots for next week`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate time slots";
      toast.error(errorMessage);
    } finally {
      setGeneratingSlots(false);
    }
  };

  // Group time slots by date
  const slotsByDate = useMemo(() => {
    const grouped: { [key: string]: TimeSlotDTO[] } = {};
    timeSlots.forEach((slot) => {
      if (!grouped[slot.slotDate]) {
        grouped[slot.slotDate] = [];
      }
      grouped[slot.slotDate].push(slot);
    });
    return grouped;
  }, [timeSlots]);

  return (
    <>
      <PageMeta title="Weekly Schedule | Doctor Panel" description="Manage your weekly schedule and time slots" />
      <PageBreadcrumb pageTitle="Weekly Schedule" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Schedule</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage your working hours and time slots for next week
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGenerateSlots}
              disabled={generatingSlots || schedules.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingSlots ? "Generating..." : "Generate Time Slots"}
            </button>
            <button
              onClick={() => {
                setShowScheduleModal(true);
                setScheduleTab("schedule");
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              ⚙️ Manage Schedules
            </button>
          </div>
        </div>

        {/* Load error */}
        {error && !loading && (
          <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                  Failed to Load
                </h3>
                <p className="text-sm text-red-800 dark:text-red-300 mb-4">{error}</p>
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <svg
                className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Loading schedules...</p>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Time Slots Section */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  📅 Your Available Time Slots
                </h3>
              </div>

              <div className="p-6">
                {timeSlots.length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0121 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                      />
                    </svg>
                    <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                      No time slots generated yet
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                      Register your working schedules, then click "Generate Time Slots" to create available slots
                    </p>
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      ⚙️ Register Your Schedule
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {nextWeekInfo.dates.map((day) => (
                      <div key={day.dateStr} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{day.label}</h4>

                        {slotsByDate[day.dateStr] && slotsByDate[day.dateStr].length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {slotsByDate[day.dateStr].map((slot) => (
                              <div
                                key={slot.id}
                                className={`px-3 py-2 rounded text-sm font-medium text-center transition-colors ${
                                  slot.isAvailable
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                }`}
                              >
                                {slot.startTime} - {slot.endTime}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">No slots for this day</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Schedule Management Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  📋 Manage Working Schedules
                </h2>
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setEditingSchedule(null);
                    setEditingException(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div className="px-6 py-0 border-b border-gray-200 dark:border-gray-700 flex gap-4">
                <button
                  onClick={() => setScheduleTab("schedule")}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                    scheduleTab === "schedule"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                  }`}
                >
                  Weekly Schedules
                </button>
                <button
                  onClick={() => setScheduleTab("exception")}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                    scheduleTab === "exception"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                  }`}
                >
                  Exceptions
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                {scheduleTab === "schedule" ? (
                  <div>
                    {/* Schedule Form */}
                    {editingSchedule || editingSchedule === null ? (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                          {editingSchedule ? "Edit Weekly Schedule" : "Add New Weekly Schedule"}
                        </h3>
                        <ScheduleForm
                          schedule={editingSchedule}
                          onSubmit={handleSubmitSchedule}
                          onCancel={() => setEditingSchedule(null)}
                          isLoading={submitting}
                        />
                      </div>
                    ) : null}

                    {/* Schedules List */}
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Your Schedules for Next Week</h3>
                    {schedules.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-400 mb-3">No schedules registered yet</p>
                        {!editingSchedule && (
                          <button
                            onClick={() => setEditingSchedule({} as DoctorScheduleDTO)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                          >
                            + Add Schedule
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {schedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                          >
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {getDayName(schedule.dayOfWeek)}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {schedule.startTime} - {schedule.endTime} ({schedule.slotDuration}min slots)
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingSchedule(schedule)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded lg transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ type: "schedule", id: schedule.id! })}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!editingSchedule && schedules.length > 0 && (
                      <button
                        onClick={() => setEditingSchedule({} as DoctorScheduleDTO)}
                        className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                      >
                        + Add Another Schedule
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Exception Form */}
                    {editingException || editingException === null ? (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                          {editingException ? "Edit Exception" : "Add Exception"}
                        </h3>
                        <ScheduleExceptionForm
                          exception={editingException}
                          onSubmit={handleSubmitException}
                          onCancel={() => setEditingException(null)}
                          isLoading={submitting}
                          nextWeekStart={nextWeekInfo.nextWeekStart}
                        />
                      </div>
                    ) : null}

                    {/* Exceptions List */}
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Schedule Exceptions</h3>
                    {exceptions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-400 mb-3">No exceptions added yet</p>
                        {!editingException && (
                          <button
                            onClick={() => setEditingException({} as ScheduleExceptionDTO)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                          >
                            + Add Exception
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {exceptions.map((exc) => (
                          <div
                            key={exc.id}
                            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                          >
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{exc.exceptionDate}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {exc.exceptionType === "OFF"
                                  ? "Day Off"
                                  : exc.exceptionType === "MODIFIED"
                                    ? `Modified: ${exc.startTime} - ${exc.endTime}`
                                    : `Extra: ${exc.startTime} - ${exc.endTime}`}
                              </p>
                              {exc.reason && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Reason: {exc.reason}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingException(exc)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ type: "exception", id: exc.id! })}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!editingException && exceptions.length > 0 && (
                      <button
                        onClick={() => setEditingException({} as ScheduleExceptionDTO)}
                        className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                      >
                        + Add Another Exception
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Delete {deleteConfirm.type === "schedule" ? "Schedule" : "Exception"}?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deleteConfirm.type === "schedule") {
                      handleDeleteSchedule(deleteConfirm.id);
                    } else {
                      handleDeleteException(deleteConfirm.id);
                    }
                  }}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
