import { useState, useEffect } from "react";
import { PageTitle } from "./components/SharedComponents";
import publicService from "../../services/publicService";
import "./landing.css";

interface FaqItem {
  question: string;
  answer: string;
}

const fallbackFaqs: FaqItem[] = [
  {
    question: "How do I book a medical appointment?",
    answer:
      "You can book an appointment online through our appointment page by selecting your preferred department, doctor, and available time slot. You may also call our clinic directly for assistance with scheduling.",
  },
  {
    question: "What should I bring to my appointment?",
    answer:
      "Please bring a valid ID, your insurance card (if applicable), any previous medical records, and a list of medications you are currently taking. This helps our doctors provide accurate diagnosis and treatment.",
  },
  {
    question: "Can I choose my preferred doctor?",
    answer:
      "Yes. When booking your appointment, you can select your preferred doctor based on department, availability, and specialization.",
  },
  {
    question: "How early should I arrive before my appointment?",
    answer:
      "We recommend arriving at least 10–15 minutes before your scheduled appointment to complete any necessary paperwork and check-in procedures.",
  },
];

const contactOptions = [
  { icon: "bi bi-envelope", label: "Email Support", href: "mailto:support@meditrust.com" },
  { icon: "bi bi-chat-dots", label: "Live Chat", href: "#" },
  { icon: "bi bi-telephone", label: "Call Us", href: "tel:+15551234567" },
];

export default function FAQPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [faqs, setFaqs] = useState<FaqItem[]>(fallbackFaqs);

  useEffect(() => {
    publicService
      .getContents("FAQ", { size: 20 })
      .then((res) => {
        if (res.content && res.content.length > 0) {
          setFaqs(
            res.content.map((c) => ({
              question: c.title,
              answer: c.body || c.summary || "",
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const toggle = (index: number) => {
    setActiveIndex(activeIndex === index ? -1 : index);
  };

  return (
    <>
      <PageTitle
        title="Frequenty Asked Questions"
        description="Find answers to common questions about our medical services, appointments, healthcare procedures, and patient support. Our goal is to make your healthcare experience as smooth and informed as possible."
        breadcrumbs={[
          { label: "Home", to: "/home" },
          { label: "Category", to: "/" },
          { label: "Frequenty Asked Questions" },
        ]}
      />

      <section className="faq-section">
        <div className="container-landing">
          <div className="faq-grid">
            {/* Contact Card */}
            <div className="faq-contact-card">
              <div className="faq-contact-icon">
                <i className="bi bi-question-circle"></i>
              </div>
              <h3 className="faq-contact-title">Still Have Questions?</h3>
              <p className="faq-contact-desc">
                If you need additional assistance or cannot find the answer you are looking for, our support team is always ready to help. Feel free to contact us through any of the options below.
              </p>
              <div className="faq-contact-options">
                {contactOptions.map((opt) => (
                  <a key={opt.label} href={opt.href} className="faq-contact-option">
                    <i className={opt.icon}></i>
                    <span>{opt.label}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* FAQ Accordion */}
            <div className="faq-accordion">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`faq-item ${activeIndex === index ? "active" : ""}`}
                >
                  <div className="faq-header" onClick={() => toggle(index)}>
                    <h3>{faq.question}</h3>
                    <i className="bi bi-chevron-down faq-toggle"></i>
                  </div>
                  <div className={`faq-content ${activeIndex === index ? "faq-content-open" : ""}`}>
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
