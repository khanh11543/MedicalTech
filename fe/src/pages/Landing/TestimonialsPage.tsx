import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { PageTitle, StarRating } from "./components/SharedComponents";
import "./landing.css";

interface FeaturedTestimonial {
  name: string;
  role: string;
  title: string;
  content: string[];
  img: string;
}

interface Testimonial {
  name: string;
  role: string;
  text: string;
  img: string;
  stars: number;
}

const featuredTestimonials: FeaturedTestimonial[] = [
  {
    name: "Saul Goodman",
    role: "Client",
    title: "Exceptional Care Beyond Expectations",
    content: [
      "The level of care I received at MediTrust was truly outstanding. From the initial consultation to the follow-up appointments, every step was handled with professionalism and genuine concern for my wellbeing.",
      "I am incredibly grateful for the entire medical team who went above and beyond to ensure my recovery was smooth and comfortable.",
    ],
    img: "/images/landing/person-m-7.webp",
  },
  {
    name: "Sara Wilsson",
    role: "Designer",
    title: "Life-Changing Medical Experience",
    content: [
      "The specialists at MediTrust provided me with a treatment plan that changed my life. Their expertise in diagnostics and personalized care approach made all the difference.",
      "The facilities are modern and the staff is incredibly warm and welcoming. I would recommend MediTrust to anyone looking for quality healthcare.",
    ],
    img: "/images/landing/person-f-8.webp",
  },
  {
    name: "Matt Brandon",
    role: "Freelancer",
    title: "World-Class Healthcare Service",
    content: [
      "From emergency care to routine checkups, MediTrust has been my go-to healthcare provider for over five years. Their commitment to patient care is unmatched.",
      "The technology and equipment they use are state-of-the-art, and the doctors always take time to explain everything thoroughly.",
    ],
    img: "/images/landing/person-m-9.webp",
  },
  {
    name: "Jena Karlis",
    role: "Store Owner",
    title: "Compassionate and Professional",
    content: [
      "Every interaction at MediTrust has been positive. The nursing staff is incredibly caring, and the doctors are among the best in their fields.",
      "I particularly appreciate the follow-up care and how they ensure every patient feels valued and heard.",
    ],
    img: "/images/landing/person-f-10.webp",
  },
];

const testimonials: Testimonial[] = [
  { name: "Michael Anderson", role: "Software Developer", text: "The attention to detail in my treatment plan was remarkable. Every concern was addressed promptly and thoroughly.", img: "/images/landing/person-m-3.webp", stars: 5 },
  { name: "Sophia Martinez", role: "Marketing Specialist", text: "I was impressed by the seamless experience from booking to consultation. The online portal makes everything so convenient.", img: "/images/landing/person-f-5.webp", stars: 5 },
  { name: "David Wilson", role: "Graphic Designer", text: "The cardiac rehabilitation program at MediTrust helped me return to an active lifestyle. Truly grateful for the expert guidance.", img: "/images/landing/person-m-7.webp", stars: 5 },
  { name: "Emily Johnson", role: "UX Designer", text: "As a parent, finding a trustworthy pediatric specialist was crucial. MediTrust's children's department exceeded all expectations.", img: "/images/landing/person-f-9.webp", stars: 5 },
  { name: "Olivia Thompson", role: "Entrepreneur", text: "The preventive care programs helped me take control of my health proactively. The team is incredibly supportive and knowledgeable.", img: "/images/landing/person-f-11.webp", stars: 5 },
  { name: "James Taylor", role: "Financial Analyst", text: "After my surgery, the follow-up care was exceptional. The medical staff ensured a smooth and comfortable recovery process.", img: "/images/landing/person-m-12.webp", stars: 5 },
];

export default function TestimonialsPage() {
  return (
    <>
      <PageTitle
        title="Testimonials"
        description="Hear from our patients about their experiences with MediTrust healthcare."
      />

      {/* Featured Testimonials Slider */}
      <section className="py-16 bg-[#f2f8f9]">
        <div className="container mx-auto max-w-7xl px-6">
          <Swiper
            modules={[Navigation, Autoplay]}
            slidesPerView={1}
            loop
            speed={600}
            autoplay={{ delay: 5000 }}
            navigation
            className="testimonials-swiper"
          >
            {featuredTestimonials.map((t) => (
              <SwiperSlide key={t.name}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center py-8 px-4">
                  <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold text-[#18444c] mb-4">{t.title}</h2>
                    {t.content.map((p, i) => (
                      <p key={i} className="text-gray-500 mb-3">{p}</p>
                    ))}
                    <div className="flex items-center gap-4 mt-6">
                      <img src={t.img} alt={t.name} className="w-14 h-14 rounded-full object-cover" />
                      <div>
                        <h3 className="font-bold text-[#18444c]">{t.name}</h3>
                        <span className="text-sm text-gray-400">{t.role}</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <div className="w-full h-80 rounded-2xl overflow-hidden">
                      <img src={t.img} alt={t.name} className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-20">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition">
                <StarRating rating={t.stars} showValue={false} />
                <p className="text-gray-500 my-4">{t.text}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <h5 className="font-bold text-[#18444c] text-sm">{t.name}</h5>
                      <span className="text-xs text-gray-400">{t.role}</span>
                    </div>
                  </div>
                  <i className="bi bi-quote text-3xl text-[#049ebb]/20"></i>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
