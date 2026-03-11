import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StarRating } from "./components/SharedComponents";
import publicService, { type Specialty } from "../../services/publicService";
import "./landing.css";

/* ============================================================
   HomePage — Pixel-accurate match to MediTrust Bootstrap template
   ============================================================ */

// ==================== Section Title (Homepage) ====================
function HomeSectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="text-center pb-[60px]">
      <h2 className="section-title-home-h2">{title}</h2>
      {description && <p className="mb-0 text-gray-500">{description}</p>}
    </div>
  );
}

// ==================== Hero Section ====================
function HeroSection() {
  return (
    <section className="hero-home relative overflow-hidden">
      {/* Background Image + Overlay */}
      <div className="absolute inset-0 z-[1]">
        <img
          src="/images/landing/showcase-1.webp"
          alt="Advanced Healthcare"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(2,20,24,0.8)] to-[rgba(4,158,187,0.5)]" />
      </div>

      {/* Content */}
      <div className="relative z-[3] w-full py-12">
        <div className="container-landing">
          {/* Text Content — col-lg-7 equivalent */}
          <div className="lg:w-[58.333%] py-8">
            <span className="inline-block bg-[rgba(4,158,187,0.8)] text-white py-2 px-4 rounded-full text-[0.9rem] font-medium mb-6">
              Leading Healthcare Specialists
            </span>

            <h1 className="text-[2.2rem] sm:text-[2.5rem] md:text-[3rem] xl:text-[3.5rem] font-bold text-white mb-6 leading-[1.2]">
              Advanced Medical Care for Your Family's Health
            </h1>

            <p className="text-[1rem] md:text-[1.2rem] text-white/80 mb-8 max-w-[600px] leading-relaxed">
              Providing trusted healthcare services with advanced technology and compassionate medical professionals dedicated to your well-being
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
              <Link
                to="/appointment"
                className="inline-block py-[0.8rem] px-8 rounded-full font-semibold text-base bg-[#049ebb] border-2 border-[#049ebb] text-white no-underline text-center transition-all hover:bg-[rgba(4,158,187,0.8)] hover:border-[rgba(4,158,187,0.8)]"
              >
                Book Appointment
              </Link>
              <Link
                to="/services"
                className="inline-block py-[0.8rem] px-8 rounded-full font-semibold text-base bg-transparent border-2 border-[#049ebb] text-[#049ebb] no-underline text-center transition-all hover:bg-[#049ebb] hover:text-white"
              >
                Explore Services
              </Link>
            </div>

            {/* Info Badges */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
              <div className="flex items-center gap-4">
                <i className="bi bi-telephone-fill text-[2rem] text-[#049ebb]"></i>
                <div className="flex flex-col">
                  <span className="text-white/80 text-[0.9rem]">Emergency Line</span>
                  <strong className="text-[1.1rem] font-semibold text-white">
                    +84 925 147 580
                  </strong>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <i className="bi bi-clock-fill text-[2rem] text-[#049ebb]"></i>
                <div className="flex flex-col">
                  <span className="text-white/80 text-[0.9rem]">Working Hours</span>
                  <strong className="text-[1.1rem] font-semibold text-white">
                    Mon-Fri: 8AM-5.30PM
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Features Row — glass panel */}
          <div className="bg-white/80 backdrop-blur-sm rounded-[15px] shadow-[0_10px_30px_rgba(0,0,0,0.1)] p-8 mt-4 ">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: "bi bi-heart-pulse-fill",
                  title: "Cardiology",
                  desc: "Specialized heart care including diagnosis, treatment, and prevention of cardiovascular diseases using modern cardiology technologies.",
                },
                {
                  icon: "bi bi-lungs-fill",
                  title: "Pulmonology",
                  desc: "Comprehensive respiratory care including diagnosis, treatment, and management of lung diseases using advanced pulmonology techniques.",
                },
                {
                  icon: "bi bi-capsule",
                  title: "Diagnostics",
                  desc: "Accurate diagnostic services including laboratory testing, imaging, and health screenings to support early disease detection.",
                },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-4">
                  <div className="w-[60px] h-[60px] min-w-[60px] rounded-xl bg-[rgba(4,158,187,0.15)] flex items-center justify-center">
                    <i className={`${f.icon} text-[1.8rem] text-[#049ebb]`}></i>
                  </div>
                  <div>
                    <h3 className="text-[1.2rem] font-semibold text-[#18444c] mb-2">
                      {f.title}
                    </h3>
                    <p className="text-[0.95rem] text-[rgba(44,48,49,0.7)] m-0">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==================== About Section ====================
function AboutSection() {
  return (
    <section className="py-[60px] bg-white">
      <div className="container-landing">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-12 lg:gap-x-12 items-center">
          {/* Image */}
          <div className="relative">
            <img
              src="/images/landing/facilities-1.webp"
              alt="Modern Healthcare Facility"
              className="w-full rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.1)] mb-4"
            />
            <div className="absolute bottom-0 right-[30px] translate-y-[30%] bg-[#049ebb] text-white py-5 px-5 rounded-lg shadow-[0_10px_20px_rgba(0,0,0,0.1)] text-center z-10">
              <span className="block text-[36px] font-bold leading-[1.1]">25+</span>
              <span className="block text-[14px]">Years of Excellence</span>
            </div>
          </div>

          {/* Content */}
          <div>
            <h2 className="text-[32px] font-bold text-[#18444c] mb-4">
              Committed to Exceptional Patient Care
            </h2>
            <p className="text-[18px] font-medium text-[rgba(24,68,76,0.8)] mb-4 text-justify">
              At MediTrust Medical Center, our mission is to provide high-quality healthcare through advanced medical technology, experienced physicians, and compassionate patient-centered care.
            </p>
            <p className="text-[#2c3031] mb-4 text-justify">
             We combine modern medical expertise with personalized treatment plans to ensure every patient receives safe, effective, and comfortable healthcare services. Our team is dedicated to improving patient outcomes and supporting long-term health and wellness.
            </p>

            {/* Feature Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {[
                {
                  icon: "bi bi-heart-pulse",
                  title: "Compassionate Care",
                  desc: "Our medical professionals prioritize patient comfort, respect, and emotional support throughout every stage of treatment.",
                },
                {
                  icon: "bi bi-star",
                  title: "Medical Excellence",
                  desc: "Our hospital is equipped with advanced medical technologies and staffed by highly qualified specialists committed to delivering exceptional healthcare.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-5 rounded-lg bg-white shadow-[0_5px_15px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-[5px] hover:shadow-[0_10px_20px_rgba(0,0,0,0.1)]"
                >
                  <i
                    className={`${item.icon} text-[32px] text-[#049ebb] mb-4 block`}
                  ></i>
                  <h4 className="text-[18px] font-semibold mb-2">{item.title}</h4>
                  <p className="text-[14px] text-gray-500 m-0">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA Buttons — rounded-md (6px) matching original */}
            <div className="flex flex-wrap gap-4 mt-6">
              <Link
                to="/about"
                className="inline-block py-[10px] px-6 rounded-md font-medium bg-[#049ebb] text-white no-underline transition-all hover:bg-[#037a94]"
              >
                Learn More About Us
              </Link>
              <Link
                to="/doctors"
                className="inline-block py-[10px] px-6 rounded-md font-medium border border-[rgba(44,48,49,0.3)] text-[#2c3031] no-underline transition-all hover:bg-[rgba(44,48,49,0.1)]"
              >
                Meet Our Team
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

// ==================== Featured Departments ====================
// ==================== Featured Departments ====================

function DepartmentsSection() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<{ icon: string; title: string; desc: string; img: string; slug: string }[]>([]);

  useEffect(() => {
    publicService.getSpecialties().then((list) => {
      if (list.length > 0) {
        setDepartments(list.slice(0, 6).map((s: Specialty) => ({
          icon: s.iconUrl || "bi bi-hospital",
          title: s.name,
          desc: s.description || "Specialized medical care with experienced professionals.",
          img: s.imageUrl || "/images/landing/cardiology-3.webp",
          slug: s.slug || s.name.toLowerCase().replace(/\s+/g, "-"),
        })));
      }
    }).catch(() => {});
  }, []);

  return (
    <section className="py-[60px] bg-white">
      <div className="container-landing">
        {departments.length === 0 && (
          <div className="text-center py-10 text-gray-400">Loading departments...</div>
        )}

        <HomeSectionTitle
          title="Featured Departments"
          description="Explore our specialized departments offering comprehensive diagnosis, treatment, and preventive healthcare services delivered by experienced medical professionals."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div
              key={dept.title}
              className="bg-white rounded-xl overflow-hidden shadow-[0_5px_15px_rgba(44,48,49,0.15)] transition-all hover:-translate-y-[5px] hover:shadow-[0_15px_30px_rgba(44,48,49,0.25)] h-full group"
            >
              {/* Image */}
              <div className="relative h-[200px] overflow-hidden">
                <img
                  src={dept.img}
                  alt={dept.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              {/* Content */}
              <div className="relative p-[30px]">
                {/* Circle Icon — accent bg, white icon */}
                <div className="absolute -top-[30px] left-[30px] w-[60px] h-[60px] rounded-full bg-[#049ebb] flex items-center justify-center shadow-[0_5px_15px_rgba(4,158,187,0.4)]">
                  <i className={`${dept.icon} text-[24px] text-white`}></i>
                </div>
                <h3 className="text-[24px] font-bold text-[#18444c] mt-10 mb-4">
                  {dept.title}
                </h3>
                <p className="text-[15px] leading-relaxed text-[rgba(44,48,49,0.8)] mb-6">
                  {dept.desc}
                </p>
                <div className="flex items-center gap-4">
                  <Link
                    to={`/departments/${dept.slug}`}
                    className="inline-flex items-center gap-2 text-[#049ebb] font-semibold text-[14px] no-underline transition-all group/link"
                  >
                    <span className="transition-transform group-hover/link:translate-x-[3px]">
                      Learn More
                    </span>
                    <i className="fas fa-arrow-right text-[16px] transition-transform group-hover/link:translate-x-[3px]"></i>
                  </Link>
                  <button
                    onClick={() => navigate(`/appointment?department=${encodeURIComponent(dept.title)}`)}
                    className="inline-flex items-center gap-2 py-[6px] px-4 rounded-lg text-[13px] font-semibold text-white bg-[#049ebb] border-none cursor-pointer transition-all hover:bg-[#037a94] hover:shadow-[0_4px_12px_rgba(4,158,187,0.4)]"
                  >
                    <i className="bi bi-calendar-check"></i>
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== Featured Services ====================
function ServicesSection() {
  const services = [
    {
      icon: "fas fa-heartbeat",
      title: "Cardiology Excellence",
      desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.",
      features: [
        "Advanced Heart Surgery",
        "24/7 Emergency Care",
        "Preventive Screenings",
      ],
    },
    {
      icon: "fas fa-brain",
      title: "Neurology & Brain Health",
      desc: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse.",
      features: [
        "Brain Imaging & Diagnostics",
        "Stroke Treatment Center",
        "Neurological Rehabilitation",
      ],
    },
    {
      icon: "fas fa-bone",
      title: "Orthopedic Surgery",
      desc: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error.",
      features: [
        "Joint Replacement Surgery",
        "Sports Medicine",
        "Minimally Invasive Procedures",
      ],
    },
    {
      icon: "fas fa-ambulance",
      title: "Emergency & Trauma Care",
      desc: "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
      features: [
        "24/7 Emergency Department",
        "Level 1 Trauma Center",
        "Critical Care Units",
      ],
    },
  ];

  return (
    <section className="py-[60px] bg-white">
      <div className="container-landing">
        <HomeSectionTitle
          title="Featured Services"
          description="Our healthcare services are designed to support your health at every stage of life with personalized treatment and advanced medical technology."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="service-card-home relative bg-white rounded-[10px] overflow-hidden border border-[rgba(44,48,49,0.1)] transition-all hover:-translate-y-[5px] hover:shadow-[0_10px_30px_rgba(44,48,49,0.15)] hover:border-[rgba(4,158,187,0.3)] h-full"
            >
              <div className="p-[40px_30px]">
                {/* Circle Icon */}
                <div className="w-20 h-20 rounded-full bg-[rgba(4,158,187,0.1)] flex items-center justify-center mb-6">
                  <i
                    className={`${service.icon} text-[36px] text-[#049ebb]`}
                  ></i>
                </div>
                {/* Content */}
                <h3 className="text-[22px] font-bold text-[#18444c] mb-4">
                  {service.title}
                </h3>
                <p className="text-[15px] text-[rgba(44,48,49,0.8)] leading-relaxed mb-5">
                  {service.desc}
                </p>
                <ul className="list-none p-0 mb-6 space-y-[10px]">
                  {service.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center text-[14px] text-[#2c3031]"
                    >
                      <i className="fas fa-check-circle text-[#049ebb] mr-[10px] text-[16px] shrink-0"></i>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/services"
                  className="inline-flex items-center text-[#049ebb] font-semibold text-[15px] no-underline transition-all group"
                >
                  Learn More
                  <i className="fas fa-arrow-right ml-2 text-[14px] transition-transform group-hover:translate-x-[5px]"></i>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== Find A Doctor Section ====================
function DoctorSection() {
  const [doctors, setDoctors] = useState<{ id: number; name: string; specialty: string; exp: string; rating: number; ratingCount: number; img: string; isAvailable: boolean }[]>([]);

  useEffect(() => {
    publicService.getDoctors({ pageSize: 6, sortBy: "ratingAvg", sortOrder: "desc" }).then((res) => {
      const list = res.content;
      if (Array.isArray(list) && list.length > 0) {
        setDoctors(list.map((d) => ({
          id: d.id,
          name: d.fullName,
          specialty: d.primarySpecialty || "General",
          exp: d.experienceYears ? `${d.experienceYears}+ years` : "",
          rating: d.ratingAvg ?? 0,
          ratingCount: d.ratingCount ?? 0,
          img: d.avatarUrl || "",
          isAvailable: d.isAvailable,
        })));
      }
    }).catch(() => {});
  }, []);

  if (doctors.length === 0) return null;

  return (
    <section className="py-[60px] bg-white">
      <div className="container-landing">
        <HomeSectionTitle
          title="Our Doctors"
          description="Meet our team of highly qualified physicians and specialists dedicated to providing exceptional patient care."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-[15px] overflow-hidden shadow-[0_5px_25px_rgba(44,48,49,0.08)] transition-all hover:-translate-y-[5px] hover:shadow-[0_15px_40px_rgba(44,48,49,0.15)]"
            >
              <div className="relative overflow-hidden h-[250px]">
                {doc.img ? (
                  <img
                    src={doc.img}
                    alt={doc.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#049ebb] to-[#037a94] flex items-center justify-center">
                    <span className="text-[4rem] font-bold text-white">{doc.name.replace(/^Dr\.?\s*/i, "").charAt(0)}</span>
                  </div>
                )}
                {doc.isAvailable && (
                  <div className="absolute top-[15px] right-[15px] py-1 px-3 rounded-[20px] text-[0.75rem] font-semibold uppercase tracking-[0.5px] bg-[rgba(40,167,69,0.9)] text-white">
                    Available
                  </div>
                )}
              </div>
              <div className="p-6">
                <h5 className="text-[1.25rem] font-semibold text-[#18444c] mb-2">
                  {doc.name}
                </h5>
                <p className="text-[#049ebb] font-medium mb-1">{doc.specialty}</p>
                {doc.exp && (
                  <p className="text-[0.9rem] text-[rgba(44,48,49,0.7)] mb-1">
                    {doc.exp} experience
                  </p>
                )}
                <div className="flex items-center mb-4">
                  <StarRating rating={doc.ratingCount > 0 ? doc.rating : 0} showValue={false} />
                  {doc.ratingCount > 0 ? (
                    <span className="ml-2 text-[0.8rem] text-gray-400">({doc.ratingCount})</span>
                  ) : (
                    <span className="ml-2 text-[0.8rem] text-gray-400">No reviews</span>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <Link
                    to={`/doctors/${doc.id}`}
                    className="w-full flex items-center justify-center py-2 px-4 text-center text-[0.875rem] font-medium rounded-lg border-2 border-[#049ebb] text-[#049ebb] no-underline transition-all hover:bg-[#049ebb] hover:text-white"
                  >
                    View Profile
                  </Link>
                  <Link
                    to={`/appointment?doctor=${doc.id}&department=${encodeURIComponent(doc.specialty)}`}
                    className="w-full flex items-center justify-center py-2 px-4 text-center text-[0.875rem] font-medium rounded-lg border-2 border-[#049ebb] bg-[#049ebb] text-white no-underline transition-all hover:bg-[#037a94] hover:border-[#037a94]"
                  >
                    Book Appointment
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Doctors */}
        <div className="text-center mt-10">
          <Link
            to="/doctors"
            className="inline-flex items-center gap-2 py-[14px] px-[32px] rounded-full font-semibold border-2 border-[#049ebb] text-[#049ebb] no-underline transition-all hover:bg-[#049ebb] hover:text-white hover:-translate-y-[2px]"
          >
            View All Doctors
            <i className="bi bi-arrow-right"></i>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ==================== CTA Section (Light Background) ====================
function CTASection() {
  return (
    <section className="py-[60px] bg-white">
      <div className="container-landing">
        {/* Header */}
        <div className="text-center max-w-[800px] mx-auto">
          <h2 className="text-[2.5rem] font-bold text-[#18444c] mb-4">
            Your Health is Our Priority
          </h2>
          <p className="text-[1.1rem] text-[rgba(44,48,49,0.8)] leading-relaxed mb-8">
            Schedule an appointment with one of our experienced healthcare professionals and receive personalized medical care tailored to your needs.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <Link
              to="/appointment"
              className="inline-block py-[15px] px-[30px] rounded-full font-semibold bg-[#049ebb] border-2 border-[#049ebb] text-white no-underline transition-all hover:bg-[#037a94] hover:border-[#037a94] hover:-translate-y-[2px]"
            >
              Book Appointment
            </Link>
            <Link
              to="/doctors"
              className="inline-block py-[15px] px-[30px] rounded-full font-semibold bg-transparent border-2 border-[#049ebb] text-[#049ebb] no-underline transition-all hover:-translate-y-[2px]"
            >
              Find a Doctor
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 mb-12">
          {[
            {
              icon: "bi bi-heart-pulse",
              title: "24/7 Emergency Care",
              desc: "Immediate medical assistance available around the clock for critical and life-threatening conditions.",
              link: "Learn More",
              to: "/services",
            },
            {
              icon: "bi bi-calendar-check",
              title: "Easy Online Booking",
              desc: "Schedule your medical appointment quickly and conveniently through our online system. Choose your preferred doctor, department, and time to receive personalized healthcare services.",
              link: "Book Now",
              to: "/appointment",
            },
            {
              icon: "bi bi-people",
              title: "Expert Medical Team",
              desc: "Highly qualified doctors and healthcare specialists committed to delivering exceptional care.",
              link: "Meet Our Doctors",
              to: "/doctors",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-white p-[2.5rem_2rem] rounded-[15px] text-center border border-[rgba(44,48,49,0.1)] shadow-[0_5px_20px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-[10px] hover:shadow-[0_15px_40px_rgba(0,0,0,0.15)] h-full group"
            >
              <div className="w-20 h-20 rounded-full bg-[rgba(4,158,187,0.1)] flex items-center justify-center mx-auto mb-6 transition-all group-hover:bg-[#049ebb]">
                <i
                  className={`${card.icon} text-[2rem] text-[#049ebb] transition-colors group-hover:text-white`}
                ></i>
              </div>
              <h5 className="text-[1.3rem] font-semibold text-[#18444c] mb-4">
                {card.title}
              </h5>
              <p className="text-[rgba(44,48,49,0.7)] leading-relaxed mb-6">
                {card.desc}
              </p>
              <Link
                to={card.to}
                className="inline-flex items-center text-[#049ebb] font-semibold no-underline transition-all group/link"
              >
                <span className="mr-2">{card.link}</span>
                <i className="bi bi-arrow-right transition-transform group-hover/link:translate-x-[5px]"></i>
              </Link>
            </div>
          ))}
        </div>

        {/* Emergency Alert — teal gradient (matching original) */}
        <div className="bg-gradient-to-br from-[#049ebb] to-[#037a94] rounded-[15px] p-8 text-white mt-12">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex items-center flex-1 mb-4 md:mb-0">
              <div className="w-[60px] h-[60px] min-w-[60px] bg-[rgba(255,255,255,0.15)] rounded-full flex items-center justify-center mr-6">
                <i className="bi bi-telephone-fill text-[1.5rem] text-white"></i>
              </div>
              <div>
                <h4 className="text-[1.4rem] font-semibold text-white mb-1">
                  Medical Emergency?
                </h4>
                <p className="text-white/80 m-0">
                  Call our 24/7 emergency hotline for immediate assistance
                </p>
              </div>
            </div>
            <a
              href="tel:8362374768"
              className="inline-flex items-center bg-white text-[#049ebb] py-[15px] px-[25px] rounded-full font-bold text-[1.1rem] no-underline transition-all hover:-translate-y-[2px] hover:shadow-[0_8px_25px_rgba(0,0,0,0.2)] whitespace-nowrap"
            >
              <i className="bi bi-telephone-fill mr-[10px] text-[1.2rem]"></i>
              Call  
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==================== Emergency Info Section ====================
function EmergencySection() {
  return (
    <section className="py-[60px] bg-white">
      <div className="container-landing">
        <HomeSectionTitle
          title="Emergency Info"
          description="If you are experiencing a medical emergency, please contact emergency services immediately or visit our emergency department."
        />

        {/* col-lg-8 col-md-10 mx-auto equivalent */}
        <div className="max-w-[960px] mx-auto">
          {/* Emergency Alert Banner — red gradient */}
          <div className="flex flex-col md:flex-row items-center gap-5 bg-gradient-to-br from-[#dc3545] to-[#c82333] text-white p-[30px] rounded-[15px] mb-10 shadow-[0_10px_30px_rgba(220,53,69,0.3)]">
            <i className="bi bi-exclamation-triangle-fill text-[3rem] opacity-90 shrink-0"></i>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-[1.8rem] font-bold text-white mb-2">
                Medical Emergency?
              </h3>
              <p className="text-[1.1rem] leading-normal text-white/90 m-0">
                If you are experiencing a life-threatening emergency, call 911
                immediately or go to your nearest emergency room.
              </p>
            </div>
            <a
              href="tel:911"
              className="inline-flex items-center gap-2 bg-white text-[#dc3545] py-3 px-6 rounded-full font-semibold no-underline transition-all hover:-translate-y-[2px] hover:shadow-[0_5px_15px_rgba(0,0,0,0.2)] whitespace-nowrap shrink-0"
            >
              <i className="bi bi-telephone-fill text-[1.1rem]"></i>
              Call 911
            </a>
          </div>

          {/* Contact Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
  {[
    {
      icon: "bi bi-hospital",
      title: "Emergency Medical Service",
      phone: "115",
      address: "Ho Chi Minh City Emergency Center 115",
      hours: "Open 24/7",
      urgent: true,
    },
    {
      icon: "bi bi-clock",
      title: "After-hours Clinic",
      phone: "+84 28 3855 4269",
      address: "Cho Ray Hospital, 201B Nguyen Chi Thanh St, District 5, Ho Chi Minh City",
      hours: "Mon - Sun: 7:00 AM - 10:00 PM",
    },
    {
      icon: "bi bi-headset",
      title: "Medical Consultation Hotline",
      phone: "1900 9095",
      address: "Vietnam Ministry of Health Medical Advisory Service",
      hours: "Available 24/7",
    },
    {
      icon: "bi bi-heart-pulse",
      title: "Poison Control Center",
      phone: "+84 28 3855 4137",
      address: "Poison Control Center - Cho Ray Hospital, Ho Chi Minh City",
      hours: "Available 24/7",
    },
            ].map((card) => (
              <div
                key={card.title}
                className={`bg-white rounded-xl p-6 shadow-[0_5px_20px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-[5px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.15)] border-l-4 ${
                  card.urgent ? "border-l-[#dc3545]" : "border-l-[#049ebb]"
                }`}
              >
                {/* Icon — centered */}
                <div className="text-center mb-5">
                  <i
                    className={`${card.icon} text-[2.5rem] ${
                      card.urgent ? "text-[#dc3545]" : "text-[#049ebb]"
                    }`}
                  ></i>
                </div>
                {/* Content — centered */}
                <div className="text-center mb-5">
                  <h4 className="text-[#18444c] font-semibold mb-4">
                    {card.title}
                  </h4>
                  <p className="flex items-center justify-center gap-2 text-[0.95rem] mb-2">
                    <i className="bi bi-telephone text-[#049ebb]"></i>
                    <span className="font-medium">{card.phone}</span>
                  </p>
                  <p className="flex items-center justify-center gap-2 text-[0.95rem] text-gray-600 mb-2">
                    <i className="bi bi-geo-alt text-[#049ebb]"></i>
                    {card.address}
                  </p>
                  <p className="text-[0.9rem] text-[rgba(44,48,49,0.8)] font-medium m-0">
                    {card.hours}
                  </p>
                </div>
                {/* CTA — centered */}
                <div className="text-center">
                  <a
                    href={`tel:${card.phone.replace(/\D/g, "")}`}
                    className="inline-block bg-[#049ebb] text-white py-[10px] px-5 rounded-full font-medium no-underline transition-all hover:bg-[#037a94] hover:-translate-y-[2px]"
                  >
                    Call Now
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-[30px] shadow-[0_5px_20px_rgba(0,0,0,0.1)] mb-10">
            <h4 className="text-center text-[#18444c] font-semibold mb-6">
              Quick Actions
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: "bi bi-geo-alt-fill", label: "Get Directions" },
                { icon: "bi bi-calendar-check", label: "Book Appointment" },
                { icon: "bi bi-person-badge", label: "Find a Doctor" },
                { icon: "bi bi-chat-dots", label: "Live Chat" },
              ].map((action) => (
                <a
                  key={action.label}
                  href="#"
                  className="flex flex-col items-center p-5 rounded-lg no-underline text-[#2c3031] transition-all hover:bg-[rgba(4,158,187,0.1)] hover:text-[#049ebb] hover:-translate-y-[3px]"
                >
                  <i
                    className={`${action.icon} text-[2rem] text-[#049ebb] mb-[10px]`}
                  ></i>
                  <span className="text-[0.9rem] font-medium text-center">
                    {action.label}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Emergency Tips */}
          <div className="bg-white rounded-xl p-[30px] shadow-[0_5px_20px_rgba(0,0,0,0.1)]">
            <h4 className="text-center text-[#18444c] font-semibold mb-6">
              When to Seek Emergency Care
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2">
              {[
                "Chest pain or difficulty breathing",
                "Severe allergic reactions",
                "Major trauma or injuries",
                "Signs of stroke or heart attack",
                "Severe burns or bleeding",
                "Loss of consciousness",
                "Severe abdominal pain",
                "High fever with confusion",
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-3 mb-3 py-2">
                  <i className="bi bi-check-circle text-[#28a745] text-[1.1rem] mt-[2px] shrink-0"></i>
                  <span className="text-[#2c3031]">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==================== Home Page ====================
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <DepartmentsSection />
      <ServicesSection />
      <DoctorSection />
      <CTASection />
      <EmergencySection />
    </>
  );
}
