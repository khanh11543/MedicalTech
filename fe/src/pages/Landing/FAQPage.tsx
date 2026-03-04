import { useState } from "react";
import { PageTitle } from "./components/SharedComponents";
import "./landing.css";

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: "Vivamus suscipit tortor eget felis porttitor volutpat?",
    answer:
      "Nulla quis lorem ut libero malesuada feugiat. Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui. Curabitur aliquet quam id dui posuere blandit. Nulla porttitor accumsan tincidunt.",
  },
  {
    question: "Curabitur aliquet quam id dui posuere blandit?",
    answer:
      "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula. Proin eget tortor risus. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar.",
  },
  {
    question: "Sed porttitor lectus nibh ullamcorper sit amet?",
    answer:
      "Curabitur non nulla sit amet nisl tempus convallis quis ac lectus. Praesent sapien massa, convallis a pellentesque nec, egestas non nisi. Donec sollicitudin molestie malesuada. Vestibulum ac diam sit amet quam vehicula elementum.",
  },
  {
    question: "Nulla quis lorem ut libero malesuada feugiat?",
    answer:
      "Donec sollicitudin molestie malesuada. Quisque velit nisi, pretium ut lacinia in, elementum id enim. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel.",
  },
];

const contactOptions = [
  { icon: "bi bi-envelope", label: "Email Support", href: "mailto:support@meditrust.com" },
  { icon: "bi bi-chat-dots", label: "Live Chat", href: "#" },
  { icon: "bi bi-telephone", label: "Call Us", href: "tel:+15551234567" },
];

export default function FAQPage() {
  const [activeIndex, setActiveIndex] = useState(0);

  const toggle = (index: number) => {
    setActiveIndex(activeIndex === index ? -1 : index);
  };

  return (
    <>
      <PageTitle
        title="Frequenty Asked Questions"
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo."
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
                Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia
                Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula.
                Vestibulum ac diam sit amet quam vehicula elementum.
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
