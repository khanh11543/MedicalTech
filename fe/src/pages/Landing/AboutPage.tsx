import { Link } from "react-router-dom";
import { PageTitle } from "./components/SharedComponents";
import "./landing.css";

export default function AboutPage() {
  return (
    <>
      <PageTitle
        title="About"
        description="MediTrust Medical Center is committed to delivering high-quality healthcare through advanced medical technology, experienced physicians, and compassionate patient care. Our mission is to improve the health and well-being of every patient we serve."
        breadcrumbs={[
          { label: "Home", to: "/home" },
          { label: "Category", to: "/home" },
          { label: "About" },
        ]}
      />

      {/* About Section */}
      <section className="about-section py-[60px]">
        <div className="container-landing">
          {/* Main Content Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-10 lg:gap-x-12">
            {/* Left - Text Content */}
            <div className="about-content">
              <h2 className="text-[28px] lg:text-[32px] font-bold text-[#18444c] mb-5 leading-tight">
                Committed to Excellence in Healthcare
              </h2>
              <p className="text-[15px] text-[#444] leading-[1.8] mb-6 text-justify">
                At MediTrust Medical Center, we believe that exceptional healthcare begins with trust, expertise, and compassion. Our team of experienced physicians, nurses, and healthcare professionals works together to provide personalized medical care tailored to the needs of every patient.
              </p>
              <p className="text-[15px] text-[#444] leading-[1.8] mb-6 text-justify">
                Using modern medical technology and evidence-based treatment methods, we deliver comprehensive healthcare services ranging from preventive care and diagnostics to specialized treatments and emergency services. Our commitment is to ensure every patient receives safe, effective, and compassionate care.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="about-stat-item text-center py-6 px-4 rounded-xl border border-[rgba(4,158,187,0.15)] bg-[rgba(4,158,187,0.03)]">
                  <div className="text-[2rem] font-bold text-[#049ebb] leading-none mb-1">25+</div>
                  <div className="text-[13px] text-[#6b7280]">Years of Experience</div>
                </div>
                <div className="about-stat-item text-center py-6 px-4 rounded-xl border border-[rgba(4,158,187,0.15)] bg-[rgba(4,158,187,0.03)]">
                  <div className="text-[2rem] font-bold text-[#049ebb] leading-none mb-1">50000+</div>
                  <div className="text-[13px] text-[#6b7280]">Patients Treated</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/doctors"
                  className="btn-mt-primary no-underline"
                >
                  Meet Our Doctors
                </Link>
                <Link
                  to="/services"
                  className="btn-mt-outline no-underline"
                >
                  View Our Services
                </Link>
              </div>
            </div>

            {/* Right - Image Section */}
            <div className="about-image-section">
              {/* Main Image */}
              <div className="mb-4">
                <img
                  src="/images/landing/consultation-3.webp"
                  alt="Healthcare consultation"
                  className="w-full rounded-xl object-cover shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                  style={{ height: "320px" }}
                />
              </div>
              {/* Image Grid */}
              <div className="grid grid-cols-2 gap-4">
                <img
                  src="/images/landing/facilities-2.webp"
                  alt="Medical facility"
                  className="w-full h-[160px] object-cover rounded-xl shadow-[0_5px_15px_rgba(0,0,0,0.08)]"
                />
                <img
                  src="/images/landing/staff-5.webp"
                  alt="Medical staff"
                  className="w-full h-[160px] object-cover rounded-xl shadow-[0_5px_15px_rgba(0,0,0,0.08)]"
                />
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
