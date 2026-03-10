import { Link } from "react-router-dom";
import { PageTitle } from "./components/SharedComponents";
import "./landing.css";

export default function TermsPage() {
  return (
    <>
      <PageTitle
        title="Terms"
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo."
        breadcrumbs={[
          { label: "Home", to: "/home" },
          { label: "Category" },
          { label: "Terms" },
        ]}
      />

      <section className="tos-section">
        <div className="container-landing">
          {/* Header */}
          <div className="tos-header">
            <span className="tos-last-updated">Last Updated: February 27, 2025</span>
            <h2 className="tos-title">Terms of Service</h2>
            <p className="tos-subtitle">
              Please read these terms of service carefully before using our services
            </p>
          </div>

          {/* Content */}
          <div className="tos-content">
            {/* 1. Agreement to Terms */}
            <div className="tos-content-section">
              <h3>1. Agreement to Terms</h3>
              <p>
                By accessing our website and services, you agree to be bound by these Terms of
                Service and all applicable laws and regulations. If you do not agree with any of
                these terms, you are prohibited from using or accessing our services.
              </p>
              <div className="tos-info-box">
                <i className="bi bi-info-circle"></i>
                <p>
                  These terms apply to all users, visitors, and others who access or use our
                  services.
                </p>
              </div>
            </div>

            {/* 2. Intellectual Property Rights */}
            <div className="tos-content-section">
              <h3>2. Intellectual Property Rights</h3>
              <p>
                Our service and its original content, features, and functionality are owned by us
                and are protected by international copyright, trademark, patent, trade secret, and
                other intellectual property laws.
              </p>
              <ul className="tos-list-items">
                <li>All content is our exclusive property</li>
                <li>You may not copy or modify the content</li>
                <li>Our trademarks may not be used without permission</li>
                <li>Content is for personal, non-commercial use only</li>
              </ul>
            </div>

            {/* 3. User Accounts */}
            <div className="tos-content-section">
              <h3>3. User Accounts</h3>
              <p>
                When you create an account with us, you must provide accurate, complete, and current
                information. Failure to do so constitutes a breach of the Terms, which may result in
                immediate termination of your account.
              </p>
              <div className="tos-alert-box">
                <i className="bi bi-exclamation-triangle"></i>
                <div className="tos-alert-content">
                  <h5>Important Notice</h5>
                  <p>
                    You are responsible for safeguarding the password and for all activities that
                    occur under your account.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Prohibited Activities */}
            <div className="tos-content-section">
              <h3>4. Prohibited Activities</h3>
              <p>
                You may not access or use the Service for any purpose other than that for which we
                make it available.
              </p>
              <div className="tos-prohibited-list">
                <div className="tos-prohibited-item">
                  <i className="bi bi-x-circle"></i>
                  <span>Systematic retrieval of data or content</span>
                </div>
                <div className="tos-prohibited-item">
                  <i className="bi bi-x-circle"></i>
                  <span>Publishing malicious content</span>
                </div>
                <div className="tos-prohibited-item">
                  <i className="bi bi-x-circle"></i>
                  <span>Engaging in unauthorized framing</span>
                </div>
                <div className="tos-prohibited-item">
                  <i className="bi bi-x-circle"></i>
                  <span>Attempting to gain unauthorized access</span>
                </div>
              </div>
            </div>

            {/* 5. Disclaimers */}
            <div className="tos-content-section">
              <h3>5. Disclaimers</h3>
              <p>
                Your use of our service is at your sole risk. The service is provided "AS IS" and
                "AS AVAILABLE" without warranties of any kind, whether express or implied.
              </p>
              <div className="tos-disclaimer-box">
                <p className="tos-disclaimer-label">We do not guarantee that:</p>
                <ul>
                  <li>The service will meet your requirements</li>
                  <li>The service will be uninterrupted or error-free</li>
                  <li>Results from using the service will be accurate</li>
                  <li>Any errors will be corrected</li>
                </ul>
              </div>
            </div>

            {/* 6. Limitation of Liability */}
            <div className="tos-content-section">
              <h3>6. Limitation of Liability</h3>
              <p>
                In no event shall we be liable for any indirect, punitive, incidental, special,
                consequential, or exemplary damages arising out of or in connection with your use of
                the service.
              </p>
            </div>

            {/* 7. Indemnification */}
            <div className="tos-content-section">
              <h3>7. Indemnification</h3>
              <p>
                You agree to defend, indemnify, and hold us harmless from and against any claims,
                liabilities, damages, losses, and expenses arising out of your use of the service.
              </p>
            </div>

            {/* 8. Termination */}
            <div className="tos-content-section">
              <h3>8. Termination</h3>
              <p>
                We may terminate or suspend your account immediately, without prior notice or
                liability, for any reason whatsoever, including without limitation if you breach the
                Terms.
              </p>
            </div>

            {/* 9. Governing Law */}
            <div className="tos-content-section">
              <h3>9. Governing Law</h3>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of [Your
                Country], without regard to its conflict of law provisions.
              </p>
            </div>

            {/* 10. Changes to Terms */}
            <div className="tos-content-section">
              <h3>10. Changes to Terms</h3>
              <p>
                We reserve the right to modify or replace these Terms at any time. We will provide
                notice of any changes by posting the new Terms on this page.
              </p>
              <div className="tos-notice-box">
                <i className="bi bi-bell"></i>
                <p>
                  By continuing to access or use our service after those revisions become effective,
                  you agree to be bound by the revised terms.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="tos-contact">
            <div className="tos-contact-box">
              <div className="tos-contact-icon">
                <i className="bi bi-envelope"></i>
              </div>
              <div className="tos-contact-content">
                <h4>Questions About Terms?</h4>
                <p>If you have any questions about these Terms, please contact us.</p>
                <Link to="/contact" className="tos-contact-link">
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
