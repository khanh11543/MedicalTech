import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";
import timeSlotService, {
  BulkCreateSlotsDTO,
  BulkCreatePreviewDTO,
  BulkActionResultDTO,
  TimeSlotConfigDTO,
  BreakTimeDTO,
  DoctorBasicDTO,
  DayOfWeek,
} from "../../services/timeSlotService";

// =========== CONSTANTS ===========
const DAYS = Object.values(DayOfWeek);
const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu",
  FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
};
const DURATIONS = [15, 20, 30, 45, 60];

// =========== STEP INDICATOR ===========
const StepIndicator: React.FC<{ steps: string[]; current: number }> = ({ steps, current }) => (
  <div className="flex items-center gap-2 mb-6">
    {steps.map((s, i) => (
      <div key={s} className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
          i <= current ? "bg-brand-500 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700"
        }`}>
          {i < current ? "✓" : i + 1}
        </div>
        <span className={`text-sm ${i <= current ? "font-medium text-gray-900 dark:text-white" : "text-gray-400"}`}>{s}</span>
        {i < steps.length - 1 && <div className={`h-px w-8 ${i < current ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"}`} />}
      </div>
    ))}
  </div>
);

export default function TimeSlotBulkCreate() {
  const [step, setStep] = useState(0);
  const steps = ["Select Doctors", "Date Range & Days", "Time Configuration", "Preview & Confirm"];

  // Step 1: Doctors
  const [doctors, setDoctors] = useState<DoctorBasicDTO[]>([]);
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<number[]>([]);
  const [doctorSearch, setDoctorSearch] = useState("");

  // Step 2: Date range + days
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]);

  // Step 3: Time config
  const [timeSlots, setTimeSlots] = useState<TimeSlotConfigDTO[]>([{ startTime: "08:00", endTime: "12:00" }, { startTime: "13:00", endTime: "17:00" }]);
  const [breakTimes, setBreakTimes] = useState<BreakTimeDTO[]>([{ startTime: "12:00", endTime: "13:00" }]);
  const [slotDuration, setSlotDuration] = useState(30);
  const [conflictMode, setConflictMode] = useState("SKIP_CONFLICTS");

  // Step 4: Preview
  const [preview, setPreview] = useState<BulkCreatePreviewDTO | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Result
  const [result, setResult] = useState<BulkActionResultDTO | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    timeSlotService.getDoctorsList().then(setDoctors).catch(console.error);
  }, []);

  const filteredDoctors = doctors.filter(
    (d) =>
      d.fullName.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      (d.specialization || "").toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const toggleDoctor = (id: number) => {
    setSelectedDoctorIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const addTimeSlot = () => setTimeSlots([...timeSlots, { startTime: "", endTime: "" }]);
  const removeTimeSlot = (i: number) => setTimeSlots(timeSlots.filter((_, idx) => idx !== i));
  const updateTimeSlot = (i: number, field: keyof TimeSlotConfigDTO, val: string) => {
    const copy = [...timeSlots];
    copy[i] = { ...copy[i], [field]: val };
    setTimeSlots(copy);
  };

  const addBreak = () => setBreakTimes([...breakTimes, { startTime: "", endTime: "" }]);
  const removeBreak = (i: number) => setBreakTimes(breakTimes.filter((_, idx) => idx !== i));
  const updateBreak = (i: number, field: keyof BreakTimeDTO, val: string) => {
    const copy = [...breakTimes];
    copy[i] = { ...copy[i], [field]: val };
    setBreakTimes(copy);
  };

  const buildDTO = (): BulkCreateSlotsDTO => ({
    doctorIds: selectedDoctorIds,
    startDate,
    endDate,
    daysOfWeek: selectedDays,
    timeSlots,
    breakTimes: breakTimes.filter((b) => b.startTime && b.endTime),
    slotDuration,
    conflictMode,
  });

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await timeSlotService.previewBulkCreate(buildDTO());
      setPreview(res);
      setStep(3);
    } catch (e) {
      console.error("Preview failed:", e);
      alert("Preview failed. Check console for details.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!confirm(`Create ${preview?.totalSlotsToCreate || 0} time slots?`)) return;
    setCreating(true);
    try {
      const res = await timeSlotService.bulkCreateSlots(buildDTO());
      setResult(res);
      setResultModalOpen(true);
    } catch (e) {
      console.error("Bulk create failed:", e);
      alert("Bulk creation failed. Check console.");
    } finally {
      setCreating(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return selectedDoctorIds.length > 0;
      case 1: return startDate && endDate && selectedDays.length > 0 && startDate <= endDate;
      case 2: return timeSlots.length > 0 && timeSlots.every((t) => t.startTime && t.endTime);
      default: return true;
    }
  };

  const resetForm = () => {
    setStep(0);
    setSelectedDoctorIds([]);
    setStartDate("");
    setEndDate("");
    setSelectedDays(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]);
    setTimeSlots([{ startTime: "08:00", endTime: "12:00" }, { startTime: "13:00", endTime: "17:00" }]);
    setBreakTimes([{ startTime: "12:00", endTime: "13:00" }]);
    setSlotDuration(30);
    setConflictMode("SKIP_CONFLICTS");
    setPreview(null);
    setResult(null);
  };

  return (
    <>
      <PageMeta title="Bulk Create Time Slots | MediTech" description="Create time slots in bulk" />
      <PageBreadcrumb pageTitle="Bulk Create Time Slots" />

      <div className="space-y-6">
        <ComponentCard title="Bulk Create Wizard">
          <StepIndicator steps={steps} current={step} />

          {/* =========== STEP 0: SELECT DOCTORS =========== */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search doctors..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <button
                  onClick={() => setSelectedDoctorIds(doctors.map((d) => d.id))}
                  className="text-sm text-brand-500 hover:text-brand-600"
                >
                  Select All
                </button>
                <button onClick={() => setSelectedDoctorIds([])} className="text-sm text-gray-500 hover:text-gray-700">
                  Clear
                </button>
              </div>
              {selectedDoctorIds.length > 0 && (
                <p className="text-sm text-brand-600 dark:text-brand-400">{selectedDoctorIds.length} doctor(s) selected</p>
              )}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[50vh] overflow-y-auto">
                {filteredDoctors.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => toggleDoctor(d.id)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                      selectedDoctorIds.includes(d.id)
                        ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900/20"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      selectedDoctorIds.includes(d.id) ? "bg-brand-500 text-white" : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    }`}>
                      {selectedDoctorIds.includes(d.id) ? "✓" : d.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{d.fullName}</p>
                      <p className="text-xs text-gray-500">{d.specialization || "General"}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* =========== STEP 1: DATE RANGE & DAYS =========== */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Days of Week</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        selectedDays.includes(day)
                          ? "bg-brand-500 text-white"
                          : "border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      {DAY_LABELS[day]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedDays(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"])}
                  className="text-sm text-brand-500 hover:text-brand-600"
                >
                  Weekdays only
                </button>
                <button onClick={() => setSelectedDays(DAYS)} className="text-sm text-brand-500 hover:text-brand-600">
                  All days
                </button>
              </div>
            </div>
          )}

          {/* =========== STEP 2: TIME CONFIG =========== */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Slot Duration */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Slot Duration (minutes)</label>
                <div className="flex flex-wrap gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setSlotDuration(d)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium ${
                        slotDuration === d ? "bg-brand-500 text-white" : "border border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Ranges */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Working Time Ranges</label>
                  <button onClick={addTimeSlot} className="text-sm text-brand-500 hover:text-brand-600">+ Add Range</button>
                </div>
                <div className="space-y-2">
                  {timeSlots.map((ts, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input type="time" value={ts.startTime} onChange={(e) => updateTimeSlot(i, "startTime", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                      <span className="text-gray-500">to</span>
                      <input type="time" value={ts.endTime} onChange={(e) => updateTimeSlot(i, "endTime", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                      {timeSlots.length > 1 && (
                        <button onClick={() => removeTimeSlot(i)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Breaks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Break Times</label>
                  <button onClick={addBreak} className="text-sm text-brand-500 hover:text-brand-600">+ Add Break</button>
                </div>
                <div className="space-y-2">
                  {breakTimes.map((bt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input type="time" value={bt.startTime} onChange={(e) => updateBreak(i, "startTime", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                      <span className="text-gray-500">to</span>
                      <input type="time" value={bt.endTime} onChange={(e) => updateBreak(i, "endTime", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                      <button onClick={() => removeBreak(i)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conflict Mode */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Conflict Mode</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" value="SKIP_CONFLICTS" checked={conflictMode === "SKIP_CONFLICTS"} onChange={(e) => setConflictMode(e.target.value)} className="text-brand-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Skip Conflicts</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" value="REPLACE_AVAILABLE" checked={conflictMode === "REPLACE_AVAILABLE"} onChange={(e) => setConflictMode(e.target.value)} className="text-brand-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Replace Available</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* =========== STEP 3: PREVIEW =========== */}
          {step === 3 && preview && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Slots to Create</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-300">{preview.totalSlotsToCreate}</p>
                </div>
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Conflicts</p>
                  <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">{preview.conflictCount}</p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Holiday Skips</p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{preview.skippedHolidayCount}</p>
                </div>
              </div>

              {/* Conflicts */}
              {preview.conflicts.length > 0 && (
                <div className="rounded-lg border border-yellow-200 p-4 dark:border-yellow-800">
                  <h4 className="mb-2 text-sm font-medium text-yellow-700 dark:text-yellow-400">Conflict Details</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {preview.conflicts.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Badge variant="light" size="sm" color="warning">{c.existingStatus}</Badge>
                        <span>{c.doctorName}</span>
                        <span>{c.date}</span>
                        <span>{c.startTime}-{c.endTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Holiday dates */}
              {preview.holidayDates.length > 0 && (
                <div className="rounded-lg border border-blue-200 p-4 dark:border-blue-800">
                  <h4 className="mb-2 text-sm font-medium text-blue-700 dark:text-blue-400">Skipped Holiday Dates</h4>
                  <div className="flex flex-wrap gap-2">
                    {preview.holidayDates.map((d) => (
                      <Badge key={d} variant="light" size="sm" color="info">{d}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Config summary */}
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Configuration Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Doctors: {selectedDoctorIds.length}</span>
                  <span>Duration: {slotDuration} min</span>
                  <span>Date Range: {startDate} → {endDate}</span>
                  <span>Days: {selectedDays.map((d) => DAY_LABELS[d]).join(", ")}</span>
                  <span>Conflict: {conflictMode}</span>
                </div>
              </div>
            </div>
          )}

          {/* =========== NAVIGATION BUTTONS =========== */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700">Reset</button>
              {step < 2 && (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  Next
                </button>
              )}
              {step === 2 && (
                <button
                  onClick={handlePreview}
                  disabled={!canProceed() || previewLoading}
                  className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {previewLoading ? "Loading..." : "Preview"}
                </button>
              )}
              {step === 3 && (
                <button
                  onClick={handleCreate}
                  disabled={creating || (preview?.totalSlotsToCreate || 0) === 0}
                  className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50"
                >
                  {creating ? "Creating..." : `Create ${preview?.totalSlotsToCreate || 0} Slots`}
                </button>
              )}
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* =========== RESULT MODAL =========== */}
      <Modal isOpen={resultModalOpen} onClose={() => { setResultModalOpen(false); resetForm(); }} className="max-w-lg p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Bulk Create Result</h3>
        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
                <p className="text-xs text-gray-500">Processed</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{result.totalProcessed}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-center dark:bg-green-900/20">
                <p className="text-xs text-green-600">Success</p>
                <p className="text-xl font-bold text-green-800 dark:text-green-300">{result.successCount}</p>
              </div>
              <div className="rounded-lg bg-red-50 p-3 text-center dark:bg-red-900/20">
                <p className="text-xs text-red-600">Failed</p>
                <p className="text-xl font-bold text-red-800 dark:text-red-300">{result.failCount}</p>
              </div>
            </div>
            {result.message && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{result.message}</p>
            )}
            <button
              onClick={() => { setResultModalOpen(false); resetForm(); }}
              className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Done
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
