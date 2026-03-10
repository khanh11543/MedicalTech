import { useState, useEffect, useCallback } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import timeSlotService, {
  ClinicWorkingHoursDTO,
  ClinicHolidayDTO,
} from "../../services/timeSlotService";

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function TimeSlotRules() {
  const { toast, showToast, dismissToast } = useToast();
  const [activeTab, setActiveTab] = useState<"hours" | "holidays">("hours");

  // Working Hours
  const [workingHours, setWorkingHours] = useState<ClinicWorkingHoursDTO[]>([]);
  const [hoursLoading, setHoursLoading] = useState(true);
  const [editHour, setEditHour] = useState<ClinicWorkingHoursDTO | null>(null);
  const [hourModalOpen, setHourModalOpen] = useState(false);
  const [hourOpenTime, setHourOpenTime] = useState("08:00");
  const [hourCloseTime, setHourCloseTime] = useState("17:00");
  const [hourIsOpen, setHourIsOpen] = useState(true);
  const [hourSaving, setHourSaving] = useState(false);

  // Holidays
  const [holidays, setHolidays] = useState<ClinicHolidayDTO[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [editHoliday, setEditHoliday] = useState<ClinicHolidayDTO | null>(null);
  const [hDate, setHDate] = useState("");
  const [hName, setHName] = useState("");
  const [hDesc, setHDesc] = useState("");
  const [hAutoBlock, setHAutoBlock] = useState(true);
  const [hPreventCreate, setHPreventCreate] = useState(true);
  const [hIsActive, setHIsActive] = useState(true);
  const [holidaySaving, setHolidaySaving] = useState(false);

  const fetchWorkingHours = useCallback(async () => {
    setHoursLoading(true);
    try {
      const data = await timeSlotService.getAllWorkingHours();
      setWorkingHours(data);
    } catch (e) {
      console.error("Failed to load working hours:", e);
    } finally {
      setHoursLoading(false);
    }
  }, []);

  const fetchHolidays = useCallback(async () => {
    setHolidaysLoading(true);
    try {
      const data = await timeSlotService.getAllHolidays(selectedYear);
      setHolidays(data);
    } catch (e) {
      console.error("Failed to load holidays:", e);
    } finally {
      setHolidaysLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => { fetchWorkingHours(); }, [fetchWorkingHours]);
  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  // =========== WORKING HOURS ===========
  const openHourEdit = (h: ClinicWorkingHoursDTO) => {
    setEditHour(h);
    setHourOpenTime(h.openTime || "08:00");
    setHourCloseTime(h.closeTime || "17:00");
    setHourIsOpen(h.isOpen !== false);
    setHourModalOpen(true);
  };

  const openHourCreate = (dayOfWeek: number) => {
    setEditHour({ dayOfWeek, openTime: "08:00", closeTime: "17:00", isOpen: true, dayName: DAY_NAMES[dayOfWeek] });
    setHourOpenTime("08:00");
    setHourCloseTime("17:00");
    setHourIsOpen(true);
    setHourModalOpen(true);
  };

  const handleSaveHour = async () => {
    if (!editHour) return;
    setHourSaving(true);
    try {
      await timeSlotService.upsertWorkingHours({
        id: editHour.id,
        dayOfWeek: editHour.dayOfWeek,
        openTime: hourOpenTime,
        closeTime: hourCloseTime,
        isOpen: hourIsOpen,
      });
      setHourModalOpen(false);
      fetchWorkingHours();
      showToast("Working hours saved", "success");
    } catch (e) {
      console.error("Save working hours failed:", e);
      showToast("Save failed.", "error");
    } finally {
      setHourSaving(false);
    }
  };

  const handleDeleteHour = async (id: number) => {
    if (!confirm("Reset this day's working hours?")) return;
    try {
      await timeSlotService.deleteWorkingHours(id);
      fetchWorkingHours();
      showToast("Working hours reset", "success");
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  // =========== HOLIDAYS ===========
  const openHolidayCreate = () => {
    setEditHoliday(null);
    setHDate(`${selectedYear}-01-01`);
    setHName("");
    setHDesc("");
    setHAutoBlock(true);
    setHPreventCreate(true);
    setHIsActive(true);
    setHolidayModalOpen(true);
  };

  const openHolidayEdit = (h: ClinicHolidayDTO) => {
    setEditHoliday(h);
    setHDate(h.holidayDate);
    setHName(h.name);
    setHDesc(h.description || "");
    setHAutoBlock(h.autoBlockSlots !== false);
    setHPreventCreate(h.preventSlotCreation !== false);
    setHIsActive(h.isActive !== false);
    setHolidayModalOpen(true);
  };

  const handleSaveHoliday = async () => {
    if (!hDate || !hName) return;
    setHolidaySaving(true);
    try {
      const dto: ClinicHolidayDTO = {
        holidayDate: hDate,
        name: hName,
        description: hDesc || undefined,
        autoBlockSlots: hAutoBlock,
        preventSlotCreation: hPreventCreate,
        isActive: hIsActive,
      };
      if (editHoliday?.id) {
        await timeSlotService.updateHoliday(editHoliday.id, dto);
      } else {
        await timeSlotService.createHoliday(dto);
      }
      setHolidayModalOpen(false);
      // Auto-switch year dropdown to match the holiday's year so it appears in the list
      const holidayYear = new Date(hDate).getFullYear();
      if (holidayYear !== selectedYear) {
        setSelectedYear(holidayYear);
      } else {
        fetchHolidays();
      }
      showToast(editHoliday ? "Holiday updated" : "Holiday created", "success");
    } catch (e) {
      console.error("Save holiday failed:", e);
      showToast("Save failed.", "error");
    } finally {
      setHolidaySaving(false);
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    if (!confirm("Delete this holiday?")) return;
    try {
      await timeSlotService.deleteHoliday(id);
      fetchHolidays();
      showToast("Holiday deleted", "success");
    } catch (e) {
      console.error("Delete holiday failed:", e);
    }
  };

  const getHourForDay = (day: number) => workingHours.find((h) => h.dayOfWeek === day);
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

  return (
    <>
      <PageMeta title="Rules & Holidays | MediTech" description="Manage clinic working hours and holidays" />
      <PageBreadcrumb pageTitle="Rules & Holidays" />

      <div className="space-y-6">
        {/* Tab Switch */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("hours")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "hours" ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Working Hours
          </button>
          <button
            onClick={() => setActiveTab("holidays")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "holidays" ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Holidays
          </button>
        </div>

        {/* =========== WORKING HOURS TAB =========== */}
        {activeTab === "hours" && (
          <ComponentCard title="Clinic Working Hours" desc="Define the clinic's operating hours for each day of the week">
            {hoursLoading ? (
              <div className="py-10 text-center text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const h = getHourForDay(day);
                  return (
                    <div key={day} className={`flex items-center justify-between rounded-lg border p-4 ${
                      h?.isOpen === false ? "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50" : "border-gray-200 dark:border-gray-700"
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className="w-24">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{DAY_NAMES[day]}</p>
                        </div>
                        {h ? (
                          h.isOpen !== false ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="light" size="sm" color="success">Open</Badge>
                              <span className="text-sm text-gray-600 dark:text-gray-400">{h.openTime} - {h.closeTime}</span>
                            </div>
                          ) : (
                            <Badge variant="light" size="sm" color="dark">Closed</Badge>
                          )
                        ) : (
                          <span className="text-sm text-gray-400 italic">Not configured</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {h ? (
                          <>
                            <button onClick={() => openHourEdit(h)} className="text-xs text-brand-500 hover:text-brand-700">Edit</button>
                            {h.id && <button onClick={() => handleDeleteHour(h.id!)} className="text-xs text-red-500 hover:text-red-700">Reset</button>}
                          </>
                        ) : (
                          <button onClick={() => openHourCreate(day)} className="text-xs text-brand-500 hover:text-brand-700">Configure</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ComponentCard>
        )}

        {/* =========== HOLIDAYS TAB =========== */}
        {activeTab === "holidays" && (
          <ComponentCard title="Clinic Holidays">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="text-sm text-gray-500">{holidays.length} holiday(s)</span>
              </div>
              <button onClick={openHolidayCreate} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
                + Add Holiday
              </button>
            </div>

            {holidaysLoading ? (
              <div className="py-10 text-center text-gray-500">Loading...</div>
            ) : holidays.length === 0 ? (
              <div className="py-10 text-center text-gray-400">No holidays for {selectedYear}.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader className="text-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Date</TableCell>
                      <TableCell isHeader className="text-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Name</TableCell>
                      <TableCell isHeader className="text-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Description</TableCell>
                      <TableCell isHeader className="text-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Auto Block</TableCell>
                      <TableCell isHeader className="text-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Prevent Create</TableCell>
                      <TableCell isHeader className="text-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</TableCell>
                      <TableCell isHeader className="text-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holidays.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="text-center px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{h.holidayDate}</span>
                        </TableCell>
                        <TableCell className="text-center px-4 py-3">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{h.name}</span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center max-w-xs">
                          <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2" title={h.description || ""}>{h.description || "-"}</span>
                        </TableCell>
                        <TableCell className="text-center px-4 py-3">
                          <div className="flex justify-center">
                            <Badge variant="light" size="sm" color={h.autoBlockSlots ? "success" : "dark"}>
                              {h.autoBlockSlots ? "Yes" : "No"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center px-4 py-3">
                          <div className="flex justify-center">
                            <Badge variant="light" size="sm" color={h.preventSlotCreation ? "success" : "dark"}>
                              {h.preventSlotCreation ? "Yes" : "No"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center px-4 py-3">
                          <div className="flex justify-center">
                            <Badge variant="light" size="sm" color={h.isActive ? "success" : "dark"}>
                              {h.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openHolidayEdit(h)} className="rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-600 transition-colors">Edit</button>
                            <button onClick={() => handleDeleteHoliday(h.id!)} className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-600 transition-colors">Delete</button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </ComponentCard>
        )}
      </div>

      {/* =========== WORKING HOURS MODAL =========== */}
      <Modal isOpen={hourModalOpen} onClose={() => setHourModalOpen(false)} className="max-w-md p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {editHour?.dayName || DAY_NAMES[editHour?.dayOfWeek || 1]} - Working Hours
        </h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={hourIsOpen} onChange={(e) => setHourIsOpen(e.target.checked)} className="rounded" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Clinic is open</span>
          </label>

          {hourIsOpen && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Open Time</label>
                <input type="time" value={hourOpenTime} onChange={(e) => setHourOpenTime(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Close Time</label>
                <input type="time" value={hourCloseTime} onChange={(e) => setHourCloseTime(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setHourModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-300">Cancel</button>
            <button onClick={handleSaveHour} disabled={hourSaving} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
              {hourSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* =========== HOLIDAY MODAL =========== */}
      <Modal isOpen={holidayModalOpen} onClose={() => setHolidayModalOpen(false)} className="max-w-md p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {editHoliday ? "Edit Holiday" : "Add Holiday"}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Date *</label>
            <input type="date" value={hDate} onChange={(e) => setHDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
            <input type="text" value={hName} onChange={(e) => setHName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" placeholder="e.g. National Day" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea value={hDesc} onChange={(e) => setHDesc(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={hAutoBlock} onChange={(e) => setHAutoBlock(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Auto-block existing slots on this date</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={hPreventCreate} onChange={(e) => setHPreventCreate(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Prevent new slot creation on this date</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={hIsActive} onChange={(e) => setHIsActive(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setHolidayModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-300">Cancel</button>
            <button onClick={handleSaveHoliday} disabled={holidaySaving || !hDate || !hName} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
              {holidaySaving ? "Saving..." : editHoliday ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
