import { useEffect, useState, useCallback, useRef } from "react";
import receptionistService from "../../../services/receptionistService";
import type { PatientBasicDTO, AppointmentCategoryDTO } from "../../../services/receptionistService";
import api from "../../../services/api";
import { Toast } from "./SharedComponents";
import DatePicker from "../../../components/form/date-picker";

export interface RebookData {
  patientId: number;
  patientName: string;
  maskedPhone?: string;
  email?: string;
  doctorId?: number;
}

interface CreateAppointmentProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  rebookData?: RebookData | null;
}

interface DoctorOption {
  id: number;
  fullName: string;
  specialization?: string;
}

interface TimeSlotOption {
  id: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

type Step = 1 | 2 | 3;

export default function CreateAppointment({ isOpen, onClose, onCreated, rebookData }: CreateAppointmentProps) {
  const [step, setStep] = useState<Step>(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Step 1: Patient
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<PatientBasicDTO[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientBasicDTO | null>(null);
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [newPatient, setNewPatient] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "MALE" as "MALE" | "FEMALE" | "OTHER",
    address: "",
  });
  const [patientErrors, setPatientErrors] = useState<Record<string, string>>({});
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Step 2: Appointment details
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [doctorLocked, setDoctorLocked] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlotOption[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [categories, setCategories] = useState<AppointmentCategoryDTO[]>([]);
  const [notes, setNotes] = useState("");

  // Step 3: submitting
  const [submitting, setSubmitting] = useState(false);

  // Load categories + doctors on open
  useEffect(() => {
    if (!isOpen) return;
    // Reset form
    setSelectedPatient(null);
    setPatientSearch("");
    setPatientResults([]);
    setShowCreatePatient(false);
    setSelectedDoctorId(null);
    setDoctorLocked(false);
    setAppointmentDate("");
    setSelectedSlotId(null);
    setNotes("");
    setPatientErrors({});
    setNewPatient({ fullName: "", email: "", phone: "", dateOfBirth: "", gender: "MALE", address: "" });

    // If rebooking, pre-fill patient and skip to step 2
    if (rebookData) {
      setSelectedPatient({
        id: rebookData.patientId,
        name: rebookData.patientName,
        maskedPhone: rebookData.maskedPhone || "",
        email: rebookData.email,
      } as PatientBasicDTO);
      if (rebookData.doctorId) {
        setSelectedDoctorId(rebookData.doctorId);
        setDoctorLocked(true);
      }
      setStep(2);
    } else {
      setStep(1);
    }

    const loadData = async () => {
      try {
        const [cats, docRes] = await Promise.all([
          receptionistService.getCategories().catch(() => []),
          api.get("/public/doctors", { params: { pageNumber: 0, pageSize: 200 } }).then((r) => {
            const content = r.data?.content || r.data || [];
            return content.map((d: any) => ({
              id: d.id,
              fullName: d.fullName,
              specialization: d.primarySpecialty || d.specialization || "",
            }));
          }).catch(() => []),
        ]);
        setCategories(cats);
        setDoctors(docRes);
      } catch {
        /* ignore */
      }
    };
    loadData();
  }, [isOpen]);

  // Patient search
  const handlePatientSearch = useCallback(
    (query: string) => {
      setPatientSearch(query);
      setSelectedPatient(null);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      if (query.length < 2) {
        setPatientResults([]);
        return;
      }
      searchTimeout.current = setTimeout(async () => {
        try {
          setSearchLoading(true);
          const results = await receptionistService.searchPatients(query);
          setPatientResults(results);
        } catch {
          setPatientResults([]);
        } finally {
          setSearchLoading(false);
        }
      }, 400);
    },
    []
  );

  // Validate new patient form
  const validatePatientForm = (): boolean => {
    const errs: Record<string, string> = {};
    const name = newPatient.fullName.trim();
    const phone = newPatient.phone.trim();
    const email = newPatient.email.trim();
    const dob = newPatient.dateOfBirth;

    if (!name) errs.fullName = "Full name is required";
    else if (name.length < 2) errs.fullName = "Name must be at least 2 characters";
    else if (name.length > 255) errs.fullName = "Name must not exceed 255 characters";

    if (!phone) errs.phone = "Phone number is required";
    else if (!/^[0-9+\-() ]{8,20}$/.test(phone)) errs.phone = "Invalid phone (8-20 digits, may include +, -, (, ))";

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email format";

    if (dob) {
      const dobDate = new Date(dob);
      if (dobDate >= new Date()) errs.dateOfBirth = "Date of birth must be in the past";
    }

    if (newPatient.address && newPatient.address.length > 500) errs.address = "Address must not exceed 500 characters";

    setPatientErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Create new patient
  const handleCreatePatient = async () => {
    if (!validatePatientForm()) return;
    try {
      setSearchLoading(true);
      const created = await receptionistService.createPatient({
        name: newPatient.fullName.trim(),
        phone: newPatient.phone.trim(),
        email: newPatient.email.trim() || undefined,
        dateOfBirth: newPatient.dateOfBirth || undefined,
        gender: newPatient.gender || undefined,
        address: newPatient.address.trim() || undefined,
      });
      setSelectedPatient({ id: created.id || created.data?.id, name: newPatient.fullName.trim(), maskedPhone: newPatient.phone.trim(), email: newPatient.email.trim(), dateOfBirth: newPatient.dateOfBirth, gender: newPatient.gender } as PatientBasicDTO);
      setShowCreatePatient(false);
      setPatientErrors({});
      setToast({ message: "Patient created successfully", type: "success" });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.join(", ") || "Failed to create patient";
      setToast({ message: msg, type: "error" });
    } finally {
      setSearchLoading(false);
    }
  };

  // Load available slots when doctor + date selected
  useEffect(() => {
    if (!selectedDoctorId || !appointmentDate) {
      setTimeSlots([]);
      setSelectedSlotId(null);
      return;
    }
    const loadSlots = async () => {
      try {
        setSlotsLoading(true);
        const response = await api.get(`/public/doctors/${selectedDoctorId}/slots`, {
          params: { dateFrom: appointmentDate, dateTo: appointmentDate },
        });
        setTimeSlots(response.data || []);
        setSelectedSlotId(null);
      } catch {
        setTimeSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };
    loadSlots();
  }, [selectedDoctorId, appointmentDate]);

  // Submit
  const handleSubmit = async () => {
    if (!selectedPatient || !selectedDoctorId || !appointmentDate || !selectedSlotId) {
      setToast({ message: "Please complete all required fields", type: "error" });
      return;
    }
    // Validate date is not in the past
    const todayStr = new Date().toISOString().split("T")[0];
    if (appointmentDate < todayStr) {
      setToast({ message: "Cannot book an appointment in the past", type: "error" });
      return;
    }
    try {
      setSubmitting(true);
      await receptionistService.bookAppointment({
        patientId: selectedPatient.id,
        doctorId: selectedDoctorId,
        appointmentDate,
        timeSlotId: selectedSlotId,
        notes: notes || undefined,
      });
      setToast({ message: "Appointment booked successfully!", type: "success" });
      setTimeout(() => {
        onCreated();
        onClose();
      }, 1000);
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to book appointment";
      setToast({ message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl m-4">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Book Appointment</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 px-6 py-3 bg-gray-50 dark:bg-gray-900/50">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`} />
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* ==================== STEP 1: Patient ==================== */}
          {step === 1 && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Select Patient</h3>

                {selectedPatient ? (
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{selectedPatient.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{selectedPatient.maskedPhone} · {selectedPatient.email || "No email"}</div>
                    </div>
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Search */}
                    <div className="relative">
                      <input
                        type="text"
                        value={patientSearch}
                        onChange={(e) => handlePatientSearch(e.target.value)}
                        placeholder="Search patient by name or phone..."
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 pr-10"
                      />
                      {searchLoading && (
                        <div className="absolute right-3 top-3">
                          <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Results */}
                    {patientResults.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-200 dark:divide-gray-700">
                        {patientResults.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => { setSelectedPatient(p); setPatientResults([]); }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{p.maskedPhone} · {p.email || "No email"}</div>
                          </button>
                        ))}
                      </div>
                    )}

                    {patientSearch.length >= 2 && patientResults.length === 0 && !searchLoading && (
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No results found</p>
                    )}

                    {/* Create new patient toggle */}
                    <div className="mt-3">
                      <button
                        onClick={() => setShowCreatePatient(!showCreatePatient)}
                        className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        {showCreatePatient ? "Cancel" : "+ Create New Patient"}
                      </button>
                    </div>

                    {showCreatePatient && (
                      <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Full Name <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={newPatient.fullName}
                              onChange={(e) => { setNewPatient({ ...newPatient, fullName: e.target.value }); setPatientErrors((prev) => ({ ...prev, fullName: "" })); }}
                              placeholder="Enter patient's full name"
                              className={`w-full px-3 py-2 text-sm rounded-lg border ${patientErrors.fullName ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500`}
                            />
                            {patientErrors.fullName && <p className="text-xs text-red-500 mt-1">{patientErrors.fullName}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Phone <span className="text-red-500">*</span></label>
                            <input
                              type="tel"
                              value={newPatient.phone}
                              onChange={(e) => { setNewPatient({ ...newPatient, phone: e.target.value }); setPatientErrors((prev) => ({ ...prev, phone: "" })); }}
                              placeholder="0901234567"
                              className={`w-full px-3 py-2 text-sm rounded-lg border ${patientErrors.phone ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500`}
                            />
                            {patientErrors.phone && <p className="text-xs text-red-500 mt-1">{patientErrors.phone}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
                            <input
                              type="email"
                              value={newPatient.email}
                              onChange={(e) => { setNewPatient({ ...newPatient, email: e.target.value }); setPatientErrors((prev) => ({ ...prev, email: "" })); }}
                              placeholder="patient@example.com"
                              className={`w-full px-3 py-2 text-sm rounded-lg border ${patientErrors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500`}
                            />
                            {patientErrors.email && <p className="text-xs text-red-500 mt-1">{patientErrors.email}</p>}
                          </div>
                          <div>
                            <DatePicker
                              id="patient-dob"
                              label="Date of Birth"
                              placeholder="Select date of birth"
                              value={newPatient.dateOfBirth}
                              maxDate="today"
                              error={!!patientErrors.dateOfBirth}
                              hint={patientErrors.dateOfBirth}
                              onChange={(_selectedDates, dateStr) => {
                                setNewPatient((prev) => ({ ...prev, dateOfBirth: dateStr }));
                                setPatientErrors((prev) => ({ ...prev, dateOfBirth: "" }));
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Gender</label>
                            <select
                              value={newPatient.gender}
                              onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value as "MALE" | "FEMALE" | "OTHER" })}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                              <option value="MALE">Male</option>
                              <option value="FEMALE">Female</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Address</label>
                            <input
                              type="text"
                              value={newPatient.address}
                              onChange={(e) => { setNewPatient({ ...newPatient, address: e.target.value }); setPatientErrors((prev) => ({ ...prev, address: "" })); }}
                              placeholder="Street, District, City"
                              className={`w-full px-3 py-2 text-sm rounded-lg border ${patientErrors.address ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500`}
                            />
                            {patientErrors.address && <p className="text-xs text-red-500 mt-1">{patientErrors.address}</p>}
                          </div>
                        </div>
                        <button
                          onClick={handleCreatePatient}
                          disabled={searchLoading}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {searchLoading ? "Creating..." : "Create Patient"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* ==================== STEP 2: Appointment Details ==================== */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Appointment Details</h3>

              {/* Doctor selection */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Doctor *{doctorLocked && <span className="ml-1 text-brand-500">(locked — same doctor)</span>}</label>
                <select
                  value={selectedDoctorId || ""}
                  onChange={(e) => setSelectedDoctorId(Number(e.target.value) || null)}
                  disabled={doctorLocked}
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 ${doctorLocked ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <option value="">Select a doctor...</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName}{d.specialization ? ` — ${d.specialization}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={appointmentDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm bg-transparent dark:bg-gray-900 text-gray-800 dark:text-white/90 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:focus:border-brand-800"
                />
              </div>

              {/* Time slots */}
              {selectedDoctorId && appointmentDate && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Time Slot *</label>
                  {slotsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      Loading slots...
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No available slots for this date</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => slot.isAvailable && setSelectedSlotId(slot.id)}
                          disabled={!slot.isAvailable}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            selectedSlotId === slot.id
                              ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500"
                              : slot.isAvailable
                              ? "border-gray-300 dark:border-gray-600 hover:border-brand-400 text-gray-700 dark:text-gray-300"
                              : "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                          }`}
                        >
                          {slot.startTime}
                          <span className="text-xs block text-gray-400">– {slot.endTime}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any notes for this appointment..."
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          {/* ==================== STEP 3: Confirmation ==================== */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Confirm & Book</h3>

              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl space-y-3">
                {/* Patient */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Patient</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{selectedPatient?.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{selectedPatient?.maskedPhone}</div>
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                {/* Doctor */}
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Doctor</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {doctors.find((d) => d.id === selectedDoctorId)?.fullName || "—"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {doctors.find((d) => d.id === selectedDoctorId)?.specialization || ""}
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                {/* Date & time */}
                <div className="flex gap-6">
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Date</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{appointmentDate}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Time</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {timeSlots.find((s) => s.id === selectedSlotId)?.startTime || "—"}
                      {" – "}
                      {timeSlots.find((s) => s.id === selectedSlotId)?.endTime || ""}
                    </div>
                  </div>
                </div>

                {notes && (
                  <>
                    <hr className="border-gray-200 dark:border-gray-700" />
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Notes</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">{notes}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-2xl">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={
                  (step === 1 && !selectedPatient) ||
                  (step === 2 && (!selectedDoctorId || !appointmentDate || !selectedSlotId))
                }
                className="px-5 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Booking..." : "Book Appointment"}
              </button>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
