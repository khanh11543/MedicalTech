import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PageTitle, StarRating } from "./components/SharedComponents";
import publicService, { type DoctorCard as DoctorCardType, type Specialty } from "../../services/publicService";
import { getAvatarUrl } from "../../utils/avatar";
import "./landing.css";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorCardType[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicService.getSpecialties().then(setSpecialties).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    publicService
      .getDoctors({ pageSize: 20, specialtyId: selectedSpecialty, sortBy: "ratingAvg", sortOrder: "desc" })
      .then((res) => setDoctors(res.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedSpecialty]);

  return (
    <>
      <PageTitle
        title="Our Doctors"
        description="Meet our team of highly qualified physicians and healthcare specialists dedicated to providing exceptional medical care."
        breadcrumbs={[
          { label: "Home", to: "/home" },
          { label: "Doctors" },
        ]}
      />

      <section className="py-[60px] bg-[#f8f9fa]">
        <div className="container-landing">
          {/* Specialty Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <button
              onClick={() => setSelectedSpecialty(undefined)}
              className={`py-2 px-5 rounded-full text-[0.9rem] font-medium border-2 transition-all ${
                !selectedSpecialty
                  ? "bg-[#049ebb] border-[#049ebb] text-white"
                  : "border-[rgba(44,48,49,0.2)] text-[#2c3031] hover:border-[#049ebb] hover:text-[#049ebb]"
              }`}
            >
              All
            </button>
            {specialties.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSpecialty(s.id)}
                className={`py-2 px-5 rounded-full text-[0.9rem] font-medium border-2 transition-all ${
                  selectedSpecialty === s.id
                    ? "bg-[#049ebb] border-[#049ebb] text-white"
                    : "border-[rgba(44,48,49,0.2)] text-[#2c3031] hover:border-[#049ebb] hover:text-[#049ebb]"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <i className="bi bi-arrow-repeat text-3xl animate-spin"></i>
              <p className="mt-3">Loading doctors...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <i className="bi bi-person-x text-4xl"></i>
              <p className="mt-3">No doctors found for this specialty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {doctors.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-[15px] shadow-[0_5px_25px_rgba(44,48,49,0.08)] transition-all hover:-translate-y-[5px] hover:shadow-[0_15px_40px_rgba(44,48,49,0.15)] min-w-0 flex flex-col"
                >
                  <Link to={`/doctors/${doc.id}`} className="block relative overflow-hidden h-[250px] rounded-t-[15px]">
                    {doc.avatarUrl ? (
                      <img
                        src={getAvatarUrl(doc.avatarUrl) ?? ""}
                        alt={doc.fullName}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#049ebb] to-[#037a94] flex items-center justify-center">
                        <span className="text-[4rem] font-bold text-white">{doc.fullName.replace(/^Dr\.?\s*/i, "").charAt(0)}</span>
                      </div>
                    )}
                    {doc.isAvailable && (
                      <div className="absolute top-[12px] right-[12px] py-1 px-3 rounded-[20px] text-[0.75rem] font-semibold uppercase tracking-[0.5px] bg-[rgba(40,167,69,0.9)] text-white">
                        Available
                      </div>
                    )}
                  </Link>
                  <div className="p-5 min-w-0 flex-1 flex flex-col">
                    <Link to={`/doctors/${doc.id}`} className="no-underline">
                      <h5 className="text-[1.15rem] font-semibold text-[#18444c] mb-1 hover:text-[#049ebb] transition-colors">
                        {doc.fullName}
                      </h5>
                    </Link>
                    <p className="text-[#049ebb] font-medium text-[0.9rem] mb-1">{doc.primarySpecialty}</p>
                    {doc.experienceYears > 0 && (
                      <p className="text-[0.85rem] text-[rgba(44,48,49,0.6)] mb-2">
                        {doc.experienceYears}+ years experience
                      </p>
                    )}
                    <div className="flex items-center mb-4">
                      <StarRating rating={doc.ratingCount > 0 ? (doc.ratingAvg ?? 0) : 0} showValue={false} />
                      {doc.ratingCount > 0 ? (
                        <span className="ml-2 text-[0.8rem] text-gray-400">({doc.ratingCount})</span>
                      ) : (
                        <span className="ml-2 text-[0.8rem] text-gray-400">No reviews</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 min-w-0 mt-auto items-stretch">
                      <Link
                        to={`/doctors/${doc.id}`}
                        className="flex items-center justify-center w-full min-w-0 py-2 px-2 text-[0.85rem] font-medium rounded-lg border-2 border-[#049ebb] text-[#049ebb] no-underline transition-all hover:bg-[#049ebb] hover:text-white whitespace-nowrap text-center"
                      >
                        View Profile
                      </Link>
                      <Link
                        to={`/appointment?doctor=${doc.id}&department=${encodeURIComponent(doc.primarySpecialty)}`}
                        className="flex items-center justify-center w-full min-w-0 py-2 px-2 text-[0.85rem] font-medium rounded-lg border-2 border-[#049ebb] bg-[#049ebb] text-white no-underline transition-all hover:bg-[#037a94] hover:border-[#037a94] whitespace-nowrap text-center"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
