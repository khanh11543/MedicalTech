import { useState } from "react";
import { PageTitle } from "./components/SharedComponents";
import "./landing.css";

interface GalleryItem {
  src: string;
  title: string;
  description: string;
  category: string;
}

const filters = ["All", "Facilities", "Staff", "Equipment", "Events"];

const galleryItems: GalleryItem[] = [
  { src: "/images/landing/gallery-1.webp", title: "Modern Reception Area", description: "Our welcoming reception area designed for patient comfort.", category: "Facilities" },
  { src: "/images/landing/gallery-2.webp", title: "Advanced Equipment", description: "State-of-the-art medical equipment for accurate diagnostics.", category: "Equipment" },
  { src: "/images/landing/gallery-3.webp", title: "Medical Team", description: "Our dedicated team of healthcare professionals.", category: "Staff" },
  { src: "/images/landing/gallery-4.webp", title: "Community Health Fair", description: "Annual community health awareness event.", category: "Events" },
  { src: "/images/landing/gallery-5.webp", title: "Patient Ward", description: "Comfortable and modern patient rooms.", category: "Facilities" },
  { src: "/images/landing/gallery-6.webp", title: "Surgical Suite", description: "Advanced surgical facilities for complex procedures.", category: "Equipment" },
  { src: "/images/landing/gallery-7.webp", title: "Nursing Staff", description: "Experienced nursing professionals providing compassionate care.", category: "Staff" },
  { src: "/images/landing/gallery-8.webp", title: "Charity Walkathon", description: "Supporting community health through charity events.", category: "Events" },
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
        description="Take a visual tour of our facilities, events, and medical team."
      />

      <section className="py-20">
        <div className="container mx-auto max-w-7xl px-6">
          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {filters.map((f) => (
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
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item, idx) => (
              <div
                key={`${item.src}-${idx}`}
                className="group relative rounded-2xl overflow-hidden cursor-pointer"
                onClick={() => openLightbox(idx)}
              >
                <div className="aspect-[4/3]">
                  <img
                    src={item.src}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <h4 className="text-white font-bold text-lg">{item.title}</h4>
                  <p className="text-white/70 text-sm">{item.description}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white">
                      <i className="bi bi-plus-circle text-xl"></i>
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
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-6 right-6 text-white text-3xl hover:text-gray-300 transition z-10"
          >
            <i className="bi bi-x-lg"></i>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
            className="absolute left-6 text-white text-3xl hover:text-gray-300 transition z-10"
          >
            <i className="bi bi-chevron-left"></i>
          </button>

          <img
            src={filtered[lightbox].src}
            alt={filtered[lightbox].title}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
            className="absolute right-6 text-white text-3xl hover:text-gray-300 transition z-10"
          >
            <i className="bi bi-chevron-right"></i>
          </button>

          <div className="absolute bottom-6 text-center text-white">
            <h4 className="font-bold text-lg">{filtered[lightbox].title}</h4>
            <p className="text-white/60 text-sm">{filtered[lightbox].description}</p>
          </div>
        </div>
      )}
    </>
  );
}
