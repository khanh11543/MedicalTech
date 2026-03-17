import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { PageTitle, StarRating } from "./components/SharedComponents";
import publicService, { type Specialty, type DoctorCard } from "../../services/publicService";
import "./landing.css";

function parseHighlights(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export default function DepartmentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [specialty, setSpecialty] = useState<Specialty | null>(null);
  const [doctors, setDoctors] = useState<DoctorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setNotFound(false);

    publicService.getSpecialtyBySlug(slug)
      .then((data) => {
        setSpecialty(data);
        return publicService.getDoctors({ pageSize: 50 });
      })
      .then((res) => {
        const list = res.content;
        if (specialty) {
          setDoctors(list.filter((d) => d.primarySpecialty === specialty.name));
        } else {
          setDoctors(list);
        }
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Re-filter doctors once specialty is loaded
  useEffect(() => {
    if (!specialty) return;
    publicService.getDoctors({ pageSize: 50 }).then((res) => {
      setDoctors(res.content.filter((d) => d.primarySpecialty === specialty.name));
    }).catch(() => {});
  }, [specialty]);

  const handleBookAppointment = (doctorId?: number) => {
    const params = new URLSearchParams();
    if (specialty) params.set("department", specialty.name);
    if (doctorId) params.set("doctor", String(doctorId));
    navigate(`/appointment?${params.toString()}`);
  };

  if (loading) {
    return (
      <>
        <PageTitle
          title="Department Details"
          description="Loading department information..."
          breadcrumbs={[{ label: "Home", to: "/home" }, { label: "Departments", to: "/departments" }, { label: "Loading..." }]}
        />
        <section className="dd-section">
          <div className="container-landing text-center py-20">
            <i className="bi bi-arrow-repeat text-4xl text-[#049ebb] animate-spin"></i>
            <p className="mt-4 text-gray-500">Loading department details...</p>
          </div>
        </section>
      </>
    );
  }

  if (notFound || !specialty) {
    return (
      <>
        <PageTitle
          title="Department Not Found"
          description="The department you are looking for does not exist."
          breadcrumbs={[
            { label: "Home", to: "/home" },
            { label: "Departments", to: "/departments" },
            { label: "Not Found" },
          ]}
        />
        <section className="dd-section">
          <div className="container-landing">
            <div className="dd-not-found">
              <i className="bi bi-exclamation-circle"></i>
              <h3>Department Not Found</h3>
              <p>Sorry, we couldn't find the department you're looking for.</p>
              <Link to="/departments" className="dept-featured-btn">
                Back to Departments
                <i className="bi bi-arrow-left"></i>
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  const highlights = parseHighlights(specialty.highlights);
  const resolveDepartmentIcon = (s: Specialty) => {
    if (s.iconUrl && s.iconUrl.trim()) return s.iconUrl;
    const sl = (s.slug || s.name || "").toLowerCase().trim();
    if (sl === "kham-tong-quat" || sl === "khám-tổng-quát" || sl.includes("tong-quat") || sl.includes("tổng-quát")) {
      return "bi bi-heart-pulse";
    }
    return "bi bi-hospital";
  };
  const icon = resolveDepartmentIcon(specialty);
  const img = specialty.imageUrl || "/images/landing/cardiology-2.webp";

  return (
    <>
      <PageTitle
        title={specialty.name}
        description={specialty.subtitle || specialty.description || "Specialized medical care with experienced professionals."}
        breadcrumbs={[
          { label: "Home", to: "/home" },
          { label: "Departments", to: "/departments" },
          { label: specialty.name },
        ]}
      />

      {/* Department Overview */}
      <section className="dd-section" style={{ background: "#ffffff" }}>
        <div className="container-landing">
          <div className="dd-title-block">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-[70px] h-[70px] rounded-full bg-[rgba(4,158,187,0.15)] flex items-center justify-center">
                <i className={`${icon} text-[2rem] text-[#049ebb]`}></i>
              </div>
            </div>
            <h2 className="dd-dept-name">{specialty.name}</h2>
            {specialty.subtitle && (
              <p className="text-[1.1rem] text-[#049ebb] font-medium mb-2">{specialty.subtitle}</p>
            )}
            <div className="dd-divider"></div>
            <p className="dd-dept-lead">{specialty.description}</p>
          </div>
        </div>
      </section>

      {/* Image + Highlights */}
      <section className="dd-section dd-overview-section">
        <div className="container-landing">
          <div className="dd-overview-grid">
            {/* Left: Department Image */}
            <div className="dd-overview-img-wrapper">
              <img src={img} alt={specialty.name} className="dd-overview-img" loading="lazy" />
            </div>

            {/* Right: Highlights & CTA */}
            <div className="dd-service-cards">
              {highlights.length > 0 ? (
                highlights.map((h) => (
                  <div key={h} className="dd-service-card">
                    <div className="dd-service-card-icon">
                      <i className="bi bi-check-circle-fill"></i>
                    </div>
                    <div className="dd-service-card-body">
                      <h4 className="dd-service-card-title">{h}</h4>
                    </div>
                  </div>
                ))
              ) : (
                <div className="dd-service-card">
                  <div className="dd-service-card-icon">
                    <i className={icon}></i>
                  </div>
                  <div className="dd-service-card-body">
                    <h4 className="dd-service-card-title">Specialized Medical Care</h4>
                    <p className="dd-service-card-desc">
                      Our team of experienced professionals is dedicated to providing the highest quality care
                      with advanced medical technology and personalized treatment plans.
                    </p>
                  </div>
                </div>
              )}

              {/* Book Appointment CTA inside highlights */}
              <div className="mt-4">
                <button
                  onClick={() => handleBookAppointment()}
                  className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-[#049ebb] border-none cursor-pointer transition-all hover:bg-[#037a94] hover:-translate-y-[2px] hover:shadow-[0_8px_25px_rgba(4,158,187,0.4)] flex items-center justify-center gap-3 text-[1.05rem]"
                >
                  <i className="bi bi-calendar-check text-[1.3rem]"></i>
                  Book Appointment — {specialty.name}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Doctors in this Department */}
      {doctors.length > 0 && (
        <section className="py-[60px] bg-[#f8f9fa]">
          <div className="container-landing">
            <div className="text-center mb-10">
              <h2 className="text-[2rem] font-bold text-[#18444c] mb-3">
                Our {specialty.name} Specialists
              </h2>
              <p className="text-gray-500 max-w-[600px] mx-auto">
                Meet our experienced doctors specializing in {specialty.name}. Choose your preferred doctor and book an appointment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-[15px] overflow-hidden shadow-[0_5px_25px_rgba(44,48,49,0.08)] transition-all hover:-translate-y-[5px] hover:shadow-[0_15px_40px_rgba(44,48,49,0.15)]"
                >
                  {/* Doctor Image */}
                  <div className="relative overflow-hidden h-[250px]">
                    {doc.avatarUrl ? (
                      <img
                        src={doc.avatarUrl}
                        alt={doc.fullName}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#049ebb] to-[#037a94] flex items-center justify-center">
                        <span className="text-[4rem] font-bold text-white">{doc.fullName.replace(/^Dr\.?\s*/i, "").charAt(0)}</span>
                      </div>
                    )}
                    {doc.isAvailable && (
                      <div className="absolute top-[15px] right-[15px] py-1 px-3 rounded-[20px] text-[0.75rem] font-semibold uppercase tracking-[0.5px] bg-[rgba(40,167,69,0.9)] text-white">
                        Available
                      </div>
                    )}
                  </div>

                  {/* Doctor Info */}
                  <div className="p-6">
                    <h5 className="text-[1.25rem] font-semibold text-[#18444c] mb-2">
                      {doc.fullName}
                    </h5>
                    <p className="text-[#049ebb] font-medium mb-1">{doc.primarySpecialty}</p>
                    {doc.experienceYears > 0 && (
                      <p className="text-[0.9rem] text-[rgba(44,48,49,0.7)] mb-1">
                        {doc.experienceYears}+ years experience
                      </p>
                    )}
                    {doc.consultationFee > 0 && (
                      <p className="text-[0.9rem] text-[rgba(44,48,49,0.7)] mb-3">
                        Fee: {doc.consultationFee.toLocaleString()} VND
                      </p>
                    )}
                    <div className="flex items-center mb-4">
                      <StarRating rating={doc.ratingCount > 0 ? (doc.ratingAvg ?? 0) : 0} showValue={false} />
                      {doc.ratingCount > 0 ? (
                        <span className="ml-2 text-[0.8rem] text-gray-400">({doc.ratingCount})</span>
                      ) : (
                        <span className="ml-2 text-[0.8rem] text-gray-400">No reviews</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/patient/doctors/${doc.id}`}
                        className="flex-1 py-2 px-4 text-center text-[0.875rem] font-medium rounded-lg border-2 border-[#049ebb] text-[#049ebb] no-underline transition-all hover:bg-[#049ebb] hover:text-white"
                      >
                        View Profile
                      </Link>
                      <button
                        onClick={() => handleBookAppointment(doc.id)}
                        className="flex-1 py-2 px-4 text-center text-[0.875rem] font-medium rounded-lg border-2 border-[#049ebb] bg-[#049ebb] text-white cursor-pointer transition-all hover:bg-[#037a94] hover:border-[#037a94]"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="dd-section dd-services-section">
        <div className="container-landing">
          <div className="dd-services-grid">
            <div className="dd-services-left">
              <h2 className="dd-services-heading">Ready to Get Started?</h2>
              <p className="dd-services-desc">
                Our {specialty.name} department provides comprehensive care with experienced specialists
                and advanced medical technology. Book your appointment today and take the first step
                towards better health.
              </p>

              {highlights.length > 0 && (
                <ul className="dd-services-checklist">
                  {highlights.map((svc) => (
                    <li key={svc}>
                      <i className="bi bi-check-circle-fill"></i>
                      <span>{svc}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="dd-cta-card">
              <div className="dd-cta-content">
                <h3 className="dd-cta-title">Expert Care When You Need It Most</h3>
                <p className="dd-cta-desc">
                  Our dedicated team of {specialty.name} specialists is ready to provide you
                  with the highest quality medical care. You can pay online via MoMo QR or pay at the reception.
                </p>
                <div className="dd-cta-actions">
                  <button onClick={() => handleBookAppointment()} className="dd-cta-btn-primary">
                    <i className="bi bi-calendar-check"></i>
                    Book Appointment
                  </button>
                  <Link to="/departments" className="dd-cta-btn-outline">
                    Other Departments
                    <i className="bi bi-arrow-right"></i>
                  </Link>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[0.85rem] text-gray-500">
                  <i className="bi bi-shield-check text-[#049ebb]"></i>
                  <span>Online payment (MoMo QR) or pay at reception</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
