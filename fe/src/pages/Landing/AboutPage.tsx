import { Link } from "react-router-dom";
import { PageTitle } from "./components/SharedComponents";
import "./landing.css";

export default function AboutPage() {
  return (
    <>
      <PageTitle
        title="About"
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo."
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
              <p className="text-[15px] text-[#444] leading-[1.8] mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
                nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <p className="text-[15px] text-[#444] leading-[1.8] mb-6">
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
                officia deserunt mollit anim id est laborum sed ut perspiciatis.
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

          {/* Certifications Section */}
          <div className="certifications-section mt-16 pt-10 border-t border-[rgba(0,0,0,0.08)]">
            <div className="text-center mb-8">
              <h3 className="text-[22px] font-bold text-[#18444c] mb-2">
                Accreditations &amp; Certifications
              </h3>
              <p className="text-[15px] text-[#6b7280]">
                We are proud to be accredited by leading healthcare organizations
              </p>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="certification-item flex items-center justify-center py-4 px-6 transition-all hover:opacity-80"
                >
                  <img
                    src={`/images/landing/clients-${i > 4 ? i - 4 : i}.webp`}
                    alt="Certification"
                    className="h-[40px] object-contain grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
