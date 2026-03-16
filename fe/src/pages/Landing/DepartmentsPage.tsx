import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PageTitle } from "./components/SharedComponents";
import publicService, { type Specialty } from "../../services/publicService";
import "./landing.css";

/* ── Helper: parse highlights JSON from API ── */
function parseHighlights(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

/* ── Types ── */
interface Department {
  id: number;
  slug: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  img: string;
  featured?: boolean;
}

/* ── Department Card ── */
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

      {/* Image */}
      <div className="dept-card-img-wrapper">
        <img src={dept.img} alt={dept.title} loading="lazy" />
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
        <Link to={`/departments/${dept.slug}`} className="dept-card-link">
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

      {/* Image */}
      <div className="dept-featured-img">
        <img src={dept.img} alt={dept.title} loading="lazy" />
      </div>

      {/* Content */}
      <div className="dept-featured-body">
        <p className="dept-featured-desc">{dept.description}</p>

        {dept.highlights.length > 0 && (
          <div className="dept-featured-tags">
            {dept.highlights.map((s) => (
              <span key={s} className="dept-featured-tag">
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="dept-featured-btn-wrapper">
          <Link to={`/departments/${dept.slug}`} className="dept-featured-btn">
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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicService.getSpecialties().then((list) => {
      const mapped: Department[] = list.map((s: Specialty, idx: number) => ({
        id: s.id,
        slug: s.slug || s.name.toLowerCase().replace(/\s+/g, "-"),
        icon: s.iconUrl || "bi bi-hospital",
        title: s.name,
        subtitle: s.subtitle || s.name,
        description: s.description || "Specialized medical care with experienced professionals.",
        highlights: parseHighlights(s.highlights),
        img: s.imageUrl || "/images/landing/cardiology-3.webp",
        featured: idx === 0,
      }));
      setDepartments(mapped);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <PageTitle
          title="Departments"
          description="Our medical departments provide specialized healthcare services."
          breadcrumbs={[{ label: "Home", to: "/home" }, { label: "Departments" }]}
        />
        <section className="dept-section">
          <div className="container-landing text-center py-20">
            <i className="bi bi-arrow-repeat text-4xl text-[#049ebb] animate-spin"></i>
            <p className="mt-4 text-gray-500">Loading...</p>
          </div>
        </section>
      </>
    );
  }

  if (departments.length === 0) {
    return (
      <>
        <PageTitle
          title="Departments"
          description="Our medical departments provide specialized healthcare services."
          breadcrumbs={[{ label: "Home", to: "/home" }, { label: "Departments" }]}
        />
        <section className="dept-section">
          <div className="container-landing text-center py-20">
            <p className="text-gray-500">No department data available.</p>
          </div>
        </section>
      </>
    );
  }

  // First item = featured (giữa), rest chia 2 cột
  const featured = departments[0];
  const rest = departments.slice(1);
  const col1 = rest.filter((_, i) => i % 2 === 0);
  const col2 = rest.filter((_, i) => i % 2 === 1);

  return (
    <>
      <PageTitle
        title="Departments"
        description="Our medical departments provide specialized healthcare services delivered by experienced physicians and supported by advanced medical technology."
        breadcrumbs={[
          { label: "Home", to: "/home" },
          { label: "Category", to: "/home" },
          { label: "Departments" },
        ]}
      />

      <section className="dept-section">
        <div className="container-landing">
          <div className="dept-grid">
            <div className="dept-col">
              {col1.map((d) => (
                <DepartmentCard key={d.id} dept={d} />
              ))}
            </div>
            <div className="dept-col">
              <FeaturedDepartmentCard dept={featured} />
            </div>
            <div className="dept-col">
              {col2.map((d) => (
                <DepartmentCard key={d.id} dept={d} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
