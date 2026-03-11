import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PageTitle } from "./components/SharedComponents";
import publicService, { type Specialty } from "../../services/publicService";
import "./landing.css";

/* ── Types ── */
interface ServiceItem {
  id: number;
  slug: string;
  icon: string;
  title: string;
  description: string;
}

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
        <Link to={`/departments/${service.slug}`} className="svc-link">
          <span>Learn More</span>
          <i className="fa fa-arrow-right"></i>
        </Link>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicService.getSpecialties().then((list) => {
      const mapped: ServiceItem[] = list.map((s: Specialty) => ({
        id: s.id,
        slug: s.slug || s.name.toLowerCase().replace(/\s+/g, "-"),
        icon: s.iconUrl || "bi bi-hospital",
        title: s.name,
        description: s.description || "Specialized medical service with experienced professionals.",
      }));
      setServices(mapped);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageTitle
        title="Services"
        description="Our healthcare services are designed to provide comprehensive, patient-centered care using modern medical technology and experienced healthcare professionals."
        breadcrumbs={[
          { label: "Home", to: "/home" },
          { label: "Category" },
          { label: "Services" },
        ]}
      />

      <section className="svc-section">
        <div className="container-landing">
          {loading ? (
            <div className="text-center py-20">
              <i className="bi bi-arrow-repeat text-4xl text-[#049ebb] animate-spin"></i>
              <p className="mt-4 text-gray-500">Loading...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">No service data available.</p>
            </div>
          ) : (
            <>
              {/* Service Cards Grid */}
              <div className="svc-grid">
                {services.map((s) => (
                  <ServiceCard key={s.id} service={s} />
                ))}
              </div>

              {/* CTA */}
              <div className="svc-cta">
                <div className="svc-cta-content">
                  <i className="fa fa-calendar-check svc-cta-icon"></i>
                  <h3 className="svc-cta-title">
                    Ready to Schedule Your Appointment?
                  </h3>
                  <p className="svc-cta-desc">
                    Book an appointment with our experienced medical professionals and receive personalized care tailored to your health needs.
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
            </>
          )}
        </div>
      </section>
    </>
  );
}
