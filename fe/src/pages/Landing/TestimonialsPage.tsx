import { useState, useEffect, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { PageTitle, StarRating } from "./components/SharedComponents";
import publicService, { type PublicReview } from "../../services/publicService";
import patientService from "../../services/patientService";
import { authStorage } from "../../utils/authStorage";
import { getUploadUrl } from "../../utils/avatar";
import "./landing.css";

interface DisplayReview {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
  type: "review";
  doctorName?: string;
  doctorSpecialty?: string;
  imageUrls?: string[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AvatarCircle({ name, size = "w-12 h-12" }: { name: string; size?: string }) {
  return (
    <div className={`${size} rounded-full overflow-hidden border-2 border-[#049ebb]/20 shrink-0`}>
      <div className="w-full h-full bg-gradient-to-br from-[#049ebb] to-[#037a94] flex items-center justify-center text-white font-bold text-sm">
        {getInitials(name)}
      </div>
    </div>
  );
}

// ==================== Star Picker (interactive) ====================
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl transition-transform hover:scale-110 focus:outline-none"
        >
          <i
            className={`bi ${
              star <= (hover || value) ? "bi-star-fill text-amber-400" : "bi-star text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ==================== Review Form Modal ====================
function ReviewFormModal({
  onClose,
  onSubmitted,
}: {
  onClose: () => void;
  onSubmitted: (item: DisplayReview) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [doctorId, setDoctorId] = useState<number | "">("");
  const [doctors, setDoctors] = useState<{ id: number; fullName: string }[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    publicService
      .getDoctors({ pageSize: 200 })
      .then((res) => setDoctors(res.content || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    if (!comment.trim()) {
      setError("Please enter your review.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        const { url } = await patientService.uploadReviewImage(file);
        imageUrls.push(url);
      }
      const payload: Parameters<typeof patientService.createReview>[0] = {
        rating,
        comment: comment.trim(),
        imageUrls: imageUrls.length ? imageUrls : undefined,
      };
      if (doctorId !== "") payload.doctorId = doctorId as number;
      const result = await patientService.createReview(payload);
      onSubmitted({
        id: `r-${result.id}`,
        name: result.patientName ?? "You",
        rating: result.rating,
        comment: result.comment ?? "",
        createdAt: result.createdAt ?? new Date().toISOString(),
        type: "review",
        doctorName: result.doctorName ?? undefined,
        imageUrls: (result.imageUrls || []).map((u) => getUploadUrl(u) ?? u),
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#18444c]">Write a review</h2>
          <button type="button" title="Close" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <i className="bi bi-x-lg text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Doctor (optional)</label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#049ebb] focus:ring-1 focus:ring-[#049ebb] outline-none bg-white"
            >
              <option value="">— General review (no doctor) —</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your rating</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Share your experience..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#049ebb] focus:ring-1 focus:ring-[#049ebb] outline-none resize-none transition-colors"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/1000</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Images (optional, max 5)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              className="hidden"
              id="testimonial-images"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setImageFiles((prev) => [...prev, ...files].slice(0, 5));
                e.target.value = "";
              }}
            />
            <label
              htmlFor="testimonial-images"
              className="inline-flex items-center gap-2 py-2 px-4 rounded-xl border border-dashed border-gray-300 text-sm text-gray-600 hover:border-[#049ebb] hover:bg-[#049ebb]/5 cursor-pointer transition-colors"
            >
              <i className="bi bi-image" /> Choose images
            </label>
            {imageFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {imageFiles.map((file, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <i className="bi bi-x" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#049ebb] text-white font-medium text-sm hover:bg-[#037a94] transition-colors disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit review"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Main Page ====================
export default function TestimonialsPage() {
  const [items, setItems] = useState<DisplayReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const isLoggedIn = !!authStorage.getAccessToken();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const reviewsRes = await publicService.getReviews({ pageSize: 50 });
      const reviewItems: DisplayReview[] = (reviewsRes.content || []).map((r: PublicReview) => ({
        id: `r-${r.id}`,
        name: r.patientName,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        type: "review" as const,
        doctorName: r.doctorName,
        doctorSpecialty: r.doctorSpecialty,
        imageUrls: (r.imageUrls || []).map((u) => getUploadUrl(u) ?? u),
      }));
      setItems(reviewItems);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const featured = items.filter((r) => r.rating >= 5 && r.comment && r.comment.length > 30).slice(0, 4);
  const regular = items.filter((r) => !featured.includes(r));

  const handleNewTestimonial = (item: DisplayReview) => {
    setItems((prev) => [item, ...prev]);
    setAlreadySubmitted(true);
  };

  if (loading) {
    return (
      <>
        <PageTitle title="Testimonials" description="Hear from our patients about their experiences with MediTrust healthcare." />
        <div className="text-center py-20 text-gray-400">
          <i className="bi bi-arrow-repeat text-3xl animate-spin" />
          <p className="mt-3">Loading testimonials...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle
        title="Testimonials"
        description="Hear from our patients about their experiences with MediTrust healthcare."
        breadcrumbs={[{ label: "Home", to: "/home" }, { label: "Testimonials" }]}
      />

      {/* Write Review CTA */}
      <section className="bg-[#f2f8f9] py-8">
        <div className="container mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#18444c]">Share Your Experience</h2>
            <p className="text-sm text-gray-500 mt-1">
              Your feedback helps us improve our healthcare services.
            </p>
          </div>
          {isLoggedIn ? (
            alreadySubmitted ? (
              <span className="text-sm text-[#049ebb] font-medium flex items-center gap-2">
                <i className="bi bi-check-circle-fill" /> Thank you for your review!
              </span>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="py-3 px-6 rounded-xl bg-[#049ebb] text-white font-medium text-sm hover:bg-[#037a94] transition-colors flex items-center gap-2"
              >
                <i className="bi bi-pencil-square" /> Write a Review
              </button>
            )
          ) : (
            <p className="text-sm text-gray-400">
              <i className="bi bi-lock mr-1" /> Please sign in to write a review.
            </p>
          )}
        </div>
      </section>

      {/* Featured Testimonials Slider */}
      {featured.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto max-w-7xl px-6">
            <Swiper
              modules={[Navigation, Autoplay]}
              slidesPerView={1}
              loop={featured.length > 1}
              speed={600}
              autoplay={{ delay: 5000 }}
              navigation
              className="testimonials-swiper"
            >
              {featured.map((r) => (
                <SwiperSlide key={r.id}>
                  <div className="flex flex-col items-center py-8 px-4 max-w-3xl mx-auto text-center">
                    <StarRating rating={r.rating} showValue={false} />
                    <p className="text-gray-500 my-6 text-lg leading-relaxed italic">"{r.comment}"</p>
                    {r.imageUrls && r.imageUrls.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-2 my-2">
                        {r.imageUrls.slice(0, 3).map((url, i) => (
                          <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                        ))}
                      </div>
                    )}
                    {r.doctorName && (
                      <span className="text-xs text-[#049ebb] font-medium mb-3 px-4 py-1.5 bg-[#049ebb]/5 rounded-full">
                        Reviewed {r.doctorName}{r.doctorSpecialty ? ` — ${r.doctorSpecialty}` : ""}
                      </span>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <AvatarCircle name={r.name} />
                      <div className="text-left">
                        <h3 className="font-bold text-[#18444c]">{r.name}</h3>
                        <span className="text-sm text-gray-400">
                          {new Date(r.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      )}

      {/* All Reviews Grid */}
      <section className="py-16 bg-[#f8f9fa]">
        <div className="container mx-auto max-w-7xl px-6">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <i className="bi bi-chat-heart text-5xl text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-600 mt-4">No testimonials yet</h3>
              <p className="text-sm text-gray-400 mt-1">
                Be the first to share your experience!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(regular.length > 0 ? regular : items).map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition">
                  <StarRating rating={r.rating} showValue={false} />
                  <p className="text-gray-500 my-4">"{r.comment}"</p>
                  {r.imageUrls && r.imageUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 my-3">
                      {r.imageUrls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:opacity-90" />
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AvatarCircle name={r.name} />
                      <div>
                        <h5 className="font-bold text-[#18444c] text-sm">{r.name}</h5>
                        <span className="text-xs text-gray-400">
                          {new Date(r.createdAt).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        {r.type === "review" && r.doctorName && (
                          <p className="text-[10px] text-[#049ebb] mt-0.5">Reviewed {r.doctorName}</p>
                        )}
                        {r.type === "testimonial" && r.doctorName && (
                          <p className="text-[10px] text-[#049ebb] mt-0.5">Doctor: {r.doctorName}</p>
                        )}
                        {r.type === "testimonial" && !r.doctorName && (
                          <p className="text-[10px] text-emerald-500 mt-0.5">General review</p>
                        )}
                      </div>
                    </div>
                    <i className="bi bi-quote text-3xl text-[#049ebb]/20" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Review Form Modal */}
      {showForm && (
        <ReviewFormModal onClose={() => setShowForm(false)} onSubmitted={handleNewTestimonial} />
      )}
    </>
  );
}
