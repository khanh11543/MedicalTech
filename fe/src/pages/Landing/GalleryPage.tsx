import { useState } from "react";
import { PageTitle } from "./components/SharedComponents";
import "./landing.css";

interface GalleryItem {
  src: string;
  title: string;
  description: string;
  category: string;
}

const filters = ["All", "Equipment", "Certifications", "Facilities", "Laboratory"];

const galleryItems: GalleryItem[] = [
  // Equipment
  {
    src: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80",
    title: "MRI Scanner",
    description: "Siemens MAGNETOM Vida 3T MRI system for high-resolution imaging and advanced diagnostics.",
    category: "Equipment",
  },
  {
    src: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&q=80",
    title: "CT Scanner Suite",
    description: "128-slice CT scanner providing rapid, detailed cross-sectional imaging for accurate diagnosis.",
    category: "Equipment",
  },
  {
    src: "https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&q=80",
    title: "Digital X-Ray System",
    description: "Philips DigitalDiagnost C90 with flat-panel detector for low-dose, high-quality radiography.",
    category: "Equipment",
  },
  {
    src: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&q=80",
    title: "Ultrasound Station",
    description: "GE Voluson E10 4D ultrasound system for obstetric, cardiac, and abdominal imaging.",
    category: "Equipment",
  },
  {
    src: "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=800&q=80",
    title: "Surgical Operating Theater",
    description: "Fully integrated OR with Stryker 1688 4K camera system and Maquet surgical lighting.",
    category: "Equipment",
  },
  {
    src: "https://images.unsplash.com/photo-1583912267550-d6c2e4f0fa48?w=800&q=80",
    title: "Patient Monitoring System",
    description: "Philips IntelliVue MX800 bedside monitors with real-time vital sign tracking.",
    category: "Equipment",
  },

  // Certifications
  {
    src: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
    title: "JCI Accreditation",
    description: "Joint Commission International accreditation — recognized globally for patient safety and quality of care standards.",
    category: "Certifications",
  },
  {
    src: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
    title: "ISO 9001:2015 Certification",
    description: "Quality Management System certification ensuring consistent delivery of healthcare services.",
    category: "Certifications",
  },
  {
    src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
    title: "ISO 15189 Laboratory Accreditation",
    description: "International standard for medical laboratory competence, ensuring accurate and reliable test results.",
    category: "Certifications",
  },
  {
    src: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80",
    title: "Healthcare Excellence Award 2025",
    description: "Recognized for outstanding performance in patient outcomes and clinical innovation.",
    category: "Certifications",
  },
  {
    src: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80",
    title: "WHO Patient Safety Partnership",
    description: "Official partner in the WHO Global Patient Safety Action Plan 2021–2030 initiative.",
    category: "Certifications",
  },

  // Facilities
  {
    src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80",
    title: "Main Hospital Building",
    description: "Modern 12-story facility with 350 beds, designed for optimal patient care and comfort.",
    category: "Facilities",
  },
  {
    src: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80",
    title: "Reception & Lobby",
    description: "Spacious and welcoming reception area with digital check-in kiosks and patient concierge.",
    category: "Facilities",
  },
  {
    src: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=800&q=80",
    title: "Private Patient Suite",
    description: "Premium single-occupancy rooms with en-suite bathroom, entertainment system, and family seating area.",
    category: "Facilities",
  },
  {
    src: "https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=800&q=80",
    title: "Emergency Department",
    description: "24/7 emergency department with triage system, trauma bays, and rapid response capabilities.",
    category: "Facilities",
  },

  // Laboratory
  {
    src: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80",
    title: "Clinical Pathology Lab",
    description: "Roche Cobas 8000 automated analyzer processing 2,000+ samples daily with 99.9% accuracy.",
    category: "Laboratory",
  },
  {
    src: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&q=80",
    title: "Microbiology Laboratory",
    description: "BSL-2 certified lab with MALDI-TOF mass spectrometry for rapid pathogen identification.",
    category: "Laboratory",
  },
  {
    src: "https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=800&q=80",
    title: "Blood Bank & Transfusion Center",
    description: "AABB-accredited blood bank with automated cross-matching and component separation systems.",
    category: "Laboratory",
  },
  {
    src: "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800&q=80",
    title: "Molecular Diagnostics Lab",
    description: "PCR and next-generation sequencing capabilities for genetic testing and infectious disease screening.",
    category: "Laboratory",
  },
];

export default function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filtered = activeFilter === "All"
    ? galleryItems
    : galleryItems.filter((item) => item.category === activeFilter);

  const openLightbox = (index: number) => setLightbox(index);
  const closeLightbox = () => setLightbox(null);

  const navigateLightbox = (dir: number) => {
    if (lightbox === null) return;
    const newIndex = (lightbox + dir + filtered.length) % filtered.length;
    setLightbox(newIndex);
  };

  return (
    <>
      <PageTitle
        title="Gallery"
        description="Explore our state-of-the-art medical equipment, internationally recognized certifications, and modern healthcare facilities."
      />

      <section className="py-20">
        <div className="container mx-auto max-w-7xl px-6">
          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {filters.map((f) => {
              const count = f === "All" ? galleryItems.length : galleryItems.filter((i) => i.category === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                    activeFilter === f
                      ? "bg-[#049ebb] text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f}
                  <span className={`ml-1.5 text-xs ${activeFilter === f ? "text-white/70" : "text-gray-400"}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item, idx) => (
              <div
                key={`${item.title}-${idx}`}
                className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-shadow"
                onClick={() => openLightbox(idx)}
              >
                <div className="aspect-[4/3] bg-gray-100">
                  <img
                    src={item.src}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                {/* Category badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 text-[#049ebb] backdrop-blur-sm shadow-sm">
                    {item.category}
                  </span>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                  <h4 className="text-white font-bold text-lg leading-tight">{item.title}</h4>
                  <p className="text-white/70 text-sm mt-1 line-clamp-2">{item.description}</p>
                  <div className="mt-3">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/20 text-white backdrop-blur-sm">
                      <i className="bi bi-zoom-in text-lg"></i>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition z-10"
          >
            <i className="bi bi-x-lg text-xl"></i>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
            className="absolute left-4 sm:left-8 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition z-10"
          >
            <i className="bi bi-chevron-left text-2xl"></i>
          </button>

          <div className="max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={filtered[lightbox].src}
              alt={filtered[lightbox].title}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
            />
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
            className="absolute right-4 sm:right-8 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition z-10"
          >
            <i className="bi bi-chevron-right text-2xl"></i>
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center max-w-xl px-4">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#049ebb]/80 text-white mb-2">
              {filtered[lightbox].category}
            </span>
            <h4 className="font-bold text-lg text-white">{filtered[lightbox].title}</h4>
            <p className="text-white/60 text-sm mt-1">{filtered[lightbox].description}</p>
            <p className="text-white/30 text-xs mt-2">{lightbox + 1} / {filtered.length}</p>
          </div>
        </div>
      )}
    </>
  );
}
