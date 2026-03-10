import { useParams, Link } from "react-router-dom";
import { PageTitle } from "./components/SharedComponents";
import "./landing.css";

/* ── Department Data ── */
interface ServiceCard {
  icon: string;
  title: string;
  desc: string;
}

interface DepartmentDetail {
  slug: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  img: string;
  yearsExperience: string;
  serviceCards: ServiceCard[];
  stats: { number: string; label: string; icon: string }[];
  specializedServices: string[];
  ctaImg: string;
}

const departmentDetails: DepartmentDetail[] = [
  {
    slug: "cardiology",
    icon: "bi bi-heart-pulse",
    title: "Cardiology Department",
    subtitle: "Heart & Vascular Care",
    description:
      "Our Cardiology Department provides comprehensive cardiac care with state-of-the-art technology and experienced specialists. We are committed to delivering exceptional heart care through advanced diagnostics, innovative treatments, and personalized patient care programs.",
    img: "/images/landing/cardiology-2.webp",
    yearsExperience: "15+",
    serviceCards: [
      {
        icon: "bi bi-heart-pulse",
        title: "Comprehensive Cardiac Care",
        desc: "Complete heart health management including preventive care, diagnosis, and advanced treatment options.",
      },
      {
        icon: "bi bi-activity",
        title: "Advanced Diagnostics",
        desc: "State-of-the-art cardiac imaging and diagnostic tools for accurate and early detection of heart conditions.",
      },
      {
        icon: "bi bi-person-heart",
        title: "Personalized Treatment Plans",
        desc: "Tailored cardiac treatment programs designed to meet each patient's unique health needs and goals.",
      },
    ],
    stats: [
      { number: "2500", label: "Patients Treated", icon: "bi bi-people-fill" },
      { number: "12", label: "Specialized Doctors", icon: "bi bi-person-badge-fill" },
      { number: "98", label: "Success Rate", icon: "bi bi-graph-up-arrow" },
      { number: "24", label: "Hours Service", icon: "bi bi-clock-fill" },
    ],
    specializedServices: [
      "Advanced Cardiac Surgery & Bypass",
      "Interventional Cardiology Procedures",
      "Heart Rhythm Management & Monitoring",
      "Cardiac Rehabilitation Programs",
      "Preventive Cardiology & Screening",
    ],
    ctaImg: "/images/user/user-01.jpg",
  },
  {
    slug: "neurology",
    icon: "bi bi-lightning-fill",
    title: "Neurology Department",
    subtitle: "Brain & Nervous System",
    description:
      "Our Neurology Department provides comprehensive care for disorders of the brain, spinal cord, and peripheral nerves. With cutting-edge diagnostic tools and treatment options, our team delivers exceptional patient outcomes.",
    img: "/images/landing/neurology-4.webp",
    yearsExperience: "12+",
    serviceCards: [
      {
        icon: "bi bi-lightning-fill",
        title: "Neurodiagnostic Services",
        desc: "Advanced brain imaging and diagnostic tools for accurate diagnosis of neurological conditions.",
      },
      {
        icon: "bi bi-activity",
        title: "Stroke Care Center",
        desc: "24/7 dedicated stroke center with rapid response team and advanced treatment protocols.",
      },
      {
        icon: "bi bi-person-heart",
        title: "Rehabilitation Programs",
        desc: "Comprehensive neurorehabilitation programs tailored to each patient's recovery needs.",
      },
    ],
    stats: [
      { number: "1800", label: "Patients Treated", icon: "bi bi-people-fill" },
      { number: "10", label: "Specialized Doctors", icon: "bi bi-person-badge-fill" },
      { number: "97", label: "Success Rate", icon: "bi bi-graph-up-arrow" },
      { number: "24", label: "Hours Service", icon: "bi bi-clock-fill" },
    ],
    specializedServices: [
      "Brain Imaging & Advanced Diagnostics",
      "Epilepsy Monitoring & Treatment",
      "Stroke Treatment & Prevention",
      "Memory Disorders & Cognitive Care",
      "Neurosurgery & Rehabilitation",
    ],
    ctaImg: "/images/user/user-04.jpg",
  },
  {
    slug: "dermatology",
    icon: "bi bi-shield-plus",
    title: "Dermatology Department",
    subtitle: "Skin Health Experts",
    description:
      "Our Dermatology Department offers a full range of services for skin, hair, and nail conditions. From cosmetic procedures to medical dermatology, our specialists provide personalized treatment plans using the latest techniques.",
    img: "/images/landing/dermatology-3.webp",
    yearsExperience: "10+",
    serviceCards: [
      {
        icon: "bi bi-shield-plus",
        title: "Medical Dermatology",
        desc: "Expert diagnosis and treatment of skin conditions including eczema, psoriasis, and skin cancer.",
      },
      {
        icon: "bi bi-stars",
        title: "Cosmetic Procedures",
        desc: "Advanced cosmetic treatments including laser therapy, chemical peels, and anti-aging solutions.",
      },
      {
        icon: "bi bi-person-heart",
        title: "Personalized Skin Care",
        desc: "Customized skin care plans designed for your unique skin type and health goals.",
      },
    ],
    stats: [
      { number: "3200", label: "Patients Treated", icon: "bi bi-people-fill" },
      { number: "8", label: "Specialized Doctors", icon: "bi bi-person-badge-fill" },
      { number: "99", label: "Success Rate", icon: "bi bi-graph-up-arrow" },
      { number: "12", label: "Hours Service", icon: "bi bi-clock-fill" },
    ],
    specializedServices: [
      "Cosmetic Dermatology & Laser Therapy",
      "Skin Cancer Screening & Treatment",
      "Acne & Scar Treatment Programs",
      "Psoriasis & Eczema Management",
      "Hair Restoration & Nail Care",
    ],
    ctaImg: "/images/user/user-02.jpg",
  },
  {
    slug: "orthopedics",
    icon: "bi bi-bandaid",
    title: "Orthopedics Department",
    subtitle: "Bone & Joint Care",
    description:
      "The Orthopedics Department specializes in the diagnosis and treatment of musculoskeletal conditions. Our expert team provides comprehensive care for bone, joint, ligament, tendon, and muscle problems.",
    img: "/images/landing/orthopedics-4.webp",
    yearsExperience: "18+",
    serviceCards: [
      {
        icon: "bi bi-bandaid",
        title: "Joint Replacement",
        desc: "Robotic-assisted joint replacement surgery with minimally invasive techniques for faster recovery.",
      },
      {
        icon: "bi bi-activity",
        title: "Sports Medicine",
        desc: "Comprehensive sports injury treatment and prevention programs for athletes of all levels.",
      },
      {
        icon: "bi bi-person-heart",
        title: "Rehabilitation Services",
        desc: "Advanced physical therapy and rehabilitation programs for complete musculoskeletal recovery.",
      },
    ],
    stats: [
      { number: "2100", label: "Patients Treated", icon: "bi bi-people-fill" },
      { number: "15", label: "Specialized Doctors", icon: "bi bi-person-badge-fill" },
      { number: "96", label: "Success Rate", icon: "bi bi-graph-up-arrow" },
      { number: "24", label: "Hours Service", icon: "bi bi-clock-fill" },
    ],
    specializedServices: [
      "Joint Replacement & Reconstruction",
      "Sports Medicine & Injury Prevention",
      "Minimally Invasive Spine Surgery",
      "Fracture Care & Arthroscopy",
      "Physical Therapy & Rehabilitation",
    ],
    ctaImg: "/images/user/user-05.jpg",
  },
  {
    slug: "pediatrics",
    icon: "bi bi-emoji-smile",
    title: "Pediatrics Department",
    subtitle: "Children's Health",
    description:
      "Our Pediatrics Department provides comprehensive healthcare for infants, children, and adolescents. From routine check-ups to complex medical conditions, our dedicated pediatricians ensure your child receives the best care.",
    img: "/images/landing/pediatrics-2.webp",
    yearsExperience: "20+",
    serviceCards: [
      {
        icon: "bi bi-emoji-smile",
        title: "Newborn & Infant Care",
        desc: "Specialized neonatal care and routine check-ups for newborns and infants in a safe environment.",
      },
      {
        icon: "bi bi-activity",
        title: "Child Development",
        desc: "Comprehensive developmental screening and support services for growing children.",
      },
      {
        icon: "bi bi-shield-check",
        title: "Vaccination Programs",
        desc: "Complete immunization programs following the latest pediatric guidelines and schedules.",
      },
    ],
    stats: [
      { number: "4500", label: "Patients Treated", icon: "bi bi-people-fill" },
      { number: "20", label: "Specialized Doctors", icon: "bi bi-person-badge-fill" },
      { number: "99", label: "Success Rate", icon: "bi bi-graph-up-arrow" },
      { number: "18", label: "Hours Service", icon: "bi bi-clock-fill" },
    ],
    specializedServices: [
      "Newborn Care & Neonatal Services",
      "Child Development & Screening",
      "Vaccination & Immunization Programs",
      "Pediatric Surgery & Emergency",
      "Adolescent Medicine & Counseling",
    ],
    ctaImg: "/images/user/user-03.jpg",
  },
];

/* ── Component ── */
export default function DepartmentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const dept = departmentDetails.find((d) => d.slug === slug);

  if (!dept) {
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

  return (
    <>
      <PageTitle
        title="Department Details"
        description="Discover our specialized medical departments dedicated to providing advanced diagnosis, effective treatment, and compassionate patient care through experienced medical professionals and modern healthcare technology."
        breadcrumbs={[
          { label: "Home", to: "/home" },
          { label: "Category", to: "/departments" },
          { label: "Department Details" },
        ]}
      />

      {/* Department Title Section */}
      <section className="dd-section" style={{ background: '#ffffff' }}>
        <div className="container-landing">
          <div className="dd-title-block">
            <h2 className="dd-dept-name">{dept.title}</h2>
            <div className="dd-divider"></div>
            <p className="dd-dept-lead">{dept.description}</p>
          </div>
        </div>
      </section>

      {/* Overview Section: Image + Service Cards */}
      <section className="dd-section dd-overview-section">
        <div className="container-landing">
          <div className="dd-overview-grid">
            {/* Left: Department Image */}
            <div className="dd-overview-img-wrapper">
              <img src={dept.img} alt={dept.title} className="dd-overview-img" loading="lazy" />
              <div className="dd-experience-badge">
                <span className="dd-exp-number">{dept.yearsExperience}</span>
                <span className="dd-exp-text">Years of Excellence</span>
              </div>
            </div>

            {/* Right: Service Cards */}
            <div className="dd-service-cards">
              {dept.serviceCards.map((sc) => (
                <div key={sc.title} className="dd-service-card">
                  <div className="dd-service-card-icon">
                    <i className={sc.icon}></i>
                  </div>
                  <div className="dd-service-card-body">
                    <h4 className="dd-service-card-title">{sc.title}</h4>
                    <p className="dd-service-card-desc">{sc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="dd-stats-section">
        <div className="container-landing">
          <div className="dd-stats-grid">
            {dept.stats.map((s) => (
              <div key={s.label} className="dd-stat-item">
                <span className="dd-stat-number">{s.number}</span>
                <span className="dd-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialized Services Section */}
      <section className="dd-section dd-services-section">
        <div className="container-landing">
          <div className="dd-services-grid">
            {/* Left: Services List */}
            <div className="dd-services-left">
              <h2 className="dd-services-heading">Our Specialized Services</h2>
              <p className="dd-services-desc">
                We provide a wide range of specialized medical services designed to meet the unique
                needs of every patient. Our team of experts uses the latest technology and
                evidence-based practices.
              </p>
              <ul className="dd-services-checklist">
                {dept.specializedServices.map((svc) => (
                  <li key={svc}>
                    <i className="bi bi-check-circle-fill"></i>
                    <span>{svc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: CTA Card */}
            <div className="dd-cta-card">
              <div className="dd-cta-content">
                <h3 className="dd-cta-title">Expert Care When You Need It Most</h3>
                <p className="dd-cta-desc">
                  Our dedicated team of specialists is available around the clock to provide you
                  with the highest quality medical care. Schedule your appointment today.
                </p>
                <div className="dd-cta-actions">
                  <Link to="/appointment" className="dd-cta-btn-primary">
                    <i className="bi bi-calendar-check"></i>
                    Book Appointment
                  </Link>
                  <Link to={`/departments`} className="dd-cta-btn-outline">
                    Learn More
                    <i className="bi bi-arrow-right"></i>
                  </Link>
                </div>
              </div>
              <div className="dd-cta-img-side">
                <img src={dept.ctaImg} alt="Expert Doctor" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
