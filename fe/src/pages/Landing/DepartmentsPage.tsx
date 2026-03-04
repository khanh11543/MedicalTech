import { Link } from "react-router-dom";
import { PageTitle } from "./components/SharedComponents";
import "./landing.css";

/* ── Data ── */
interface Department {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  img: string;
  statNumber?: string;
  statLabel?: string;
  featured?: boolean;
  services?: string[];
  achievements?: { icon: string; text: string }[];
}

const departments: Department[] = [
  {
    icon: "bi bi-heart-pulse",
    title: "Cardiology",
    subtitle: "Heart & Vascular Care",
    description:
      "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna.",
    highlights: [
      "Advanced Cardiac Surgery",
      "Interventional Cardiology",
      "Heart Rhythm Management",
    ],
    img: "/images/landing/cardiology-2.webp",
    statNumber: "500+",
    statLabel: "Procedures",
  },
  {
    icon: "bi bi-lightning-fill",
    title: "Neurology",
    subtitle: "Brain & Nervous System",
    description:
      "Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum sed ut perspiciatis.",
    highlights: [],
    img: "/images/landing/neurology-4.webp",
    featured: true,
    services: ["Brain Imaging", "Epilepsy Care", "Stroke Treatment", "Memory Disorders"],
    achievements: [
      { icon: "bi bi-award", text: "Award Winning Team" },
      { icon: "bi bi-clock", text: "24/7 Stroke Center" },
    ],
  },
  {
    icon: "bi bi-shield-plus",
    title: "Dermatology",
    subtitle: "Skin Health Experts",
    description:
      "Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure.",
    highlights: [
      "Cosmetic Dermatology",
      "Skin Cancer Treatment",
      "Laser Therapy",
    ],
    img: "/images/landing/dermatology-3.webp",
    statNumber: "1200+",
    statLabel: "Treatments",
  },
  {
    icon: "bi bi-bandaid",
    title: "Orthopedics",
    subtitle: "Bone & Joint Care",
    description:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat.",
    highlights: ["Joint Replacement", "Sports Medicine", "Spine Surgery"],
    img: "/images/landing/orthopedics-4.webp",
    statNumber: "800+",
    statLabel: "Surgeries",
  },
  {
    icon: "bi bi-emoji-smile",
    title: "Pediatrics",
    subtitle: "Children's Health",
    description:
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam rem aperiam eaque.",
    highlights: ["Newborn Care", "Child Development", "Vaccination Programs"],
    img: "/images/landing/pediatrics-2.webp",
    statNumber: "2000+",
    statLabel: "Young Patients",
  },
];

/* ── Regular Department Card ── */
function DepartmentCard({ dept }: { dept: Department }) {
  return (
    <div className="dept-card">
      {/* Header */}
      <div className="dept-card-header">
        <div className="dept-card-icon">
          <i className={dept.icon}></i>
        </div>
        <h3 className="dept-card-title">{dept.title}</h3>
        <p className="dept-card-subtitle">{dept.subtitle}</p>
      </div>

      {/* Image with stat badge */}
      <div className="dept-card-img-wrapper">
        <img src={dept.img} alt={dept.title} loading="lazy" />
        {dept.statNumber && (
          <div className="dept-card-stat">
            <span className="dept-card-stat-number">{dept.statNumber}</span>
            <span className="dept-card-stat-label">{dept.statLabel}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="dept-card-body">
        <p className="dept-card-desc">{dept.description}</p>
        <ul className="dept-card-highlights">
          {dept.highlights.map((h) => (
            <li key={h}>
              <i className="bi bi-check2"></i>
              {h}
            </li>
          ))}
        </ul>
        <Link to={`/departments/${dept.title.toLowerCase()}`} className="dept-card-link">
          Learn More
        </Link>
      </div>
    </div>
  );
}

/* ── Featured Department Card ── */
function FeaturedDepartmentCard({ dept }: { dept: Department }) {
  return (
    <div className="dept-featured">
      {/* Header */}
      <div className="dept-featured-header">
        <div className="dept-featured-badge">
          <i className="bi bi-star-fill"></i>
          <span>Featured</span>
        </div>
        <div className="dept-featured-icon">
          <i className={dept.icon}></i>
        </div>
        <h2 className="dept-featured-title">{dept.title}</h2>
        <p className="dept-featured-subtitle">{dept.subtitle}</p>
      </div>

      {/* Image with overlay achievements */}
      <div className="dept-featured-img">
        <img src={dept.img} alt={dept.title} loading="lazy" />
        {dept.achievements && (
          <div className="dept-featured-overlay">
            {dept.achievements.map((a) => (
              <div key={a.text} className="dept-featured-achievement">
                <i className={a.icon}></i>
                <span>{a.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="dept-featured-body">
        <p className="dept-featured-desc">{dept.description}</p>

        {/* Service tags */}
        {dept.services && (
          <div className="dept-featured-tags">
            {dept.services.map((s) => (
              <span key={s} className="dept-featured-tag">
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="dept-featured-btn-wrapper">
          <Link to={`/departments/${dept.title.toLowerCase()}`} className="dept-featured-btn">
            Explore Department
            <i className="bi bi-arrow-right-circle"></i>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function DepartmentsPage() {
  const col1 = [departments[0], departments[2]]; // Cardiology, Dermatology
  const featured = departments[1]; // Neurology
  const col3 = [departments[3], departments[4]]; // Orthopedics, Pediatrics

  return (
    <>
      <PageTitle
        title="Departments"
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo."
        breadcrumbs={[
          { label: "Home", to: "/home" },
          { label: "Category", to: "/home" },
          { label: "Departments" },
        ]}
      />

      <section className="dept-section">
        <div className="container-landing">
          <div className="dept-grid">
            {/* Column 1 */}
            <div className="dept-col">
              {col1.map((d) => (
                <DepartmentCard key={d.title} dept={d} />
              ))}
            </div>

            {/* Column 2 — Featured */}
            <div className="dept-col">
              <FeaturedDepartmentCard dept={featured} />
            </div>

            {/* Column 3 */}
            <div className="dept-col">
              {col3.map((d) => (
                <DepartmentCard key={d.title} dept={d} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
