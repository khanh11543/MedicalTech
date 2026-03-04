import { useState, type FormEvent } from "react";
import { PageTitle } from "./components/SharedComponents";
import "./landing.css";

interface FormData {
  name: string;
  email: string;
  phone: string;
  department: string;
  date: string;
  doctor: string;
  message: string;
}

const steps = [
  {
    number: 1,
    icon: "bi bi-person-fill",
    title: "Fill Details",
    description:
      "Provide your personal information and select your preferred department",
  },
  {
    number: 2,
    icon: "bi bi-calendar-event",
    title: "Choose Date",
    description:
      "Select your preferred date and time slot from available options",
  },
  {
    number: 3,
    icon: "bi bi-check-circle",
    title: "Confirmation",
    description:
      "Receive instant confirmation and appointment details via email or SMS",
  },
  {
    number: 4,
    icon: "bi bi-heart-pulse",
    title: "Get Treatment",
    description:
      "Visit our clinic at your scheduled time and receive quality healthcare",
  },
];

const infoItems = [
  {
    icon: "bi bi-calendar-check",
    title: "Flexible Scheduling",
    text: "Choose from available time slots that fit your busy schedule",
  },
  {
    icon: "bi bi-stopwatch",
    title: "Quick Response",
    text: "Get confirmation within 15 minutes of submitting your request",
  },
  {
    icon: "bi bi-shield-check",
    title: "Expert Medical Care",
    text: "Board-certified doctors and specialists at your service",
  },
];

export default function AppointmentPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    department: "",
    date: "",
    doctor: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <>
      <PageTitle
        title="Appointment"
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo."
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: "Category" },
          { label: "Appointment" },
        ]}
      />

      <section className="appt-section">
        <div className="container-landing">
          <div className="appt-row">
            {/* Info Panel */}
            <div className="appt-info">
              <h3 className="appt-info-title">
                Quick &amp; Easy Online Booking
              </h3>
              <p className="appt-info-desc">
                Book your appointment in just a few simple steps. Our healthcare
                professionals are ready to provide you with the best medical care
                tailored to your needs.
              </p>

              <div className="appt-info-items">
                {infoItems.map((item) => (
                  <div key={item.title} className="appt-info-item">
                    <div className="appt-info-icon">
                      <i className={item.icon}></i>
                    </div>
                    <div>
                      <h5 className="appt-info-item-title">{item.title}</h5>
                      <p className="appt-info-item-text">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="appt-emergency">
                <h6 className="appt-emergency-title">
                  <i className="bi bi-telephone-fill"></i> Emergency Hotline
                </h6>
                <p className="appt-emergency-text">
                  Call{" "}
                  <a href="tel:+15559114567" className="appt-emergency-phone">
                    +1 (555) 911-4567
                  </a>{" "}
                  for urgent medical assistance
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="appt-form-wrapper">
              {submitted && (
                <div className="appt-alert-success">
                  Your appointment request has been sent successfully. We will
                  contact you shortly!
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="appt-form-grid">
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Full Name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="appt-input"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="appt-input"
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Your Phone Number"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="appt-input"
                  />
                  <select
                    name="department"
                    required
                    value={formData.department}
                    onChange={handleChange}
                    className="appt-input appt-select"
                  >
                    <option value="">Select Department</option>
                    <option value="cardiology">Cardiology</option>
                    <option value="neurology">Neurology</option>
                    <option value="orthopedics">Orthopedics</option>
                    <option value="pediatrics">Pediatrics</option>
                    <option value="dermatology">Dermatology</option>
                    <option value="general">General Medicine</option>
                  </select>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="appt-input"
                  />
                  <select
                    name="doctor"
                    required
                    value={formData.doctor}
                    onChange={handleChange}
                    className="appt-input appt-select"
                  >
                    <option value="">Select Doctor</option>
                    <option value="dr-johnson">Dr. Sarah Johnson</option>
                    <option value="dr-martinez">Dr. Michael Martinez</option>
                    <option value="dr-chen">Dr. Lisa Chen</option>
                    <option value="dr-patel">Dr. Raj Patel</option>
                    <option value="dr-williams">Dr. Emily Williams</option>
                    <option value="dr-thompson">Dr. David Thompson</option>
                  </select>
                </div>

                <textarea
                  name="message"
                  rows={5}
                  placeholder="Please describe your symptoms or reason for visit (optional)"
                  value={formData.message}
                  onChange={handleChange}
                  className="appt-input appt-textarea"
                />

                <button type="submit" className="appt-submit-btn">
                  <i className="bi bi-calendar-plus"></i>
                  Book Appointment
                </button>
              </form>
            </div>
          </div>

          {/* Process Steps */}
          <div className="appt-steps">
            {steps.map((step) => (
              <div key={step.number} className="appt-step-item">
                <div className="appt-step-number">{step.number}</div>
                <div className="appt-step-icon">
                  <i className={step.icon}></i>
                </div>
                <h5 className="appt-step-title">{step.title}</h5>
                <p className="appt-step-desc">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
