import { useState } from "react";
import { Link } from "react-router-dom";
import { PageTitle } from "./components/SharedComponents";
import "./landing.css";

/* ── Types ── */
interface ServiceItem {
  icon: string;
  title: string;
  slug: string;
  description: string;
  benefits: string[];
  featured?: boolean;
}

interface TabData {
  id: string;
  label: string;
  services: ServiceItem[];
}

/* ── Data ── */
const tabsData: TabData[] = [
  {
    id: "primary",
    label: "Primary Care",
    services: [
      {
        icon: "fa fa-stethoscope",
        title: "General Consultation",
        slug: "cardiology",
        description:
          "Cupiditate placeat facere. Delectus quisquam et consequatur laborum sunt consectetur.",
        benefits: [
          "Comprehensive Health Assessment",
          "Preventive Care Planning",
          "Health Monitoring",
        ],
      },
      {
        icon: "fa fa-syringe",
        title: "Vaccination Services",
        slug: "pediatrics",
        description:
          "Voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut.",
        benefits: ["Adult Immunizations", "Travel Vaccines", "Flu Shots"],
      },
      {
        icon: "fa fa-baby",
        title: "Maternal Health",
        slug: "pediatrics",
        description:
          "Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore.",
        benefits: ["Prenatal Care", "Delivery Support", "Postnatal Care"],
      },
      {
        icon: "fa fa-user-md",
        title: "Family Medicine",
        slug: "cardiology",
        description:
          "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus.",
        benefits: [
          "All-Age Care",
          "Chronic Disease Management",
          "Wellness Programs",
        ],
      },
    ],
  },
  {
    id: "specialty",
    label: "Specialty Care",
    services: [
      {
        icon: "fa fa-heartbeat",
        title: "Cardiology",
        slug: "cardiology",
        description:
          "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium.",
        benefits: [
          "Heart Disease Treatment",
          "Cardiac Surgery",
          "Rehabilitation Programs",
        ],
        featured: true,
      },
      {
        icon: "fa fa-brain",
        title: "Neurology",
        slug: "neurology",
        description:
          "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet consectetur.",
        benefits: [
          "Neurological Assessment",
          "Stroke Treatment",
          "Memory Care",
        ],
      },
      {
        icon: "fa fa-bone",
        title: "Orthopedics",
        slug: "orthopedics",
        description:
          "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit.",
        benefits: [
          "Joint Replacement",
          "Sports Medicine",
          "Pain Management",
        ],
      },
      {
        icon: "fa fa-user-nurse",
        title: "Oncology",
        slug: "dermatology",
        description:
          "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis.",
        benefits: ["Cancer Treatment", "Chemotherapy", "Support Services"],
      },
    ],
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    services: [
      {
        icon: "fa fa-vial",
        title: "Laboratory Testing",
        slug: "cardiology",
        description:
          "Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam.",
        benefits: ["Blood Analysis", "Pathology Services", "Quick Results"],
      },
      {
        icon: "fa fa-x-ray",
        title: "Diagnostic Imaging",
        slug: "neurology",
        description:
          "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.",
        benefits: ["MRI Scans", "CT Imaging", "Ultrasound"],
      },
    ],
  },
  {
    id: "emergency",
    label: "Emergency",
    services: [
      {
        icon: "fa fa-ambulance",
        title: "24/7 Emergency Care",
        slug: "cardiology",
        description:
          "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        benefits: [
          "Round-the-Clock Availability",
          "Trauma Center",
          "Critical Care Unit",
          "Emergency Surgery",
        ],
        featured: true,
      },
    ],
  },
];

/* ── Service Card ── */
function ServiceCard({ service }: { service: ServiceItem }) {
  return (
    <div className="svc-item">
      <div className="svc-icon-wrapper">
        <i className={service.icon}></i>
      </div>
      <div className="svc-details">
        <h5 className="svc-title">{service.title}</h5>
        <p className="svc-desc">{service.description}</p>
        <ul className="svc-benefits">
          {service.benefits.map((b) => (
            <li key={b}>
              <i className="fa fa-check-circle"></i>
              {b}
            </li>
          ))}
        </ul>
        <Link to={`/services/${service.slug}`} className="svc-link">
          <span>Learn More</span>
          <i className="fa fa-arrow-right"></i>
        </Link>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState("primary");
  const activeData = tabsData.find((t) => t.id === activeTab)!;

  return (
    <>
      <PageTitle
        title="Services"
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo."
        breadcrumbs={[
          { label: "Home", to: "/home" },
          { label: "Category" },
          { label: "Services" },
        ]}
      />

      <section className="svc-section">
        <div className="container-landing">
          {/* Tabs */}
          <div className="svc-tabs">
            {tabsData.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`svc-tab ${activeTab === tab.id ? "active" : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Service Cards Grid */}
          <div className="svc-grid">
            {activeData.services.map((s) => (
              <ServiceCard key={s.title} service={s} />
            ))}
          </div>

          {/* Emergency Actions */}
          {activeTab === "emergency" && (
            <div className="svc-emergency-actions">
              <a href="tel:911" className="svc-btn-emergency">
                <i className="fa fa-phone"></i>
                <span>Call Emergency</span>
              </a>
              <Link to="/contact" className="svc-btn-directions">
                <i className="fa fa-map-marker-alt"></i>
                <span>Get Directions</span>
              </Link>
            </div>
          )}

          {/* CTA */}
          <div className="svc-cta">
            <div className="svc-cta-content">
              <i className="fa fa-calendar-check svc-cta-icon"></i>
              <h3 className="svc-cta-title">
                Ready to Schedule Your Appointment?
              </h3>
              <p className="svc-cta-desc">
                Duis aute irure dolor in reprehenderit in voluptate velit esse
                cillum dolore eu fugiat nulla pariatur excepteur sint occaecat
                cupidatat non proident.
              </p>
              <div className="svc-cta-buttons">
                <Link to="/appointment" className="svc-btn-book">
                  Book Now
                </Link>
                <Link to="/contact" className="svc-btn-contact">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
