import { Link } from "react-router-dom";
import { PageTitle } from "./components/SharedComponents";
import "./landing.css";

/* ── Data ── */
interface Doctor {
  name: string;
  specialty: string;
  bio: string;
  experience: string;
  img: string;
}

const doctors: Doctor[] = [
  {
    name: "Dr. Jennifer Martinez",
    specialty: "Chief of Cardiology",
    bio: "Mauris blandit aliquet elit eget tincidunt nibh pulvinar a. Curabitur arcu erat accumsan id imperdiet et porttitor at.",
    experience: "15+ Years Experience",
    img: "/images/landing/staff-3.webp",
  },
  {
    name: "Dr. Michael Chen",
    specialty: "Orthopedic Surgeon",
    bio: "Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui. Nulla quis lorem ut libero malesuada feugiat.",
    experience: "12+ Years Experience",
    img: "/images/landing/staff-7.webp",
  },
  {
    name: "Dr. Sarah Williams",
    specialty: "Pediatric Specialist",
    bio: "Donec rutrum congue leo eget malesuada. Sed porttitor lectus nibh. Curabitur non nulla sit amet nisl tempus convallis.",
    experience: "18+ Years Experience",
    img: "/images/landing/staff-11.webp",
  },
  {
    name: "Dr. Robert Anderson",
    specialty: "Neurologist",
    bio: "Proin eget tortor risus. Pellentesque in ipsum id orci porta dapibus. Mauris blandit aliquet elit eget tincidunt.",
    experience: "20+ Years Experience",
    img: "/images/landing/staff-14.webp",
  },
  {
    name: "Dr. Lisa Thompson",
    specialty: "Emergency Medicine",
    bio: "Vivamus magna justo lacinia eget consectetur sed convallis at tellus. Quisque velit nisi pretium ut lacinia in elementum.",
    experience: "14+ Years Experience",
    img: "/images/landing/staff-5.webp",
  },
  {
    name: "Dr. David Rodriguez",
    specialty: "Dermatologist",
    bio: "Cras ultricies ligula sed magna dictum porta. Lorem ipsum dolor sit amet consectetur adipiscing elit pellentesque habitant.",
    experience: "16+ Years Experience",
    img: "/images/landing/staff-9.webp",
  },
  {
    name: "Dr. Amanda Clark",
    specialty: "Oncologist",
    bio: "Sed porttitor lectus nibh. Curabitur aliquet quam id dui posuere blandit proin eget tortor risus pellentesque habitant.",
    experience: "22+ Years Experience",
    img: "/images/landing/staff-2.webp",
  },
  {
    name: "Dr. James Wilson",
    specialty: "General Surgery",
    bio: "Nulla porttitor accumsan tincidunt. Mauris blandit aliquet elit eget tincidunt nibh pulvinar a curabitur arcu erat accumsan.",
    experience: "19+ Years Experience",
    img: "/images/landing/staff-12.webp",
  },
];

/* ── Doctor Card ── */
function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <div className="doc-card">
      {/* Image */}
      <div className="doc-card-image">
        <img src={doctor.img} alt={doctor.name} loading="lazy" />
        <div className="doc-card-overlay">
          <div className="doc-card-social">
            <a href="#" className="doc-social-link">
              <i className="bi bi-linkedin"></i>
            </a>
            <a href="#" className="doc-social-link">
              <i className="bi bi-twitter"></i>
            </a>
            <a href="#" className="doc-social-link">
              <i className="bi bi-envelope"></i>
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="doc-card-content">
        <h4 className="doc-card-name">{doctor.name}</h4>
        <span className="doc-card-specialty">{doctor.specialty}</span>
        <p className="doc-card-bio">{doctor.bio}</p>
        <div className="doc-card-experience">
          <span className="doc-exp-badge">{doctor.experience}</span>
        </div>
        <Link to="/appointment" className="doc-btn-appointment">
          Book Appointment
        </Link>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function DoctorsPage() {
  return (
    <>
      <PageTitle
        title="Doctors"
        description="Meet our team of highly qualified physicians and healthcare specialists dedicated to providing exceptional medical care. With years of clinical experience and a patient-centered approach, our doctors are committed to improving your health and well-being."
        breadcrumbs={[
          { label: "Home", to: "/home" },
          { label: "Category" },
          { label: "Doctors" },
        ]}
      />

      <section className="doc-section">
        <div className="container-landing">
          <div className="doc-grid">
            {doctors.map((d) => (
              <DoctorCard key={d.name} doctor={d} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
