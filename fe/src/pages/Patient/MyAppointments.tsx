import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import patientService, {
  type Appointment,
  type Payment,
} from "../../services/patientService";
import MomoQrModal from "../../components/payment/MomoQrModal";

const statusConfig: Record<string, { label: string; classes: string }> = {
  PENDING: { label: "Pending", classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  CONFIRMED: { label: "Confirmed", classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  CHECKED_IN: { label: "Checked In", classes: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  IN_PROGRESS: { label: "In Progress", classes: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  COMPLETED: { label: "Completed", classes: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  CANCELLED: { label: "Cancelled", classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  NO_SHOW: { label: "No Show", classes: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
  RESCHEDULED: { label: "Rescheduled", classes: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

type TabKey = "UPCOMING" | "COMPLETED" | "CANCELLED";
const TABS: { key: TabKey; label: string }[] = [
  { key: "UPCOMING", label: "Upcoming" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

function getTabParams(tab: TabKey, page: number, pageSize: number) {
  const today = new Date().toISOString().slice(0, 10);
  if (tab === "UPCOMING") {
    return { statuses: "PENDING,CONFIRMED,CHECKED_IN,IN_PROGRESS", from: today, pageNumber: page, pageSize };
  }
  if (tab === "COMPLETED") return { status: "COMPLETED", pageNumber: page, pageSize };
  return { status: "CANCELLED", pageNumber: page, pageSize };
}

export default function MyAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [tabCounts, setTabCounts] = useState<Record<TabKey, number>>({ UPCOMING: 0, COMPLETED: 0, CANCELLED: 0 });
  const [activeTab, setActiveTab] = useState<TabKey>("UPCOMING");
  const [reviewModal, setReviewModal] = useState<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [payNowPayment, setPayNowPayment] = useState<Payment | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = getTabParams(activeTab, page, 10);
      const result = await patientService.getMyAppointments(params);
      setAppointments(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
      setTabCounts((prev) => ({ ...prev, [activeTab]: result.totalElements }));
    } catch (err) {
      console.error("Failed to load appointments:", err);
    } finally {
      setLoading(false);
    }
  }, [page, activeTab]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleReviewSubmitted = () => {
    setReviewModal(null);
    fetchAppointments();
  };

  const handlePayNow = async (appointment: Appointment) => {
    if (!appointment.paymentId) return;
    try {
      const payment = await patientService.getPaymentDetail(appointment.paymentId);
      setPayNowPayment(payment);
    } catch (e) {
      console.error("Failed to load payment:", e);
    }
  };

  return (
    <>
      <PageMeta title="Appointments | MedicalTech" description="View and manage your appointments" />
      {payNowPayment && (
        <MomoQrModal
          payment={payNowPayment}
          onClose={() => setPayNowPayment(null)}
          onPaymentSuccess={() => { setPayNowPayment(null); fetchAppointments(); }}
        />
      )}
      {cancelTarget && (
        <CancelModal
          appointment={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onCancelled={() => { setCancelTarget(null); fetchAppointments(); }}
        />
      )}
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Appointments</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View and manage your upcoming and past appointments
            </p>
          </div>
          <button
            onClick={() => navigate("/appointment")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#049ebb] text-white rounded-xl hover:bg-[#037a94] transition-colors text-sm font-medium shrink-0 border-none cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            + Book Now
          </button>
        </div>

        {/* Tabs: Upcoming / Completed / Cancelled */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setPage(0); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap border-none cursor-pointer ${
                activeTab === t.key
                  ? "bg-[#049ebb] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {t.label} {tabCounts[t.key] !== undefined && tabCounts[t.key] > 0 ? `(${tabCounts[t.key]})` : ""}
            </button>
          ))}
        </div>

        {/* Appointment List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-5 flex gap-4">
                <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-2">No appointments found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {activeTab === "UPCOMING" ? "You have no upcoming appointments" : `No ${activeTab.toLowerCase()} appointments`}
            </p>
            <button
              onClick={() => navigate("/appointment")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#049ebb] text-white rounded-xl hover:bg-[#037a94] transition-colors text-sm font-medium border-none cursor-pointer"
            >
              + Book Now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onReview={(a) => setReviewModal(a)}
                onCancel={(a) => setCancelTarget(a)}
                onPayNow={handlePayNow}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors bg-transparent cursor-pointer"
            >
              Previous
            </button>
            <span className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-400">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors bg-transparent cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <ReviewModal
          appointment={reviewModal}
          onClose={() => setReviewModal(null)}
          onSubmitted={handleReviewSubmitted}
        />
      )}
    </>
  );
}

function AppointmentCard({
  appointment: a,
  onReview,
  onCancel,
  onPayNow,
}: {
  appointment: Appointment;
  onReview: (a: Appointment) => void;
  onCancel: (a: Appointment) => void;
  onPayNow: (a: Appointment) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sc = statusConfig[a.status] || statusConfig.PENDING;
  const canReview = a.status === "COMPLETED" && !a.hasReview;
  const alreadyReviewed = a.status === "COMPLETED" && a.hasReview;
  const canCancel = a.status === "PENDING" || a.status === "CONFIRMED";
  const showPayNow = a.status === "COMPLETED" && a.paymentId && (a.paymentStatus === "PENDING" || a.paymentStatus === "INITIATED");
  const fee = a.consultationFee != null ? Number(a.consultationFee) : null;
  const initial = (a.doctorName || "D").charAt(0).toUpperCase();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800/50 overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
        {/* Doctor avatar */}
        <div className="w-12 h-12 rounded-full bg-[#049ebb] text-white flex items-center justify-center text-lg font-bold shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">BS. {a.doctorName}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.classes}`}>
              {sc.label}
            </span>
            {alreadyReviewed && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-700">
                Reviewed
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {a.doctorSpecialization} &bull; {new Date(a.appointmentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} {a.startTime?.slice(0, 5)} &ndash; {a.endTime?.slice(0, 5)}
          </p>
          {fee != null && (
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1">
              {(fee as number).toLocaleString("en-US")} VND
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-[#049ebb] hover:underline border-none bg-transparent cursor-pointer"
          >
            Details
          </button>
          {canCancel && (
            <button
              type="button"
              onClick={() => onCancel(a)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:underline border-none bg-transparent cursor-pointer"
            >
              Cancel
            </button>
          )}
          {showPayNow && (
            <button
              type="button"
              onClick={() => onPayNow(a)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#049ebb] hover:bg-[#037a94] border-none cursor-pointer"
            >
              Pay Now
            </button>
          )}
          {canReview && (
            <button
              type="button"
              onClick={() => onReview(a)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-500 rounded-xl hover:bg-amber-600 border-none cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Rate
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-0 border-t border-gray-100 dark:border-gray-700/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mt-4 text-sm">
            {a.reasonForVisit && <DetailRow label="Reason" value={a.reasonForVisit} />}
            {a.symptoms && <DetailRow label="Symptoms" value={a.symptoms} />}
            {a.notes && <DetailRow label="Notes" value={a.notes} />}
            {a.queueNumber != null && a.queueNumber > 0 && <DetailRow label="Queue #" value={String(a.queueNumber)} />}
            {a.cancellationReason && <DetailRow label="Cancellation Reason" value={a.cancellationReason} />}
            <DetailRow label="Booked By" value={a.bookedByUserName || a.bookedBy || "—"} />
            <DetailRow label="Created" value={new Date(a.createdAt).toLocaleString()} />
          </div>
          {canReview && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
              <button
                type="button"
                onClick={() => onReview(a)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-amber-500 rounded-xl hover:bg-amber-600 border-none cursor-pointer"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Rate Doctor
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CancelModal({
  appointment,
  onClose,
  onCancelled,
}: {
  appointment: Appointment;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await patientService.cancelMyAppointment(appointment.id, reason || undefined);
      onCancelled();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to cancel appointment.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Cancel appointment</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          BS. {appointment.doctorName} &bull; {new Date(appointment.appointmentDate).toLocaleDateString("en-US")}
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          rows={3}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white placeholder-gray-400"
        />
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        <div className="flex gap-3 mt-4">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Back
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
            {loading ? "Cancelling..." : "Confirm cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-gray-400 dark:text-gray-500 block">{label}</span>
      <span className="text-gray-700 dark:text-gray-300">{value}</span>
    </div>
  );
}

function ReviewModal({ appointment, onClose, onSubmitted }: {
  appointment: Appointment;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await patientService.createReview({
        appointmentId: appointment.id,
        rating,
        comment: comment.trim() || undefined,
        isAnonymous,
      });
      setSuccess(true);
      setTimeout(() => onSubmitted(), 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || "Failed to submit review. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#049ebb] to-[#037a94] p-6 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Rate Your Visit</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors border-none cursor-pointer text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-white/80 text-sm mt-1">
            Dr. {appointment.doctorName} &bull; {appointment.doctorSpecialization}
          </p>
          <p className="text-white/60 text-xs mt-0.5">
            {new Date(appointment.appointmentDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-800 dark:text-white">Thank you!</h4>
              <p className="text-sm text-gray-500 mt-1">Your review has been submitted successfully.</p>
            </div>
          ) : (
            <>
              {/* Star Rating */}
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">How was your experience?</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 bg-transparent border-none cursor-pointer transition-transform hover:scale-110"
                    >
                      <svg
                        className={`w-10 h-10 transition-colors ${
                          star <= displayRating ? "text-amber-400" : "text-gray-200 dark:text-gray-600"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
                {displayRating > 0 && (
                  <p className="text-sm font-semibold text-amber-600 mt-2">{ratingLabels[displayRating]}</p>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your feedback <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with the doctor..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#049ebb]/30 focus:border-[#049ebb] transition-colors"
                />
                <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/500</p>
              </div>

              {/* Anonymous Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:bg-[#049ebb] transition-colors" />
                  <div className="absolute left-[2px] top-[2px] bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Post anonymously</span>
                  <p className="text-xs text-gray-400">Your name won't be shown publicly</p>
                </div>
              </label>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || rating === 0}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-[#049ebb] hover:bg-[#037a94] disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-none cursor-pointer"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
