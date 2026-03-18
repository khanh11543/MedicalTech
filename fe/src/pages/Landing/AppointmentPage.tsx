import { useState, useEffect, type FormEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { PageTitle } from "./components/SharedComponents";
import publicService, { type Specialty, type DoctorCard, type TimeSlot } from "../../services/publicService";
import patientService from "../../services/patientService";
import { useAuth } from "../../context/AuthContext";
import "./landing.css";

interface FormData {
  name: string;
  email: string;
  phone: string;
  department: string;
  date: string;
  doctor: string;
  timeSlotId: string;
  message: string;
}

const steps = [
  {
    number: 1,
    icon: "bi bi-person-fill",
    title: "Fill Details",
    description:
      "Provide your personal information and select your preferred department",
  },
  {
    number: 2,
    icon: "bi bi-calendar-event",
    title: "Choose Date",
    description:
      "Select your preferred date and time slot from available options",
  },
  {
    number: 3,
    icon: "bi bi-check-circle",
    title: "Confirmation",
    description:
      "Receive instant confirmation and appointment details via email or SMS",
  },
  {
    number: 4,
    icon: "bi bi-heart-pulse",
    title: "Get Treatment",
    description:
      "Visit our clinic at your scheduled time and receive quality healthcare",
  },
];

const infoItems = [
  {
    icon: "bi bi-calendar-check",
    title: "Flexible Scheduling",
    text: "Choose from available time slots that fit your busy schedule",
  },
  {
    icon: "bi bi-stopwatch",
    title: "Quick Response",
    text: "Get confirmation within 15 minutes of submitting your request",
  },
  {
    icon: "bi bi-shield-check",
    title: "Expert Medical Care",
    text: "Board-certified doctors and specialists at your service",
  },
];

export default function AppointmentPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedDepartment = searchParams.get("department") || "";
  const preselectedDoctor = searchParams.get("doctor") || "";

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    department: preselectedDepartment,
    date: "",
    doctor: preselectedDoctor,
    timeSlotId: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [departments, setDepartments] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<DoctorCard[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    publicService.getSpecialties().then((list) => setDepartments(list)).catch(() => {});
    publicService.getDoctors({ pageSize: 50 }).then((res) => {
      const list = Array.isArray(res.content) ? res.content : [];
      setDoctors(list);

      if (preselectedDoctor && !preselectedDepartment) {
        const doc = list.find((d) => String(d.id) === preselectedDoctor);
        if (doc?.primarySpecialty) {
          setFormData((prev) => ({ ...prev, department: doc.primarySpecialty }));
        }
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch available time slots when doctor + date change
  useEffect(() => {
    if (!formData.doctor || !formData.date) {
      setTimeSlots([]);
      setFormData((prev) => ({ ...prev, timeSlotId: "" }));
      return;
    }
    setSlotsLoading(true);
    publicService
      .getDoctorSlots(Number(formData.doctor), formData.date, formData.date)
      .then((slots) => {
        setTimeSlots(slots);
        setFormData((prev) => ({ ...prev, timeSlotId: "" }));
      })
      .catch(() => setTimeSlots([]))
      .finally(() => setSlotsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.doctor, formData.date]);

  const filteredDoctors = formData.department
    ? doctors.filter((d) => d.primarySpecialty === formData.department)
    : doctors;

  const selectedSlot = timeSlots.find((s) => String(s.id) === formData.timeSlotId);

  const validatePhone = (phone: string): string | null => {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return "Please enter your phone number.";
    if (digits.length !== 10 && digits.length !== 11) return "Phone number should be 10–11 digits.";
    const withoutLeadingZero = digits.replace(/^0+/, "") || digits;
    if ((digits.length === 10 || digits.length === 11) && !/^[3-9]/.test(withoutLeadingZero)) return "Vietnamese number should start with 3, 5, 7, 8, or 9.";
    return null;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "department") {
      const selectedDoc = doctors.find((d) => String(d.id) === formData.doctor);
      const doctorStillValid = selectedDoc?.primarySpecialty === value;
      setFormData({ ...formData, department: value, doctor: doctorStillValid ? formData.doctor : "", timeSlotId: "" });
    } else if (name === "doctor" || name === "date") {
      setFormData({ ...formData, [name]: value, timeSlotId: "" });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!isAuthenticated || !user) {
      setError("Please sign in to book an appointment.");
      return;
    }
    if (!user.roles.includes("PATIENT")) {
      setError("Only patients can book appointments. Please sign in with a patient account.");
      return;
    }

    const err: Record<string, string> = {};
    if (!formData.name?.trim()) err.name = "Please enter your full name.";
    if (!formData.email?.trim()) err.email = "Please enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      err.email = "Please enter a valid email address (e.g. name@example.com).";
    }
    if (!formData.phone?.trim()) err.phone = "Please enter your phone number.";
    else {
      const phoneErr = validatePhone(formData.phone);
      if (phoneErr) err.phone = phoneErr;
    }
    if (!formData.department) err.department = "Please select a department.";
    if (!formData.date) err.date = "Please select appointment date.";
    else {
      const today = new Date().toISOString().split("T")[0];
      if (formData.date < today) err.date = "Cannot book an appointment in the past.";
    }
    if (!formData.doctor) err.doctor = "Please select a doctor.";
    if (Object.keys(err).length > 0) {
      setFieldErrors(err);
      setError("Please fill in all required fields correctly.");
      return;
    }
    if (!selectedSlot) {
      setError("Please select a time slot before booking.");
      setFieldErrors((prev) => ({ ...prev, timeSlotId: "Please select a time slot." }));
      return;
    }

    setSubmitting(true);
    try {
      await patientService.bookAppointment({
        patientId: user.userId,
        doctorId: Number(formData.doctor),
        appointmentDate: formData.date,
        timeSlotId: selectedSlot.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reasonForVisit: formData.message || undefined,
      });
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", department: "", date: "", doctor: "", timeSlotId: "", message: "" });
      setTimeSlots([]);
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to submit appointment request. Please try again.";
      setError(msg);
      setFormData((prev) => ({ ...prev, timeSlotId: "" }));
      if (formData.doctor && formData.date) {
        setSlotsLoading(true);
        publicService
          .getDoctorSlots(Number(formData.doctor), formData.date, formData.date)
          .then((slots) => setTimeSlots(slots))
          .catch(() => {})
          .finally(() => setSlotsLoading(false));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageTitle
        title="Appointment"
        description="Schedule your medical appointment quickly and easily with our experienced healthcare professionals. Choose your preferred doctor, department, and time to receive personalized medical care."
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: "Category" },
          { label: "Appointment" },
        ]}
      />

      <section className="appt-section">
        <div className="container-landing">
          <div className="appt-row">
            {/* Info Panel */}
            <div className="appt-info">
              <h3 className="appt-info-title">
                Quick &amp; Easy Online Booking
              </h3>
              <p className="appt-info-desc">
                Book your appointment in just a few simple steps. Our healthcare
                professionals are ready to provide you with the best medical care
                tailored to your needs.
              </p>

              <div className="appt-info-items">
                {infoItems.map((item) => (
                  <div key={item.title} className="appt-info-item">
                    <div className="appt-info-icon">
                      <i className={item.icon}></i>
                    </div>
                    <div>
                      <h5 className="appt-info-item-title">{item.title}</h5>
                      <p className="appt-info-item-text">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="appt-emergency">
                <h6 className="appt-emergency-title">
                  <i className="bi bi-telephone-fill"></i> Emergency Hotline
                </h6>
                <p className="appt-emergency-text">
                  Call{" "}
                  <a href="tel:+15559114567" className="appt-emergency-phone">
                    +1 (555) 911-4567
                  </a>{" "}
                  for urgent medical assistance
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="appt-form-wrapper">
              {submitted && (
                <div className="appt-alert-success">
                  Your appointment request has been sent successfully. We will
                  contact you shortly!
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="appt-form-grid">
                  <div className="appt-field-wrap">
                    <input
                      type="text"
                      name="name"
                      placeholder="Your Full Name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className={`appt-input ${fieldErrors.name ? "appt-input--error" : ""}`}
                    />
                    {fieldErrors.name && <p className="appt-field-error">{fieldErrors.name}</p>}
                  </div>
                  <div className="appt-field-wrap">
                    <input
                      type="email"
                      name="email"
                      placeholder="Your Email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={`appt-input ${fieldErrors.email ? "appt-input--error" : ""}`}
                    />
                    {fieldErrors.email && <p className="appt-field-error">{fieldErrors.email}</p>}
                  </div>
                  <div className="appt-field-wrap">
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Your Phone Number"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className={`appt-input ${fieldErrors.phone ? "appt-input--error" : ""}`}
                    />
                    {fieldErrors.phone && <p className="appt-field-error">{fieldErrors.phone}</p>}
                  </div>
                  <div className="appt-field-wrap">
                    <select
                      name="department"
                      required
                      value={formData.department}
                      onChange={handleChange}
                      className={`appt-input appt-select ${fieldErrors.department ? "appt-input--error" : ""}`}
                      aria-label="Select Department"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dep) => (
                        <option key={dep.id} value={dep.name}>{dep.name}</option>
                      ))}
                    </select>
                    {fieldErrors.department && <p className="appt-field-error">{fieldErrors.department}</p>}
                  </div>
                  <div className="appt-field-wrap">
                    <input
                      type="date"
                      name="date"
                      required
                      value={formData.date}
                      onChange={handleChange}
                      min={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })()}
                      className={`appt-input ${fieldErrors.date ? "appt-input--error" : ""}`}
                      aria-label="Appointment Date"
                    />
                    {fieldErrors.date && <p className="appt-field-error">{fieldErrors.date}</p>}
                  </div>
                  <div className="appt-field-wrap">
                    <select
                      name="doctor"
                      required
                      value={formData.doctor}
                      onChange={handleChange}
                      className={`appt-input appt-select ${fieldErrors.doctor ? "appt-input--error" : ""}`}
                      aria-label="Select Doctor"
                    >
                      <option value="">Select Doctor</option>
                      {filteredDoctors.map((doc) => (
                        <option key={doc.id} value={String(doc.id)}>{doc.fullName}</option>
                      ))}
                    </select>
                    {fieldErrors.doctor && <p className="appt-field-error">{fieldErrors.doctor}</p>}
                  </div>
                </div>

                {/* Time Slot Picker */}
                {formData.doctor && formData.date && (
                  <div className="appt-timeslot-section">
                    <label className="appt-timeslot-label">
                      <i className="bi bi-clock"></i> Available Time Slots
                      {selectedSlot && (
                        <span className="appt-timeslot-selected">
                          Selected: {selectedSlot.startTime.substring(0, 5)} – {selectedSlot.endTime.substring(0, 5)}
                        </span>
                      )}
                    </label>
                    {fieldErrors.timeSlotId && (
                      <p className="appt-field-error" style={{ marginTop: "4px" }}>{fieldErrors.timeSlotId}</p>
                    )}
                    {slotsLoading ? (
                      <div className="appt-timeslot-loading">
                        <div className="appt-timeslot-spinner" />
                        Loading available slots...
                      </div>
                    ) : timeSlots.length === 0 ? (
                      <div className="appt-timeslot-empty">
                        <i className="bi bi-calendar-x"></i>
                        No time slots available for this date. Please choose a different date or doctor.
                      </div>
                    ) : (
                      <div className="appt-timeslot-grid">
                        {(() => {
                          const now = new Date();
                          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                          const currentTime = now.toTimeString().slice(0, 5);
                          const isToday = formData.date === todayStr;
                          const isPastDate = formData.date < todayStr;

                          return timeSlots.map((slot) => {
                            const isSelected = formData.timeSlotId === String(slot.id);
                            const start = slot.startTime.substring(0, 5);
                            const end = slot.endTime.substring(0, 5);
                            const isPastSlot = isPastDate || (isToday && start < currentTime);
                            const isSelectable = slot.isAvailable && !isPastSlot;

                            return (
                              <button
                                key={slot.id}
                                type="button"
                                disabled={!isSelectable}
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    timeSlotId: String(slot.id),
                                  }));
                                  setFieldErrors((prev) => ({ ...prev, timeSlotId: "" }));
                                }}
                                className={`appt-timeslot-btn ${
                                  isSelected
                                    ? "appt-timeslot-btn--selected"
                                    : isPastSlot
                                    ? "appt-timeslot-btn--past"
                                    : slot.isAvailable
                                    ? "appt-timeslot-btn--available"
                                    : "appt-timeslot-btn--booked"
                                }`}
                              >
                                <span className="appt-timeslot-btn-time">
                                  {start} – {end}
                                </span>
                                <span className="appt-timeslot-btn-status">
                                  {isSelected
                                    ? "✓ Selected"
                                    : isPastSlot
                                    ? "Past"
                                    : slot.isAvailable
                                    ? "Available"
                                    : "Booked"}
                                </span>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                )}

                <textarea
                  name="message"
                  rows={5}
                  placeholder="Please describe your symptoms or reason for visit (optional)"
                  value={formData.message}
                  onChange={handleChange}
                  className="appt-input appt-textarea"
                />

                {error && (
                  <div className="appt-alert-error">
                    {error}
                  </div>
                )}

                {!isAuthenticated && (
                  <div className="appt-login-prompt">
                    <i className="bi bi-info-circle"></i>
                    You need to{" "}
                    <Link to="/signin" className="appt-login-link">sign in</Link>
                    {" "}with a patient account to book an appointment.
                    Don't have an account?{" "}
                    <Link to="/signup" className="appt-login-link">Register here</Link>
                  </div>
                )}

                <button type="submit" className="appt-submit-btn" disabled={submitting}>
                  <i className="bi bi-calendar-plus"></i>
                  {submitting ? "Submitting..." : "Book Appointment"}
                </button>
              </form>
            </div>
          </div>

          {/* Process Steps */}
          <div className="appt-steps">
            {steps.map((step) => (
              <div key={step.number} className="appt-step-item">
                <div className="appt-step-number">{step.number}</div>
                <div className="appt-step-icon">
                  <i className={step.icon}></i>
                </div>
                <h5 className="appt-step-title">{step.title}</h5>
                <p className="appt-step-desc">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
