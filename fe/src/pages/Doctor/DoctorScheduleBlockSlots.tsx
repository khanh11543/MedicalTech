import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import BlockSlotModal from "../../components/modals/BlockSlotModal";
import {
  listTimeSlots,
  blockTimeSlot,
  unblockTimeSlot,
  TimeSlotDTO,
  getDayShortName,
} from "../../services/doctorScheduleService";

interface TimeRange {
  hours: number;
  slots: TimeSlotDTO[];
}

interface DaySlots {
  date: string;
  dayOfWeek: string;
  dayNum: string;
  dayLabel: string;
  timeRanges: TimeRange[];
}

export default function DoctorScheduleBlockSlots() {
  const [timeSlots, setTimeSlots] = useState<TimeSlotDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockedSlotIds, setBlockedSlotIds] = useState<Set<number>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // Modal state
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotDTO | null>(null);
  const [blockingSlotId, setBlockingSlotId] = useState<number | null>(null);

  // Calculate a date range (2 weeks from today for more slots to view)
  const dateRange = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();

    // Calculate current week's Sunday
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - dayOfWeek);
    currentWeekStart.setHours(0, 0, 0, 0);

    // Calculate 2 weeks from now
    const endDate = new Date(currentWeekStart);
    endDate.setDate(currentWeekStart.getDate() + 14);

    return {
      startDate: currentWeekStart.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  }, []);

  // Fetch time slots
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setLoading(true);
        setError(null);
        const slots = await listTimeSlots(dateRange.startDate, dateRange.endDate);
        setTimeSlots(slots);

        // Extract blocked slots
        const blocked = new Set<number>();
        slots.forEach((slot) => {
          if (!slot.status || slot.status === "BLOCKED") {
            blocked.add(slot.id!);
          }
        });
        setBlockedSlotIds(blocked);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to load time slots";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [dateRange]);

  // Group slots by day and time range
  const daySlotsList = useMemo(() => {
    const grouped: { [key: string]: TimeSlotDTO[] } = {};

    timeSlots.forEach((slot) => {
      if (!grouped[slot.slotDate]) {
        grouped[slot.slotDate] = [];
      }
      grouped[slot.slotDate].push(slot);
    });

    // Sort slots by date and time
    const result: DaySlots[] = Object.entries(grouped)
      .map(([date, slots]) => {
        const dateObj = new Date(date + "T00:00:00");
        const dayOfWeek = dateObj.getDay();
        const dayNum = dateObj.getDate();
        const dayLabel = dateObj.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

        // Group by hour for visual timeline
        const timeRanges: TimeRange[] = [];
        const hourGroups: { [hour: number]: TimeSlotDTO[] } = {};

        slots.forEach((slot) => {
          const hour = parseInt(slot.startTime.split(":")[0]);
          if (!hourGroups[hour]) {
            hourGroups[hour] = [];
          }
          hourGroups[hour].push(slot);
        });

        Object.entries(hourGroups)
          .sort(([h1], [h2]) => parseInt(h1) - parseInt(h2))
          .forEach(([hour, hourSlots]) => {
            timeRanges.push({
              hours: parseInt(hour),
              slots: hourSlots.sort((a, b) => a.startTime.localeCompare(b.startTime)),
            });
          });

        return {
          date,
          dayOfWeek: getDayShortName(dayOfWeek),
          dayNum: dayNum.toString(),
          dayLabel,
          timeRanges,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }, [timeSlots]);

  // Check if a slot can be blocked (before start time)
  const canBlockSlot = (slot: TimeSlotDTO): boolean => {
    if (blockedSlotIds.has(slot.id!)) return false;

    const [slotDate, slotTime] = [slot.slotDate, slot.startTime];
    const now = new Date();
    const slotDateTime = new Date(slotDate + "T" + slotTime);

    return slotDateTime > now;
  };

  // Check if a slot can be unblocked (before start time)
  const canUnblockSlot = (slot: TimeSlotDTO): boolean => {
    if (!blockedSlotIds.has(slot.id!)) return false;

    const [slotDate, slotTime] = [slot.slotDate, slot.startTime];
    const now = new Date();
    const slotDateTime = new Date(slotDate + "T" + slotTime);

    return slotDateTime > now;
  };

  // Toggle day expansion
  const toggleDayExpansion = (date: string) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  // Handle block slot
  const handleBlockSlot = async (reason: string) => {
    if (!selectedSlot || !blockingSlotId) return;

    try {
      setBlockingSlotId(blockingSlotId);
      await blockTimeSlot(blockingSlotId, reason);

      // Update local state
      setBlockedSlotIds((prev) => new Set([...prev, blockingSlotId]));
      setShowBlockModal(false);
      setSelectedSlot(null);
      setBlockingSlotId(null);

      toast.success("Time slot blocked successfully");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to block slot";
      toast.error(errorMsg);
    }
  };

  // Handle unblock slot
  const handleUnblockSlot = async (slotId: number) => {
    try {
      await unblockTimeSlot(slotId);

      // Update local state
      setBlockedSlotIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(slotId);
        return newSet;
      });

      toast.success("Time slot unblocked successfully");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to unblock slot";
      toast.error(errorMsg);
    }
  };

  return (
    <>
      <PageMeta title="Block Slots | Doctor Panel" description="Block or unblock your appointment slots" />
      <PageBreadcrumb pageTitle="Block Slots" />

      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Block Time Slots
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your availability by blocking slots for emergencies, meetings, or personal time
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {timeSlots.length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total slots</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">Loading time slots...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : timeSlots.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Time Slots Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Generate time slots from your weekly schedules to manage them here
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {daySlotsList.map((day) => (
              <div
                key={day.date}
                className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden"
              >
                {/* Day Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <button
                    onClick={() => toggleDayExpansion(day.date)}
                    className="w-full flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {day.dayNum}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {day.dayOfWeek}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {day.dayLabel}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {day.timeRanges.reduce((sum, range) => sum + range.slots.length, 0)} slots
                      </div>
                      <div className={`text-xl transition-transform ${expandedDays.has(day.date) ? 'rotate-180' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Timeline */}
                {expandedDays.has(day.date) && (
                <div className="p-6 space-y-4 animate-in fade-in duration-200">
                  {day.timeRanges.map((timeRange, idx) => (
                    <div key={idx}>
                      {/* Time Label */}
                      <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 ml-2">
                        {String(timeRange.hours).padStart(2, "0")}:00
                      </div>

                      {/* Slots Grid for this hour */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {timeRange.slots.map((slot) => {
                          const isBlocked = blockedSlotIds.has(slot.id!);
                          const canBlock = canBlockSlot(slot);
                          const canUnblock = canUnblockSlot(slot);

                          return (
                            <div
                              key={slot.id}
                              className={`relative group p-4 rounded-xl border-2 transition-all cursor-pointer
                                ${
                                  isBlocked
                                    ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                                    : "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 hover:border-green-500 dark:hover:border-green-500"
                                }
                              `}
                            >
                              {/* Slot Info */}
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {slot.startTime} - {slot.endTime}
                                  </div>
                                  <div className={`text-sm mt-1 ${
                                    isBlocked
                                      ? "text-red-700 dark:text-red-400"
                                      : "text-green-700 dark:text-green-400"
                                  }`}>
                                    {isBlocked ? "🚫 Blocked" : "✓ Available"}
                                  </div>
                                </div>

                                {/* Status Badge */}
                                <div className={`text-xs font-bold px-2 py-1 rounded ${
                                  isBlocked
                                    ? "bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200"
                                    : "bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200"
                                }`}>
                                  {isBlocked ? "BLOCKED" : "FREE"}
                                </div>
                              </div>

                              {/* Action Buttons on Hover */}
                              {(canBlock || canUnblock) && (
                                <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  {canBlock && (
                                    <button
                                      onClick={() => {
                                        setSelectedSlot(slot);
                                        setBlockingSlotId(slot.id!);
                                        setShowBlockModal(true);
                                      }}
                                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                                    >
                                      <span>🚫</span>
                                      Block
                                    </button>
                                  )}
                                  {canUnblock && (
                                    <button
                                      onClick={() => handleUnblockSlot(slot.id!)}
                                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                                    >
                                      <span>✓</span>
                                      Unblock
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Disabled State Message */}
                              {!canBlock && !canUnblock && (
                                <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="text-white text-xs font-medium text-center px-2">
                                    {isBlocked ? "Already blocked" : "Slot has passed"}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Block Slot Modal */}
      {selectedSlot && (
        <BlockSlotModal
          isOpen={showBlockModal}
          slotTime={`${selectedSlot.startTime} - ${selectedSlot.endTime}`}
          slotDate={new Date(selectedSlot.slotDate + "T00:00:00").toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
          onConfirm={handleBlockSlot}
          onCancel={() => {
            setShowBlockModal(false);
            setSelectedSlot(null);
            setBlockingSlotId(null);
          }}
          isLoading={blockingSlotId !== null}
        />
      )}
    </>
  );
}
