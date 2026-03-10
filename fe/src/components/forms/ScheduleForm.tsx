import { useState } from "react";
import { DoctorScheduleDTO } from "../../services/doctorScheduleService";

interface ScheduleFormProps {
  schedule?: DoctorScheduleDTO | null;
  onSubmit: (data: Omit<DoctorScheduleDTO, "id" | "doctorId">) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  dayOfWeekFilter?: number; // Pre-fill day if provided
}

export default function ScheduleForm({
  schedule,
  onSubmit,
  onCancel,
  isLoading = false,
  dayOfWeekFilter,
}: ScheduleFormProps) {
  const [formData, setFormData] = useState<Omit<DoctorScheduleDTO, "id" | "doctorId">>({
    dayOfWeek: dayOfWeekFilter ?? schedule?.dayOfWeek ?? 1,
    startTime: schedule?.startTime ?? "09:00",
    endTime: schedule?.endTime ?? "17:00",
    slotDuration: schedule?.slotDuration ?? 30,
    maxPatients: schedule?.maxPatients ?? 20,
    isActive: schedule?.isActive ?? true,
  });

  const [error, setError] = useState<string | null>(null);

  const days = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  const validateForm = () => {
    if (!formData.startTime || !formData.endTime) {
      setError("Start time and end time are required");
      return false;
    }

    if (formData.startTime >= formData.endTime) {
      setError("End time must be after start time");
      return false;
    }

    if (formData.slotDuration < 10 || formData.slotDuration > 120) {
      setError("Slot duration must be between 10 and 120 minutes");
      return false;
    }

    if (formData.maxPatients < 1 || formData.maxPatients > 100) {
      setError("Max patients must be between 1 and 100");
      return false;
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
      setError(
        err instanceof Error ? err.message : "Failed to save schedule"
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Day of Week */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Day of Week
        </label>
        <select
          value={formData.dayOfWeek}
          onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
          disabled={!!schedule}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {days.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </div>

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

      {/* Slot Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Slot Duration (minutes)
        </label>
        <input
          type="number"
          min="10"
          max="120"
          value={formData.slotDuration}
          onChange={(e) => setFormData({ ...formData, slotDuration: parseInt(e.target.value) })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Duration per appointment slot (10-120 minutes)
        </p>
      </div>

      {/* Max Patients */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Max Patients per Day
        </label>
        <input
          type="number"
          min="1"
          max="100"
          value={formData.maxPatients}
          onChange={(e) => setFormData({ ...formData, maxPatients: parseInt(e.target.value) })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Maximum number of patients for this schedule (1-100)
        </p>
      </div>

      {/* Active Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
          Active
        </label>
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
          {isLoading ? "Saving..." : schedule ? "Update Schedule" : "Create Schedule"}
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
