import { useState, type FormEvent } from "react";
import { PageTitle } from "./components/SharedComponents";
import publicService from "../../services/publicService";
import "./landing.css";

const contactInfo = [
  {
    icon: "bi bi-geo-alt",
    title: "Our Location",
    text: "11/7 đường 385 Tăng Nhơn Phú A, Thủ Đức, TP.HCM",
  },
  {
    icon: "bi bi-envelope",
    title: "Email Us",
    text: "khanh115432@gmail.com",
  },
  {
    icon: "bi bi-telephone",
    title: "Call Us",
    text: "+84 952123456",
  },
  {
    icon: "bi bi-clock",
    title: "Working Hours",
    text: "Monday - Saturday: 8AM - 5PM",
  },
];

const socials = [
  { icon: "bi bi-facebook", href: "#", label: "Facebook" },
  { icon: "bi bi-twitter-x", href: "#", label: "Twitter" },
  { icon: "bi bi-instagram", href: "#", label: "Instagram" },
  { icon: "bi bi-linkedin", href: "#", label: "LinkedIn" },
  { icon: "bi bi-youtube", href: "#", label: "YouTube" },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const err: Record<string, string> = {};
    if (!form.name?.trim()) err.name = "Please enter your full name.";
    if (!form.email?.trim()) err.email = "Please enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      err.email = "Please enter a valid email address (e.g. name@example.com).";
    }
    if (!form.subject?.trim()) err.subject = "Please enter a subject.";
    if (!form.message?.trim()) err.message = "Please enter your message.";
    if (Object.keys(err).length > 0) {
      setFieldErrors(err);
      setError("Please fill in all required fields correctly.");
      return;
    }

    setSending(true);
    try {
      await publicService.submitContact(form);
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSent(false), 5000);
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageTitle
        title="Contact Us"
        description="If you have any questions about our medical services, need assistance scheduling an appointment, or require support from our healthcare team, please feel free to contact us. We are here to help and ensure you receive the care you need."
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: "Pages" },
          { label: "Contact Us" },
        ]}
      />

      <section className="ct-section">
        <div className="container-landing">
          <div className="ct-wrapper">
            {/* Left - Info Panel */}
            <div className="ct-info-panel">
              <h3 className="ct-info-title">Contact Information</h3>
              <p className="ct-info-desc">
                Reach out to us for any inquiries about our services and
                healthcare solutions.
              </p>

              <div className="ct-info-list">
                {contactInfo.map((item) => (
                  <div key={item.title} className="ct-info-item">
                    <div className="ct-info-icon">
                      <i className={item.icon}></i>
                    </div>
                    <div className="ct-info-text">
                      <h4>{item.title}</h4>
                      <p>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ct-social">
                <h5 className="ct-social-title">Follow Us</h5>
                <div className="ct-social-links">
                  {socials.map((s) => (
                    <a key={s.icon} href={s.href} className="ct-social-link" aria-label={s.label}>
                      <i className={s.icon}></i>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right - Map + Form Panel */}
            <div className="ct-form-panel">
              {/* Map */}
              <div className="ct-map">
                <iframe
                  src="https://www.google.com/maps?q=11%2F7+%C4%91%C6%B0%E1%BB%9Dng+385%2C+T%C4%83ng+Nh%C6%A1n+Ph%C3%BA+A%2C+Th%E1%BB%A7+%C4%90%E1%BB%A9c%2C+TP.HCM&output=embed"
                  width="100%"
                  height="100%"
                  className="ct-map-iframe"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location Map - 11/7 đường 385 Tăng Nhơn Phú A"
                />
              </div>

              {/* Form */}
              <div className="ct-form-body">
                <h3 className="ct-form-title">Send Us a Message</h3>
                <p className="ct-form-desc">
                  We'll get back to you as soon as possible.
                </p>

                {sent && (
                  <div className="ct-alert-success">
                    Your message has been sent successfully. Thank you!
                  </div>
                )}

                {error && (
                  <div className="ct-alert-error">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <div className="ct-form-group">
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      placeholder=" "
                      value={form.name}
                      onChange={handleChange}
                      className={`ct-input ${fieldErrors.name ? "ct-input--error" : ""}`}
                    />
                    <label htmlFor="contact-name" className="ct-label">Full Name</label>
                    {fieldErrors.name && <p className="ct-field-error">{fieldErrors.name}</p>}
                  </div>

                  <div className="ct-form-group">
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      placeholder=" "
                      value={form.email}
                      onChange={handleChange}
                      className={`ct-input ${fieldErrors.email ? "ct-input--error" : ""}`}
                    />
                    <label htmlFor="contact-email" className="ct-label">Email Address</label>
                    {fieldErrors.email && <p className="ct-field-error">{fieldErrors.email}</p>}
                  </div>

                  <div className="ct-form-group">
                    <input
                      id="contact-subject"
                      type="text"
                      name="subject"
                      placeholder=" "
                      value={form.subject}
                      onChange={handleChange}
                      className={`ct-input ${fieldErrors.subject ? "ct-input--error" : ""}`}
                    />
                    <label htmlFor="contact-subject" className="ct-label">Subject</label>
                    {fieldErrors.subject && <p className="ct-field-error">{fieldErrors.subject}</p>}
                  </div>

                  <div className="ct-form-group">
                    <textarea
                      id="contact-message"
                      name="message"
                      placeholder=" "
                      rows={4}
                      value={form.message}
                      onChange={handleChange}
                      className={`ct-input ct-textarea ${fieldErrors.message ? "ct-input--error" : ""}`}
                    />
                    <label htmlFor="contact-message" className="ct-label">Your Message</label>
                    {fieldErrors.message && <p className="ct-field-error">{fieldErrors.message}</p>}
                  </div>

                  <button type="submit" className="ct-submit-btn" disabled={sending}>
                    {sending ? "Sending..." : "Send Message"}
                    <i className="bi bi-send-fill"></i>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
