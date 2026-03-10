import { useState } from "react";
import { ExceptionType, ScheduleExceptionDTO } from "../../services/doctorScheduleService";

interface ScheduleExceptionFormProps {
  exception?: ScheduleExceptionDTO | null;
  onSubmit: (data: Omit<ScheduleExceptionDTO, "id" | "doctorId">) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  nextWeekStart?: Date; // To limit date selection to next week
}

export default function ScheduleExceptionForm({
  exception,
  onSubmit,
  onCancel,
  isLoading = false,
  nextWeekStart,
}: ScheduleExceptionFormProps) {
  const [formData, setFormData] = useState<Omit<ScheduleExceptionDTO, "id" | "doctorId">>({
    exceptionDate: exception?.exceptionDate ?? "",
    exceptionType: exception?.exceptionType ?? "OFF",
    startTime: exception?.startTime ?? "09:00",
    endTime: exception?.endTime ?? "17:00",
    reason: exception?.reason ?? "",
  });

  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const exceptionTypes: ExceptionType[] = ["OFF", "MODIFIED", "EXTRA"];

  // Calculate min/max dates for next week
  const getDateRange = () => {
    if (!nextWeekStart) {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { min: start, max: end };
    }
    const min = new Date(nextWeekStart);
    const max = new Date(nextWeekStart);
    max.setDate(nextWeekStart.getDate() + 6);
    return { min, max };
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const parseDate = (dateStr: string) => {
    return new Date(dateStr + "T00:00:00");
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = parseDate(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" });
  };

  const { min, max } = getDateRange();

  // Generate calendar days for next week
  const calendarDays = (() => {
    const days = [];
    const current = new Date(min);
    while (current <= max) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  })();

  const validateForm = () => {
    if (!formData.exceptionDate) {
      setError("Date is required");
      return false;
    }

    if (formData.exceptionType !== "OFF") {
      if (!formData.startTime || !formData.endTime) {
        setError("Start time and end time are required for MODIFIED and EXTRA exceptions");
        return false;
      }

      if (formData.startTime >= formData.endTime) {
        setError("End time must be after start time");
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save exception");
    }
  };

  const handleDateSelect = (date: Date) => {
    setFormData({ ...formData, exceptionDate: formatDate(date) });
    setShowDatePicker(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date with Calendar Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Date
        </label>

        {/* Selected Date Display */}
        <button
          type="button"
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-left bg-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {formData.exceptionDate ? (
            <span className="text-gray-900 dark:text-white font-medium">
              {formatDisplayDate(formData.exceptionDate)}
            </span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">Select a date...</span>
          )}
        </button>

        {/* Calendar Picker */}
        {showDatePicker && (
          <div className="absolute z-10 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4">
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Next Week
              </p>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((date) => {
                const dateStr = formatDate(date);
                const isSelected = formData.exceptionDate === dateStr;
                const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
                const dayNum = date.getDate();

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    className={`p-2 rounded text-center transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white dark:bg-blue-700"
                        : "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white hover:bg-blue-100 dark:hover:bg-gray-600"
                    }`}
                  >
                    <div className="text-xs font-medium">{dayName}</div>
                    <div className="text-sm font-semibold">{dayNum}</div>
                  </button>
                );
              })}
            </div>

            {/* Close hint */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
              Click a date to select
            </p>
          </div>
        )}

        {/* Close picker when clicking outside */}
        {showDatePicker && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setShowDatePicker(false)}
          />
        )}

        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Select a date within next week
        </p>
      </div>

      {/* Exception Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Exception Type
        </label>
        <select
          value={formData.exceptionType}
          onChange={(e) =>
            setFormData({ ...formData, exceptionType: e.target.value as ExceptionType })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {exceptionTypes.map((type) => (
            <option key={type} value={type}>
              {type === "OFF"
                ? "Day Off"
                : type === "MODIFIED"
                  ? "Modified Hours"
                  : "Extra Hours"}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {formData.exceptionType === "OFF"
            ? "Doctor takes this day off"
            : formData.exceptionType === "MODIFIED"
              ? "Doctor works different hours on this date"
              : "Doctor works full schedule + extra hours"}
        </p>
      </div>

      {/* Time fields for MODIFIED and EXTRA */}
      {formData.exceptionType !== "OFF" && (
        <>
          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Time
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Time
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      {/* Reason/Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Reason (optional)
        </label>
        <input
          type="text"
          placeholder="E.g., Medical conference, Emergency, etc."
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving..." : exception ? "Update Exception" : "Add Exception"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
