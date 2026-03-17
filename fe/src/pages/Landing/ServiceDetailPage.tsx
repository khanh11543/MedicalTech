import { Link, useParams } from "react-router-dom";
import { PageTitle } from "./components/SharedComponents";
import "./landing.css";

interface ServiceFeature {
  text: string;
}

interface SubService {
  icon: string;
  title: string;
  description: string;
  linkText: string;
}

interface ServiceData {
  slug: string;
  title: string;
  tagline: string;
  tag: string;
  image: string;
  description: string[];
  features: ServiceFeature[];
  subServices: SubService[];
  officeHours: string;
  emergencyLine: string;
  location: string;
}

const servicesData: ServiceData[] = [
  {
    slug: "cardiology",
    title: "Comprehensive Cardiology Services",
    tagline:
      "Advanced heart care with cutting-edge technology and compassionate expertise",
    tag: "Specialized Care",
    image:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=400&fit=crop",
    description: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    ],
    features: [
      { text: "Comprehensive cardiac examinations" },
      { text: "Advanced diagnostic imaging" },
      { text: "Preventive heart screening programs" },
      { text: "Cardiac rehabilitation therapy" },
      { text: "Emergency cardiac intervention" },
      { text: "Post-operative care and monitoring" },
    ],
    subServices: [
      {
        icon: "bi-heart-pulse",
        title: "Diagnostic Testing",
        description:
          "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.",
        linkText: "Book Now",
      },
      {
        icon: "bi-hospital",
        title: "Surgical Procedures",
        description:
          "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque.",
        linkText: "Schedule Surgery",
      },
      {
        icon: "bi-shield-check",
        title: "Preventive Care",
        description:
          "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        linkText: "Get Screened",
      },
    ],
    officeHours: "Mon-Fri: 8:00 AM - 6:00 PM",
    emergencyLine: "+1 (555) 123-4567",
    location: "123 Medical Center Dr, Boston, MA 02101",
  },
  {
    slug: "neurology",
    title: "Advanced Neurology Services",
    tagline:
      "Expert neurological care with state-of-the-art diagnostic capabilities",
    tag: "Brain & Spine",
    image:
      "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&h=400&fit=crop",
    description: [
      "Our neurology department provides comprehensive care for conditions affecting the brain, spinal cord, and nervous system. We combine advanced technology with expert clinical judgment.",
      "From diagnosis to treatment and rehabilitation, our team of neurologists is dedicated to improving outcomes for patients with neurological disorders.",
    ],
    features: [
      { text: "Comprehensive neurological assessments" },
      { text: "EEG and EMG diagnostics" },
      { text: "Stroke prevention and treatment" },
      { text: "Movement disorder management" },
      { text: "Headache and migraine treatment" },
      { text: "Neurosurgical consultations" },
    ],
    subServices: [
      {
        icon: "bi-lightning",
        title: "Brain Imaging",
        description:
          "Advanced MRI and CT imaging technology for precise neurological diagnosis and treatment planning.",
        linkText: "Learn More",
      },
      {
        icon: "bi-heart-pulse",
        title: "Neurotherapy",
        description:
          "Comprehensive therapy programs for rehabilitation and recovery from neurological conditions.",
        linkText: "Get Started",
      },
      {
        icon: "bi-person-check",
        title: "Specialist Consultation",
        description:
          "One-on-one consultations with leading neurologists for personalized treatment plans.",
        linkText: "Book Consult",
      },
    ],
    officeHours: "Mon-Fri: 9:00 AM - 5:00 PM",
    emergencyLine: "+1 (555) 234-5678",
    location: "123 Medical Center Dr, Boston, MA 02101",
  },
  {
    slug: "orthopedics",
    title: "Orthopedic Surgery & Care",
    tagline:
      "Restoring mobility and quality of life through expert musculoskeletal care",
    tag: "Bone & Joint",
    image:
      "https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?w=600&h=400&fit=crop",
    description: [
      "Our orthopedic department specializes in the diagnosis, treatment, and prevention of disorders of the bones, joints, ligaments, tendons, and muscles.",
      "Whether you need joint replacement, sports medicine, or fracture care, our orthopedic surgeons deliver exceptional results.",
    ],
    features: [
      { text: "Joint replacement surgery" },
      { text: "Sports medicine and injury rehabilitation" },
      { text: "Minimally invasive spine surgery" },
      { text: "Fracture treatment and bone healing" },
      { text: "Arthroscopic procedures" },
      { text: "Physical therapy and recovery programs" },
    ],
    subServices: [
      {
        icon: "bi-bandaid",
        title: "Joint Replacement",
        description:
          "Advanced hip, knee, and shoulder replacement surgeries using the latest prosthetic technology.",
        linkText: "Learn More",
      },
      {
        icon: "bi-trophy",
        title: "Sports Medicine",
        description:
          "Specialized treatment for athletic injuries with fast-track rehabilitation programs.",
        linkText: "Get Treated",
      },
      {
        icon: "bi-arrow-repeat",
        title: "Rehabilitation",
        description:
          "Comprehensive physical therapy and recovery programs tailored to your needs.",
        linkText: "Start Recovery",
      },
    ],
    officeHours: "Mon-Fri: 8:00 AM - 5:30 PM",
    emergencyLine: "+1 (555) 345-6789",
    location: "123 Medical Center Dr, Boston, MA 02101",
  },
  {
    slug: "dermatology",
    title: "Dermatology & Skin Care",
    tagline:
      "Comprehensive skin health solutions from diagnosis to treatment",
    tag: "Skin Health",
    image:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&h=400&fit=crop",
    description: [
      "Our dermatology department offers a full range of medical, surgical, and cosmetic skin care services for patients of all ages.",
      "Using the latest techniques and technologies, we provide effective treatments for conditions ranging from acne to skin cancer.",
    ],
    features: [
      { text: "Medical dermatology consultations" },
      { text: "Skin cancer screening and treatment" },
      { text: "Cosmetic dermatology procedures" },
      { text: "Laser therapy and treatments" },
      { text: "Pediatric dermatology" },
      { text: "Allergy and patch testing" },
    ],
    subServices: [
      {
        icon: "bi-sun",
        title: "Skin Screening",
        description:
          "Comprehensive skin examinations for early detection of melanoma and other skin conditions.",
        linkText: "Book Screening",
      },
      {
        icon: "bi-stars",
        title: "Cosmetic Treatments",
        description:
          "Professional cosmetic procedures including laser therapy, chemical peels, and injectable treatments.",
        linkText: "Explore Options",
      },
      {
        icon: "bi-droplet",
        title: "Acne Treatment",
        description:
          "Personalized acne treatment plans using the latest dermatological approaches.",
        linkText: "Get Help",
      },
    ],
    officeHours: "Mon-Fri: 9:00 AM - 5:00 PM",
    emergencyLine: "+1 (555) 456-7890",
    location: "123 Medical Center Dr, Boston, MA 02101",
  },
  {
    slug: "pediatrics",
    title: "Pediatric Care Services",
    tagline: "Gentle, expert healthcare for your little ones",
    tag: "Child Health",
    image:
      "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=600&h=400&fit=crop",
    description: [
      "Our pediatric department provides comprehensive healthcare for infants, children, and adolescents in a child-friendly environment.",
      "From routine check-ups to specialized treatments, our pediatricians ensure the best care for your child's health and development.",
    ],
    features: [
      { text: "Well-child visits and immunizations" },
      { text: "Developmental assessments" },
      { text: "Pediatric emergency care" },
      { text: "Childhood illness management" },
      { text: "Nutritional counseling" },
      { text: "Behavioral health support" },
    ],
    subServices: [
      {
        icon: "bi-calendar-check",
        title: "Well-Child Visits",
        description:
          "Regular health screenings and developmental milestones tracking for your child.",
        linkText: "Schedule Visit",
      },
      {
        icon: "bi-capsule",
        title: "Vaccinations",
        description:
          "Complete immunization programs following recommended schedules for optimal protection.",
        linkText: "View Schedule",
      },
      {
        icon: "bi-emoji-smile",
        title: "Child Wellness",
        description:
          "Holistic wellness programs covering nutrition, development, and mental health.",
        linkText: "Learn More",
      },
    ],
    officeHours: "Mon-Sat: 8:00 AM - 7:00 PM",
    emergencyLine: "+1 (555) 567-8901",
    location: "123 Medical Center Dr, Boston, MA 02101",
  },
];

export default function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const service = servicesData.find((s) => s.slug === slug) || servicesData[0];

  return (
    <>
      <PageTitle
        title="Service Details"
        description="Learn more about our specialized medical services designed to provide accurate diagnosis, effective treatment, and comprehensive patient care using advanced medical technology."
        breadcrumbs={[
          { label: "Home", to: "/home" },
          { label: "Category" },
          { label: "Service Details" },
        ]}
      />

      <section className="sd-section">
        <div className="container-landing">
          {/* Hero: Image + Content */}
          <div className="sd-hero">
            <div className="sd-hero-image">
              <img src={service.image} alt={service.title} />
              <div className="sd-hero-tag">
                <span>{service.tag}</span>
              </div>
            </div>

            <div className="sd-hero-content">
              <h2 className="sd-hero-title">{service.title}</h2>
              <p className="sd-hero-tagline">{service.tagline}</p>

              {service.description.map((text, i) => (
                <p key={i} className="sd-hero-desc">
                  {text}
                </p>
              ))}

              <div className="sd-features">
                <h4>Our Services Include:</h4>
                <ul>
                  {service.features.map((f, i) => (
                    <li key={i}>
                      <i className="bi bi-check-circle"></i>
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="sd-actions">
                <Link to="/appointment" className="sd-btn-primary">
                  Schedule Consultation
                </Link>
                <Link to={`/services`} className="sd-btn-secondary">
                  Learn More
                </Link>
              </div>
            </div>
          </div>

          {/* Sub-Service Cards */}
          <div className="sd-cards">
            {service.subServices.map((sub, i) => (
              <div key={i} className="sd-card">
                <div className="sd-card-icon">
                  <i className={`bi ${sub.icon}`}></i>
                </div>
                <h4>{sub.title}</h4>
                <p>{sub.description}</p>
                <Link to="/appointment" className="sd-card-link">
                  <span>{sub.linkText}</span>
                  <i className="bi bi-arrow-right"></i>
                </Link>
              </div>
            ))}
          </div>

          {/* Booking Section */}
          <div className="sd-booking">
            <div className="sd-booking-info">
              <h3>Ready to Schedule Your Appointment?</h3>
              <p>
                Our cardiology specialists are available for consultations Monday
                through Friday. Same-day appointments available for urgent cases.
              </p>

              <div className="sd-availability">
                <div className="sd-info-item">
                  <i className="bi bi-clock"></i>
                  <div>
                    <strong>Office Hours</strong>
                    <span>{service.officeHours}</span>
                  </div>
                </div>
                <div className="sd-info-item">
                  <i className="bi bi-telephone"></i>
                  <div>
                    <strong>Emergency Line</strong>
                    <span>{service.emergencyLine}</span>
                  </div>
                </div>
                <div className="sd-info-item">
                  <i className="bi bi-geo-alt"></i>
                  <div>
                    <strong>Location</strong>
                    <span>{service.location}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="sd-appointment-card">
              <h4>Book Your Visit</h4>
              <p>Quick and easy online scheduling</p>
              <Link to="/appointment" className="sd-btn-appointment">
                Book Appointment
              </Link>
              <div className="sd-contact-alt">
                <span>Or call us at</span>
                <a href={`tel:${service.emergencyLine.replace(/[^+\d]/g, "")}`}>
                  {service.emergencyLine}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
