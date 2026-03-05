import { useState, useEffect, useCallback } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import timeSlotService, {
  TimeSlotTemplateDTO,
  CreateTemplateDTO,
  UpdateTemplateDTO,
  ApplyTemplateDTO,
  BulkCreatePreviewDTO,
  BulkActionResultDTO,
  TimeSlotConfigDTO,
  BreakTimeDTO,
  DoctorBasicDTO,
  DayOfWeek,
} from "../../services/timeSlotService";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu",
  FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
};
const DAYS = Object.values(DayOfWeek);
const DURATIONS = [15, 20, 30, 45, 60];

export default function TimeSlotTemplates() {
  const [templates, setTemplates] = useState<TimeSlotTemplateDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TimeSlotTemplateDTO | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotConfigDTO[]>([{ startTime: "08:00", endTime: "12:00" }, { startTime: "13:00", endTime: "17:00" }]);
  const [breakTimes, setBreakTimes] = useState<BreakTimeDTO[]>([{ startTime: "12:00", endTime: "13:00" }]);
  const [slotDuration, setSlotDuration] = useState(30);
  const [isActive, setIsActive] = useState(true);

  // Apply modal
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyTemplateId, setApplyTemplateId] = useState<number | null>(null);
  const [applyTemplateName, setApplyTemplateName] = useState("");
  const [doctors, setDoctors] = useState<DoctorBasicDTO[]>([]);
  const [applyDoctorIds, setApplyDoctorIds] = useState<number[]>([]);
  const [applyStart, setApplyStart] = useState("");
  const [applyEnd, setApplyEnd] = useState("");
  const [applyConflict, setApplyConflict] = useState("SKIP_CONFLICTS");

  // Preview & result
  const [preview, setPreview] = useState<BulkCreatePreviewDTO | null>(null);
  const [result, setResult] = useState<BulkActionResultDTO | null>(null);
  const [resultOpen, setResultOpen] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await timeSlotService.getAllTemplates(showActiveOnly);
      setTemplates(data);
    } catch (e) {
      console.error("Failed to load templates:", e);
    } finally {
      setLoading(false);
    }
  }, [showActiveOnly]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);
  useEffect(() => { timeSlotService.getDoctorsList().then(setDoctors).catch(console.error); }, []);

  // =========== TEMPLATE FORM ===========
  const openCreate = () => {
    setEditingTemplate(null);
    setTemplateName("");
    setDescription("");
    setDaysOfWeek(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]);
    setTimeSlots([{ startTime: "08:00", endTime: "12:00" }, { startTime: "13:00", endTime: "17:00" }]);
    setBreakTimes([{ startTime: "12:00", endTime: "13:00" }]);
    setSlotDuration(30);
    setIsActive(true);
    setFormOpen(true);
  };

  const openEdit = (t: TimeSlotTemplateDTO) => {
    setEditingTemplate(t);
    setTemplateName(t.templateName);
    setDescription(t.description || "");
    setDaysOfWeek([...t.daysOfWeek]);
    setTimeSlots(t.timeSlots.length > 0 ? [...t.timeSlots] : [{ startTime: "08:00", endTime: "12:00" }]);
    setBreakTimes(t.breakTimes.length > 0 ? [...t.breakTimes] : []);
    setSlotDuration(t.slotDuration);
    setIsActive(t.isActive);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!templateName.trim()) return;
    setSaving(true);
    try {
      const payload = { templateName, description: description || undefined, daysOfWeek, timeSlots, breakTimes: breakTimes.filter(b => b.startTime && b.endTime), slotDuration, isActive };
      if (editingTemplate) {
        await timeSlotService.updateTemplate(editingTemplate.id, payload as UpdateTemplateDTO);
      } else {
        await timeSlotService.createTemplate(payload as CreateTemplateDTO);
      }
      setFormOpen(false);
      fetchTemplates();
    } catch (e) {
      console.error("Save template failed:", e);
      alert("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this template?")) return;
    try {
      await timeSlotService.deleteTemplate(id);
      fetchTemplates();
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  // =========== APPLY TEMPLATE ===========
  const openApply = (t: TimeSlotTemplateDTO) => {
    setApplyTemplateId(t.id);
    setApplyTemplateName(t.templateName);
    setApplyDoctorIds([]);
    setApplyStart("");
    setApplyEnd("");
    setApplyConflict("SKIP_CONFLICTS");
    setPreview(null);
    setApplyOpen(true);
  };

  const handlePreview = async () => {
    if (!applyTemplateId || applyDoctorIds.length === 0 || !applyStart || !applyEnd) return;
    try {
      const dto: ApplyTemplateDTO = { doctorIds: applyDoctorIds, startDate: applyStart, endDate: applyEnd, conflictMode: applyConflict };
      const p = await timeSlotService.previewApplyTemplate(applyTemplateId, dto);
      setPreview(p);
    } catch (e) {
      console.error("Preview failed:", e);
      alert("Preview failed.");
    }
  };

  const handleApply = async () => {
    if (!applyTemplateId) return;
    if (!confirm(`Apply template and create ${preview?.totalSlotsToCreate || 0} slots?`)) return;
    try {
      const dto: ApplyTemplateDTO = { doctorIds: applyDoctorIds, startDate: applyStart, endDate: applyEnd, conflictMode: applyConflict };
      const res = await timeSlotService.applyTemplate(applyTemplateId, dto);
      setResult(res);
      setApplyOpen(false);
      setResultOpen(true);
    } catch (e) {
      console.error("Apply failed:", e);
      alert("Apply failed.");
    }
  };

  const toggleDay = (day: string) => setDaysOfWeek(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  const toggleApplyDoctor = (id: number) => setApplyDoctorIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <>
      <PageMeta title="Time Slot Templates | MediTech" description="Manage time slot templates" />
      <PageBreadcrumb pageTitle="Time Slot Templates" />

      <div className="space-y-6">
        <ComponentCard title="Templates">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input type="checkbox" checked={showActiveOnly} onChange={(e) => setShowActiveOnly(e.target.checked)} className="rounded" />
                Active only
              </label>
              <span className="text-sm text-gray-500">{templates.length} template(s)</span>
            </div>
            <button onClick={openCreate} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
              + New Template
            </button>
          </div>

          {loading ? (
            <div className="py-10 text-center text-gray-500">Loading...</div>
          ) : templates.length === 0 ? (
            <div className="py-10 text-center text-gray-400">No templates found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Name</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Days</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Time Ranges</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Duration</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Status</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="px-4 py-3 text-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{t.templateName}</p>
                          {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <div className="flex flex-wrap justify-center gap-1">
                          {t.daysOfWeek.map(d => (
                            <span key={d} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">{DAY_LABELS[d]}</span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <div className="space-y-0.5">
                          {t.timeSlots.map((ts, i) => (
                            <p key={i} className="text-xs text-gray-600 dark:text-gray-400">{ts.startTime} - {ts.endTime}</p>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <span className="text-sm">{t.slotDuration} min</span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <Badge variant="light" size="sm" color={t.isActive ? "success" : "dark"}>
                          {t.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openApply(t)} className="rounded-md border border-green-500 bg-white px-3 py-1.5 text-xs font-medium text-green-600 shadow-sm hover:bg-green-50 dark:bg-transparent dark:hover:bg-green-900/20">Apply</button>
                          <button onClick={() => openEdit(t)} className="rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-600">Edit</button>
                          <button onClick={() => handleDelete(t.id)} className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-600">Delete</button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ComponentCard>
      </div>

      {/* =========== CREATE / EDIT MODAL =========== */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} className="max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {editingTemplate ? "Edit Template" : "New Template"}
        </h3>
        <div className="space-y-4">
          {/* Name & description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Template Name *</label>
            <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" placeholder="e.g. Standard Weekday Schedule" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
          </div>

          {/* Days */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Days of Week</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <button key={d} onClick={() => toggleDay(d)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${daysOfWeek.includes(d) ? "bg-brand-500 text-white" : "border border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300"}`}>
                  {DAY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Slot Duration</label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button key={d} onClick={() => setSlotDuration(d)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${slotDuration === d ? "bg-brand-500 text-white" : "border border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300"}`}>
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {/* Time ranges */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Ranges</label>
              <button onClick={() => setTimeSlots([...timeSlots, { startTime: "", endTime: "" }])} className="text-xs text-brand-500">+ Add</button>
            </div>
            {timeSlots.map((ts, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <input type="time" value={ts.startTime} onChange={(e) => { const c = [...timeSlots]; c[i] = { ...c[i], startTime: e.target.value }; setTimeSlots(c); }} className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                <span className="text-xs text-gray-400">to</span>
                <input type="time" value={ts.endTime} onChange={(e) => { const c = [...timeSlots]; c[i] = { ...c[i], endTime: e.target.value }; setTimeSlots(c); }} className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                {timeSlots.length > 1 && <button onClick={() => setTimeSlots(timeSlots.filter((_, idx) => idx !== i))} className="text-xs text-red-500">×</button>}
              </div>
            ))}
          </div>

          {/* Break times */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Break Times</label>
              <button onClick={() => setBreakTimes([...breakTimes, { startTime: "", endTime: "" }])} className="text-xs text-brand-500">+ Add</button>
            </div>
            {breakTimes.map((bt, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <input type="time" value={bt.startTime} onChange={(e) => { const c = [...breakTimes]; c[i] = { ...c[i], startTime: e.target.value }; setBreakTimes(c); }} className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                <span className="text-xs text-gray-400">to</span>
                <input type="time" value={bt.endTime} onChange={(e) => { const c = [...breakTimes]; c[i] = { ...c[i], endTime: e.target.value }; setBreakTimes(c); }} className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                <button onClick={() => setBreakTimes(breakTimes.filter((_, idx) => idx !== i))} className="text-xs text-red-500">×</button>
              </div>
            ))}
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setFormOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-300">Cancel</button>
            <button onClick={handleSave} disabled={saving || !templateName.trim()} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
              {saving ? "Saving..." : editingTemplate ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      {/* =========== APPLY TEMPLATE MODAL =========== */}
      <Modal isOpen={applyOpen} onClose={() => setApplyOpen(false)} className="max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Apply Template: {applyTemplateName}</h3>
        <div className="space-y-4">
          {/* Doctors */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Select Doctors ({applyDoctorIds.length})</label>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setApplyDoctorIds(doctors.map(d => d.id))} className="text-xs text-brand-500">Select All</button>
              <button onClick={() => setApplyDoctorIds([])} className="text-xs text-gray-500">Clear</button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
              {doctors.map((d) => (
                <button key={d.id} onClick={() => toggleApplyDoctor(d.id)}
                  className={`rounded-lg border p-2 text-left text-xs transition-all ${applyDoctorIds.includes(d.id) ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900/20" : "border-gray-200 dark:border-gray-700"}`}>
                  <span className="font-medium">{d.fullName}</span>
                  <span className="ml-1 text-gray-500">{d.specialization || ""}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
              <input type="date" value={applyStart} onChange={(e) => setApplyStart(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
              <input type="date" value={applyEnd} onChange={(e) => setApplyEnd(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>

          {/* Conflict mode */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Conflict Mode</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="SKIP_CONFLICTS" checked={applyConflict === "SKIP_CONFLICTS"} onChange={(e) => setApplyConflict(e.target.value)} />
                Skip Conflicts
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="REPLACE_AVAILABLE" checked={applyConflict === "REPLACE_AVAILABLE"} onChange={(e) => setApplyConflict(e.target.value)} />
                Replace Available
              </label>
            </div>
          </div>

          {/* Preview results */}
          {preview && (
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded bg-green-50 p-2 text-center dark:bg-green-900/20">
                  <p className="text-xs text-green-600">To Create</p>
                  <p className="text-lg font-bold text-green-800 dark:text-green-300">{preview.totalSlotsToCreate}</p>
                </div>
                <div className="rounded bg-yellow-50 p-2 text-center dark:bg-yellow-900/20">
                  <p className="text-xs text-yellow-600">Conflicts</p>
                  <p className="text-lg font-bold text-yellow-800 dark:text-yellow-300">{preview.conflictCount}</p>
                </div>
                <div className="rounded bg-blue-50 p-2 text-center dark:bg-blue-900/20">
                  <p className="text-xs text-blue-600">Holiday Skips</p>
                  <p className="text-lg font-bold text-blue-800 dark:text-blue-300">{preview.skippedHolidayCount}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setApplyOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-300">Cancel</button>
            {!preview ? (
              <button onClick={handlePreview} disabled={applyDoctorIds.length === 0 || !applyStart || !applyEnd} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
                Preview
              </button>
            ) : (
              <button onClick={handleApply} disabled={(preview.totalSlotsToCreate || 0) === 0} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50">
                Apply ({preview.totalSlotsToCreate} slots)
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* =========== RESULT MODAL =========== */}
      <Modal isOpen={resultOpen} onClose={() => setResultOpen(false)} className="max-w-md p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Apply Result</h3>
        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
                <p className="text-xs text-gray-500">Processed</p>
                <p className="text-xl font-bold">{result.totalProcessed}</p>
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
            {result.message && <p className="text-sm text-gray-600 dark:text-gray-400">{result.message}</p>}
            <button onClick={() => setResultOpen(false)} className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600">Done</button>
          </div>
        )}
      </Modal>
    </>
  );
}
