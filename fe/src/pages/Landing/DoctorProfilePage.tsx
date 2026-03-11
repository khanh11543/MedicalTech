import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { PageTitle, StarRating } from "./components/SharedComponents";
import publicService, {
  type DoctorDetail,
  type TimeSlot,
  type PublicReview,
} from "../../services/publicService";
import "./landing.css";

export default function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      publicService.getDoctorDetail(Number(id)),
      publicService.getDoctorSlots(Number(id), today, nextWeek),
      publicService.getDoctorReviews(Number(id), { pageSize: 10 }),
    ])
      .then(([doc, sl, rev]) => {
        setDoctor(doc);
        setSlots(sl.filter((s) => s.isAvailable));
        setReviews(rev.content || []);
      })
      .catch((err) => {
        if (err?.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <>
        <PageTitle
          title="Doctor Profile"
          description="Loading doctor information..."
          breadcrumbs={[{ label: "Home", to: "/home" }, { label: "Doctors", to: "/doctors" }, { label: "Loading..." }]}
        />
        <section className="py-[60px]">
          <div className="container-landing text-center py-20">
            <i className="bi bi-arrow-repeat text-4xl text-[#049ebb] animate-spin"></i>
            <p className="mt-4 text-gray-500">Loading doctor profile...</p>
          </div>
        </section>
      </>
    );
  }

  if (notFound || !doctor) {
    return (
      <>
        <PageTitle
          title="Doctor Not Found"
          description="The doctor you are looking for does not exist."
          breadcrumbs={[{ label: "Home", to: "/home" }, { label: "Doctors", to: "/doctors" }, { label: "Not Found" }]}
        />
        <section className="py-[60px]">
          <div className="container-landing text-center py-20">
            <i className="bi bi-person-x text-5xl text-gray-300"></i>
            <h3 className="text-xl font-bold text-[#18444c] mt-4">Doctor Not Found</h3>
            <p className="text-gray-500 mt-2">Sorry, we couldn't find the doctor you're looking for.</p>
            <Link to="/doctors" className="inline-flex items-center gap-2 mt-6 text-[#049ebb] font-semibold no-underline">
              <i className="bi bi-arrow-left"></i> Back to Doctors
            </Link>
          </div>
        </section>
      </>
    );
  }

  const slotsByDate = slots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
    (acc[slot.slotDate] = acc[slot.slotDate] || []).push(slot);
    return acc;
  }, {});

  const handleBook = () => {
    navigate(`/appointment?doctor=${doctor.id}&department=${encodeURIComponent(doctor.primarySpecialty)}`);
  };

  return (
    <>
      <PageTitle
        title={doctor.fullName}
        description={doctor.primarySpecialty}
        breadcrumbs={[
          { label: "Home", to: "/home" },
          { label: "Doctors", to: "/doctors" },
          { label: doctor.fullName },
        ]}
      />

      {/* Hero / Profile Header */}
      <section className="py-[50px] bg-white">
        <div className="container-landing">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="w-[200px] h-[200px] min-w-[200px] rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
              {doctor.avatarUrl ? (
                <img src={doctor.avatarUrl} alt={doctor.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#049ebb] to-[#037a94] flex items-center justify-center">
                  <span className="text-5xl font-bold text-white">{doctor.fullName?.charAt(0)}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-[2rem] font-bold text-[#18444c] mb-1">{doctor.fullName}</h1>
              <p className="text-[1.1rem] text-[#049ebb] font-medium mb-3">
                {doctor.primarySpecialty}
                {doctor.experienceYears > 0 && (
                  <span className="text-[rgba(44,48,49,0.6)]"> | {doctor.experienceYears} years experience</span>
                )}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <StarRating rating={doctor.ratingCount > 0 ? (doctor.ratingAvg ?? 0) : 0} showValue={false} />
                <span className="text-[0.95rem] text-gray-500">
                  {doctor.ratingCount > 0
                    ? `${(doctor.ratingAvg ?? 0).toFixed(1)} (${doctor.ratingCount} reviews)`
                    : "No reviews"}
                </span>
              </div>

              {/* Quick Info Pills */}
              <div className="flex flex-wrap gap-3 mb-6">
                {doctor.isAvailable && (
                  <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full text-[0.85rem] font-medium bg-[rgba(40,167,69,0.1)] text-[#28a745]">
                    <i className="bi bi-check-circle-fill"></i> Available for Booking
                  </span>
                )}
                {doctor.hospitalAffiliation && (
                  <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full text-[0.85rem] font-medium bg-[rgba(4,158,187,0.1)] text-[#049ebb]">
                    <i className="bi bi-hospital"></i> {doctor.hospitalAffiliation}
                  </span>
                )}
                {doctor.verificationStatus === "VERIFIED" && (
                  <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full text-[0.85rem] font-medium bg-[rgba(4,158,187,0.1)] text-[#049ebb]">
                    <i className="bi bi-patch-check-fill"></i> Verified
                  </span>
                )}
              </div>

              {/* Book Button */}
              <button
                onClick={handleBook}
                className="inline-flex items-center gap-2 py-[14px] px-[32px] rounded-xl font-semibold text-white bg-[#049ebb] border-none cursor-pointer transition-all hover:bg-[#037a94] hover:-translate-y-[2px] hover:shadow-[0_8px_25px_rgba(4,158,187,0.4)] text-[1rem]"
              >
                <i className="bi bi-calendar-check text-[1.2rem]"></i>
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="py-[50px] bg-[#f8f9fa]">
        <div className="container-landing">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Specialties */}
              {doctor.specialties && doctor.specialties.length > 0 && (
                <div className="bg-white rounded-2xl p-8 shadow-[0_5px_20px_rgba(0,0,0,0.06)]">
                  <h3 className="text-[1.3rem] font-bold text-[#18444c] mb-4 flex items-center gap-2">
                    <i className="bi bi-heart-pulse text-[#049ebb]"></i> Specialties
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {doctor.specialties.map((s) => (
                      <span
                        key={s.id}
                        className="py-2 px-4 rounded-full bg-[rgba(4,158,187,0.08)] text-[#049ebb] font-medium text-[0.9rem]"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* About */}
              {doctor.bio && (
                <div className="bg-white rounded-2xl p-8 shadow-[0_5px_20px_rgba(0,0,0,0.06)]">
                  <h3 className="text-[1.3rem] font-bold text-[#18444c] mb-4 flex items-center gap-2">
                    <i className="bi bi-person-lines-fill text-[#049ebb]"></i> About Doctor
                  </h3>
                  <p className="text-[rgba(44,48,49,0.8)] leading-relaxed whitespace-pre-line">{doctor.bio}</p>
                </div>
              )}

              {/* Education */}
              {doctor.education && (
                <div className="bg-white rounded-2xl p-8 shadow-[0_5px_20px_rgba(0,0,0,0.06)]">
                  <h3 className="text-[1.3rem] font-bold text-[#18444c] mb-4 flex items-center gap-2">
                    <i className="bi bi-mortarboard text-[#049ebb]"></i> Experience &amp; Education
                  </h3>
                  <p className="text-[rgba(44,48,49,0.8)] leading-relaxed whitespace-pre-line">{doctor.education}</p>
                  {doctor.licenseNumber && (
                    <p className="mt-3 text-[0.9rem] text-gray-500">
                      <i className="bi bi-card-text mr-2"></i>License: {doctor.licenseNumber}
                    </p>
                  )}
                </div>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <div className="bg-white rounded-2xl p-8 shadow-[0_5px_20px_rgba(0,0,0,0.06)]">
                  <h3 className="text-[1.3rem] font-bold text-[#18444c] mb-6 flex items-center gap-2">
                    <i className="bi bi-chat-square-quote text-[#049ebb]"></i> Patient Reviews
                  </h3>
                  <div className="space-y-5">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="border-b border-gray-100 pb-5 last:border-none last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[rgba(4,158,187,0.1)] flex items-center justify-center">
                              <i className="bi bi-person text-[#049ebb]"></i>
                            </div>
                            <div>
                              <p className="font-semibold text-[#18444c] text-[0.95rem]">
                                {rev.isAnonymous ? "Anonymous Patient" : rev.patientName}
                              </p>
                              <p className="text-[0.8rem] text-gray-400">
                                {new Date(rev.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                              </p>
                            </div>
                          </div>
                          <StarRating rating={rev.rating} showValue={false} />
                        </div>
                        <p className="text-[rgba(44,48,49,0.75)] text-[0.95rem] leading-relaxed ml-[52px]">
                          {rev.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Consultation Fee */}
              <div className="bg-white rounded-2xl p-6 shadow-[0_5px_20px_rgba(0,0,0,0.06)]">
                <h3 className="text-[1.1rem] font-bold text-[#18444c] mb-4 flex items-center gap-2">
                  <i className="bi bi-cash-coin text-[#049ebb]"></i> Consultation Fee
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[rgba(44,48,49,0.7)]">Initial Consultation</span>
                    <span className="font-bold text-[#18444c] text-[1.1rem]">
                      {doctor.consultationFee?.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  {doctor.followUpFee > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-[rgba(44,48,49,0.7)]">Follow-up</span>
                      <span className="font-bold text-[#18444c] text-[1.1rem]">
                        {doctor.followUpFee?.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Available Schedule */}
              <div className="bg-white rounded-2xl p-6 shadow-[0_5px_20px_rgba(0,0,0,0.06)]">
                <h3 className="text-[1.1rem] font-bold text-[#18444c] mb-4 flex items-center gap-2">
                  <i className="bi bi-calendar3 text-[#049ebb]"></i> Available Schedule
                </h3>
                {Object.keys(slotsByDate).length === 0 ? (
                  <p className="text-gray-400 text-[0.9rem] text-center py-4">
                    No available slots in the next 7 days
                  </p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                      <div key={date}>
                        <p className="text-[0.8rem] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          {new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {dateSlots.map((slot) => (
                            <span
                              key={slot.id}
                              className="py-1.5 px-3 rounded-lg text-[0.8rem] font-medium bg-[rgba(4,158,187,0.08)] text-[#049ebb] border border-[rgba(4,158,187,0.2)]"
                            >
                              {slot.startTime?.slice(0, 5)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleBook}
                  className="w-full mt-5 py-3 rounded-xl font-semibold text-white bg-[#049ebb] border-none cursor-pointer transition-all hover:bg-[#037a94] hover:shadow-[0_5px_15px_rgba(4,158,187,0.3)] flex items-center justify-center gap-2"
                >
                  <i className="bi bi-calendar-check"></i>
                  Book Appointment
                </button>
              </div>

              {/* Clinic Location */}
              {doctor.officeAddress && (
                <div className="bg-white rounded-2xl p-6 shadow-[0_5px_20px_rgba(0,0,0,0.06)]">
                  <h3 className="text-[1.1rem] font-bold text-[#18444c] mb-4 flex items-center gap-2">
                    <i className="bi bi-geo-alt text-[#049ebb]"></i> Clinic Location
                  </h3>
                  <p className="text-[rgba(44,48,49,0.75)] text-[0.95rem] leading-relaxed">
                    {doctor.officeAddress}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
