import { useState, type FormEvent } from "react";
import { PageTitle } from "./components/SharedComponents";
import "./landing.css";

const contactInfo = [
  {
    icon: "bi bi-geo-alt",
    title: "Our Location",
    text: "4952 Hilltop Dr, Anytown, CA 90210",
  },
  {
    icon: "bi bi-envelope",
    title: "Email Us",
    text: "info@meditrust.com",
  },
  {
    icon: "bi bi-telephone",
    title: "Call Us",
    text: "+1 (555) 123-4567",
  },
  {
    icon: "bi bi-clock",
    title: "Working Hours",
    text: "Monday - Saturday: 9AM - 7PM",
  },
];

const socials = [
  { icon: "bi bi-facebook", href: "#" },
  { icon: "bi bi-twitter-x", href: "#" },
  { icon: "bi bi-instagram", href: "#" },
  { icon: "bi bi-linkedin", href: "#" },
  { icon: "bi bi-youtube", href: "#" },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sent, setSent] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <>
      <PageTitle
        title="Contact Us"
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo."
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
                    <a key={s.icon} href={s.href} className="ct-social-link">
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
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d48389.78314118045!2d-74.006138!3d40.710059!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a22a3bda30d%3A0xb89d1fe6bc499443!2sDowntown%20Conference%20Center!5e0!3m2!1sen!2sus!4v1676961268712!5m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location Map"
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

                <form onSubmit={handleSubmit}>
                  <div className="ct-form-group">
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder=" "
                      value={form.name}
                      onChange={handleChange}
                      className="ct-input"
                    />
                    <label className="ct-label">Full Name</label>
                  </div>

                  <div className="ct-form-group">
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder=" "
                      value={form.email}
                      onChange={handleChange}
                      className="ct-input"
                    />
                    <label className="ct-label">Email Address</label>
                  </div>

                  <div className="ct-form-group">
                    <input
                      type="text"
                      name="subject"
                      required
                      placeholder=" "
                      value={form.subject}
                      onChange={handleChange}
                      className="ct-input"
                    />
                    <label className="ct-label">Subject</label>
                  </div>

                  <div className="ct-form-group">
                    <textarea
                      name="message"
                      required
                      placeholder=" "
                      rows={4}
                      value={form.message}
                      onChange={handleChange}
                      className="ct-input ct-textarea"
                    />
                    <label className="ct-label">Your Message</label>
                  </div>

                  <button type="submit" className="ct-submit-btn">
                    Send Message
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
