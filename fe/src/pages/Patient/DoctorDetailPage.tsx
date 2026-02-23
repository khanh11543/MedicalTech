import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import patientService, {
  type DoctorDetail,
  type TimeSlot,
} from "../../services/patientService";

export default function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [reason, setReason] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState("");

  // Date range for slot lookup (today + 7 days)
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [doc, sl] = await Promise.all([
          patientService.getDoctorDetail(Number(id)),
          patientService.getDoctorSlots(Number(id), today, nextWeek),
        ]);
        setDoctor(doc);
        setSlots(sl.filter((s) => s.isAvailable));
      } catch (err) {
        console.error("Failed to load doctor:", err);
        setError("Doctor not found");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleBook = async () => {
    if (!selectedSlot || !doctor) return;
    setBooking(true);
    setError("");
    try {
      await patientService.bookAppointment({
        patientId: 0, // backend resolves from token
        doctorId: doctor.id,
        appointmentDate: selectedSlot.slotDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reasonForVisit: reason,
        symptoms,
      });
      setBookingSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="rounded-2xl bg-gray-200 dark:bg-gray-700 h-64" />
      </div>
    );
  }

  if (!doctor || error === "Doctor not found") {
    return (
      <div className="p-6 text-center py-20">
        <h2 className="text-xl font-bold text-gray-700 dark:text-white mb-2">Doctor not found</h2>
        <button onClick={() => navigate("/patient/doctors")} className="text-blue-500 hover:underline text-sm">
          ← Back to search
        </button>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Appointment Booked!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Your appointment with Dr. {doctor.fullName} has been scheduled successfully.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/patient/appointments")}
              className="px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              View Appointments
            </button>
            <button
              onClick={() => navigate("/patient")}
              className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Group slots by date
  const slotsByDate = slots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
    (acc[slot.slotDate] = acc[slot.slotDate] || []).push(slot);
    return acc;
  }, {});

  return (
    <>
      <PageMeta title={`Dr. ${doctor.fullName} | MedicalTech`} description="" />
      <div className="p-4 sm:p-6 space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate("/patient/doctors")}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to search
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doctor Info (left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800/50 p-6">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0 overflow-hidden">
                  {doctor.avatarUrl ? (
                    <img src={doctor.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-white">{doctor.fullName?.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                    Dr. {doctor.fullName}
                  </h1>
                  <p className="text-blue-500 font-medium mt-1">{doctor.primarySpecialty}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {doctor.ratingAvg?.toFixed(1) || "N/A"} ({doctor.ratingCount} reviews)
                    </span>
                    <span>{doctor.experienceYears} years experience</span>
                    {doctor.hospitalAffiliation && <span>{doctor.hospitalAffiliation}</span>}
                  </div>
                </div>
              </div>

              {doctor.bio && (
                <p className="mt-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{doctor.bio}</p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                <InfoItem label="Consultation Fee" value={`${doctor.consultationFee?.toLocaleString("vi-VN")} VND`} />
                {doctor.followUpFee > 0 && (
                  <InfoItem label="Follow-up Fee" value={`${doctor.followUpFee?.toLocaleString("vi-VN")} VND`} />
                )}
                <InfoItem label="License" value={doctor.licenseNumber || "—"} />
              </div>
            </div>

            {/* Education & Specialties */}
            {(doctor.education || (doctor.specialties && doctor.specialties.length > 0)) && (
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800/50 p-6 space-y-4">
                {doctor.education && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Education</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{doctor.education}</p>
                  </div>
                )}
                {doctor.specialties && doctor.specialties.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {doctor.specialties.map((s) => (
                        <span key={s.id} className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Booking Panel (right col) */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800/50 p-5 sticky top-20">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Book Appointment</h2>

              {/* Available Slots */}
              {Object.keys(slotsByDate).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No available slots in the next 7 days</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                    <div key={date}>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        {new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {dateSlots.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                              selectedSlot?.id === slot.id
                                ? "bg-blue-500 text-white border-blue-500"
                                : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            }`}
                          >
                            {slot.startTime?.slice(0, 5)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reason & Symptoms */}
              {selectedSlot && (
                <div className="mt-4 space-y-3">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-sm">
                    <p className="font-medium text-blue-700 dark:text-blue-300">
                      {new Date(selectedSlot.slotDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </p>
                    <p className="text-blue-600 dark:text-blue-400">
                      {selectedSlot.startTime?.slice(0, 5)} - {selectedSlot.endTime?.slice(0, 5)}
                    </p>
                  </div>
                  <textarea
                    placeholder="Reason for visit (optional)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-800 dark:text-white resize-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    placeholder="Symptoms (optional)"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-800 dark:text-white resize-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {error && (
                <p className="mt-3 text-sm text-red-500">{error}</p>
              )}

              <button
                onClick={handleBook}
                disabled={!selectedSlot || booking}
                className="mt-4 w-full py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 transition-colors flex items-center justify-center gap-2"
              >
                {booking ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Booking...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-800 dark:text-white">{value}</p>
    </div>
  );
}
