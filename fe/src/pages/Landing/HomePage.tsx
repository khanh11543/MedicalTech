import { Link } from "react-router-dom";
import { StarRating } from "./components/SharedComponents";
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
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit
              tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.
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
                    +1 (555) 987-6543
                  </strong>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <i className="bi bi-clock-fill text-[2rem] text-[#049ebb]"></i>
                <div className="flex flex-col">
                  <span className="text-white/80 text-[0.9rem]">Working Hours</span>
                  <strong className="text-[1.1rem] font-semibold text-white">
                    Mon-Fri: 8AM-8PM
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Features Row — glass panel */}
          <div className="bg-white/80 backdrop-blur-sm rounded-[15px] shadow-[0_10px_30px_rgba(0,0,0,0.1)] p-8 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: "bi bi-heart-pulse-fill",
                  title: "Cardiology",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                },
                {
                  icon: "bi bi-lungs-fill",
                  title: "Pulmonology",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                },
                {
                  icon: "bi bi-capsule",
                  title: "Diagnostics",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
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
            <p className="text-[18px] font-medium text-[rgba(24,68,76,0.8)] mb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit
              tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.
            </p>
            <p className="text-[#2c3031] mb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin
              consequat magna eu accumsan mattis. Duis non augue in tortor
              facilisis tincidunt ac sit amet sapien. Suspendisse id risus non
              nisi sodales condimentum.
            </p>

            {/* Feature Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {[
                {
                  icon: "bi bi-heart-pulse",
                  title: "Compassionate Care",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                },
                {
                  icon: "bi bi-star",
                  title: "Medical Excellence",
                  desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
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

        {/* Certifications */}
        <div className="mt-10 pt-8 border-t border-[rgba(44,48,49,0.1)]">
          <h4 className="text-center text-[20px] font-bold text-[#18444c] mb-5">
            Our Accreditations
          </h4>
          <div className="flex flex-wrap justify-center items-center gap-[30px]">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex-[0_0_150px] text-center transition-transform hover:-translate-y-[5px] group"
              >
                <img
                  src={`/images/landing/clients-${i}.webp`}
                  alt="Certification"
                  className="max-w-full h-auto grayscale opacity-70 transition-all group-hover:grayscale-0 group-hover:opacity-100"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ==================== Featured Departments ====================
function DepartmentsSection() {
  const departments = [
    {
      icon: "fas fa-heartbeat",
      title: "Cardiology",
      desc: "Comprehensive cardiovascular care with advanced diagnostic techniques and treatment options for heart conditions, ensuring optimal cardiac health for all patients.",
      img: "/images/landing/cardiology-3.webp",
    },
    {
      icon: "fas fa-brain",
      title: "Neurology",
      desc: "Expert neurological care specializing in brain and nervous system disorders, providing cutting-edge treatments and compassionate support for neurological conditions.",
      img: "/images/landing/neurology-2.webp",
    },
    {
      icon: "fas fa-bone",
      title: "Orthopedics",
      desc: "Advanced musculoskeletal care focusing on bones, joints, and muscles with innovative surgical and non-surgical treatment approaches for mobility restoration.",
      img: "/images/landing/orthopedics-4.webp",
    },
    {
      icon: "fas fa-baby",
      title: "Pediatrics",
      desc: "Specialized healthcare for children from infancy through adolescence, offering comprehensive medical care in a child-friendly environment with experienced pediatric specialists.",
      img: "/images/landing/pediatrics-3.webp",
    },
    {
      icon: "fas fa-shield-alt",
      title: "Oncology",
      desc: "Comprehensive cancer care with multidisciplinary approach, offering advanced treatment options, clinical trials, and compassionate support throughout the cancer journey.",
      img: "/images/landing/oncology-4.webp",
    },
    {
      icon: "fas fa-ambulance",
      title: "Emergency Care",
      desc: "Round-the-clock emergency medical services with rapid response capabilities, state-of-the-art equipment, and experienced emergency physicians for critical care.",
      img: "/images/landing/emergency-2.webp",
    },
  ];

  return (
    <section className="py-[60px] bg-white">
      <div className="container-landing">
        <HomeSectionTitle
          title="Featured Departments"
          description="Necessitatibus eius consequatur ex aliquid fuga eum quidem sint consectetur velit"
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
                <Link
                  to="/departments"
                  className="inline-flex items-center gap-2 text-[#049ebb] font-semibold text-[14px] no-underline transition-all group/link"
                >
                  <span className="transition-transform group-hover/link:translate-x-[3px]">
                    Learn More
                  </span>
                  <i className="fas fa-arrow-right text-[16px] transition-transform group-hover/link:translate-x-[3px]"></i>
                </Link>
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
          description="Necessitatibus eius consequatur ex aliquid fuga eum quidem sint consectetur velit"
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
  const doctors = [
    {
      name: "Dr. Sarah Mitchell",
      specialty: "Cardiology",
      exp: "15+ years",
      rating: 4.9,
      img: "/images/landing/staff-3.webp",
      status: "online" as const,
    },
    {
      name: "Dr. Michael Rodriguez",
      specialty: "Neurology",
      exp: "12+ years",
      rating: 4.7,
      img: "/images/landing/staff-7.webp",
      status: "busy" as const,
    },
    {
      name: "Dr. Emily Chen",
      specialty: "Pediatrics",
      exp: "8+ years",
      rating: 5.0,
      img: "/images/landing/staff-1.webp",
      status: "online" as const,
    },
    {
      name: "Dr. James Thompson",
      specialty: "Orthopedics",
      exp: "20+ years",
      rating: 4.8,
      img: "/images/landing/staff-9.webp",
      status: "offline" as const,
    },
    {
      name: "Dr. Lisa Anderson",
      specialty: "Dermatology",
      exp: "10+ years",
      rating: 4.6,
      img: "/images/landing/staff-5.webp",
      status: "online" as const,
    },
    {
      name: "Dr. Robert Kim",
      specialty: "Oncology",
      exp: "18+ years",
      rating: 4.9,
      img: "/images/landing/staff-12.webp",
      status: "online" as const,
    },
  ];

  const statusConfig = {
    online: { label: "Available", bg: "rgba(40,167,69,0.9)", color: "white" },
    busy: { label: "In Surgery", bg: "rgba(255,193,7,0.9)", color: "white" },
    offline: {
      label: "Next: Tomorrow 9AM",
      bg: "rgba(44,48,49,0.8)",
      color: "white",
    },
  };

  return (
    <section className="py-[60px] bg-white">
      <div className="container-landing">
        <HomeSectionTitle
          title="Find A Doctor"
          description="Necessitatibus eius consequatur ex aliquid fuga eum quidem sint consectetur velit"
        />

        {/* Search */}
        <div className="bg-white rounded-[15px] p-8 shadow-[0_10px_30px_rgba(44,48,49,0.1)] mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Doctor name or keyword"
              className="w-full py-3 px-4 border-2 border-[rgba(44,48,49,0.15)] rounded-[10px] text-[0.95rem] outline-none transition-all focus:border-[#049ebb] focus:shadow-[0_0_0_0.2rem_rgba(4,158,187,0.15)]"
            />
            <select className="w-full py-3 px-4 border-2 border-[rgba(44,48,49,0.15)] rounded-[10px] text-[0.95rem] text-gray-500 outline-none transition-all focus:border-[#049ebb] focus:shadow-[0_0_0_0.2rem_rgba(4,158,187,0.15)]">
              <option value="">Select Specialty</option>
              <option>Cardiology</option>
              <option>Neurology</option>
              <option>Orthopedics</option>
              <option>Pediatrics</option>
              <option>Dermatology</option>
              <option>Oncology</option>
            </select>
            <button className="w-full py-3 px-6 rounded-[10px] font-semibold bg-[#049ebb] text-white border-none cursor-pointer transition-all hover:bg-[#037a94] hover:-translate-y-[2px] flex items-center justify-center gap-2">
              <i className="bi bi-search"></i>
              Search Doctor
            </button>
          </div>
        </div>

        {/* Doctor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc.name}
              className="bg-white rounded-[15px] overflow-hidden shadow-[0_5px_25px_rgba(44,48,49,0.08)] transition-all hover:-translate-y-[5px] hover:shadow-[0_15px_40px_rgba(44,48,49,0.15)]"
            >
              {/* Image */}
              <div className="relative overflow-hidden">
                <img
                  src={doc.img}
                  alt={doc.name}
                  className="w-full h-[250px] object-cover transition-transform duration-300 hover:scale-105"
                />
                <div
                  className="absolute top-[15px] right-[15px] py-1 px-3 rounded-[20px] text-[0.75rem] font-semibold uppercase tracking-[0.5px]"
                  style={{
                    background: statusConfig[doc.status].bg,
                    color: statusConfig[doc.status].color,
                  }}
                >
                  {statusConfig[doc.status].label}
                </div>
              </div>
              {/* Info */}
              <div className="p-6">
                <h5 className="text-[1.25rem] font-semibold text-[#18444c] mb-2">
                  {doc.name}
                </h5>
                <p className="text-[#049ebb] font-medium mb-1">{doc.specialty}</p>
                <p className="text-[0.9rem] text-[rgba(44,48,49,0.7)] mb-3">
                  {doc.exp} experience
                </p>
                <div className="flex items-center mb-4">
                  <StarRating rating={doc.rating} />
                </div>
                <div className="flex gap-2">
                  <Link
                    to="/doctors"
                    className="flex-1 py-2 px-4 text-center text-[0.875rem] font-medium rounded-lg border-2 border-[#049ebb] text-[#049ebb] no-underline transition-all hover:bg-[#049ebb] hover:text-white"
                  >
                    View Profile
                  </Link>
                  <Link
                    to="/appointment"
                    className="flex-1 py-2 px-4 text-center text-[0.875rem] font-medium rounded-lg border-2 border-[#049ebb] bg-[#049ebb] text-white no-underline transition-all hover:bg-[#037a94] hover:border-[#037a94]"
                  >
                    Book Appointment
                  </Link>
                </div>
              </div>
            </div>
          ))}
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
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris.
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
              desc: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.",
              link: "Learn More",
            },
            {
              icon: "bi bi-calendar-check",
              title: "Easy Online Booking",
              desc: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
              link: "Book Now",
            },
            {
              icon: "bi bi-people",
              title: "Expert Medical Team",
              desc: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim.",
              link: "Meet Our Doctors",
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
              <a
                href="#"
                className="inline-flex items-center text-[#049ebb] font-semibold no-underline transition-all group/link"
              >
                <span className="mr-2">{card.link}</span>
                <i className="bi bi-arrow-right transition-transform group-hover/link:translate-x-[5px]"></i>
              </a>
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
              href="tel:5551234567"
              className="inline-flex items-center bg-white text-[#049ebb] py-[15px] px-[25px] rounded-full font-bold text-[1.1rem] no-underline transition-all hover:-translate-y-[2px] hover:shadow-[0_8px_25px_rgba(0,0,0,0.2)] whitespace-nowrap"
            >
              <i className="bi bi-telephone-fill mr-[10px] text-[1.2rem]"></i>
              Call (555) 123-4567
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
          description="Necessitatibus eius consequatur ex aliquid fuga eum quidem sint consectetur velit"
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
                title: "Emergency Room",
                phone: "+1 (555) 123-4567",
                address: "1245 Healthcare Blvd, Medical City, CA 90210",
                hours: "Open 24/7",
                urgent: true,
              },
              {
                icon: "bi bi-clock",
                title: "Urgent Care",
                phone: "+1 (555) 987-6543",
                address: "892 Wellness Ave, Health District, CA 90211",
                hours: "Mon-Sun: 7:00 AM - 10:00 PM",
              },
              {
                icon: "bi bi-headset",
                title: "Nurse Helpline",
                phone: "+1 (555) 456-7890",
                address: "24/7 medical advice and guidance",
                hours: "Available 24/7",
              },
              {
                icon: "bi bi-heart-pulse",
                title: "Poison Control",
                phone: "1-800-222-1222",
                address: "National poison control hotline",
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
