import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import patientService, {
  type DoctorCard,
  type Specialty,
} from "../../services/patientService";

export default function DoctorSearch() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<DoctorCard[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState("fullName");

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const result = await patientService.searchDoctors({
        q: search || undefined,
        specialtyId: selectedSpecialty,
        sortBy,
        pageNumber: page,
        pageSize: 9,
      });
      setDoctors(result.content);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error("Failed to load doctors:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedSpecialty, sortBy, page]);

  useEffect(() => {
    patientService.getSpecialties().then(setSpecialties).catch(console.error);
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchDoctors();
  };

  return (
    <>
      <PageMeta title="Find a Doctor | MedicalTech" description="Search and book appointments with doctors" />
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Find a Doctor</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Search by name, specialty, or browse all available doctors
          </p>
        </div>

        {/* Search & Filters Bar */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800/50 p-4 sm:p-5">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search doctor name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Specialty Filter */}
            <select
              title="Filter by specialty"
              value={selectedSpecialty ?? ""}
              onChange={(e) => {
                setSelectedSpecialty(e.target.value ? Number(e.target.value) : undefined);
                setPage(0);
              }}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 min-w-[160px]"
            >
              <option value="">All Specialties</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              title="Sort by"
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 min-w-[140px]"
            >
              <option value="fullName">Name A-Z</option>
              <option value="ratingAvg">Top Rated</option>
              <option value="experienceYears">Experience</option>
              <option value="consultationFee">Fee: Low to High</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium shrink-0"
            >
              Search
            </button>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              </div>
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-2">No doctors found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your search criteria</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map((doctor) => (
                <DoctorCardItem
                  key={doctor.id}
                  doctor={doctor}
                  onBook={() => navigate(`/patient/doctors/${doctor.id}`)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  Previous
                </button>
                <span className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-400">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function DoctorCardItem({ doctor, onBook }: { doctor: DoctorCard; onBook: () => void }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800/50 p-5 hover:shadow-lg transition-shadow group">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0 overflow-hidden">
          {doctor.avatarUrl ? (
            <img src={doctor.avatarUrl} alt={doctor.fullName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-bold text-lg">
              {doctor.fullName?.charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate">
            Dr. {doctor.fullName}
          </h3>
          <p className="text-xs text-blue-500 dark:text-blue-400 font-medium">
            {doctor.primarySpecialty}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {doctor.ratingAvg?.toFixed(1) || "N/A"} ({doctor.ratingCount})
          </span>
          <span>{doctor.experienceYears} yrs exp</span>
        </div>
        {doctor.hospitalAffiliation && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {doctor.hospitalAffiliation}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-800 dark:text-white">
            {doctor.consultationFee?.toLocaleString("vi-VN")} VND
          </span>
          {doctor.isAvailable ? (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Available
            </span>
          ) : (
            <span className="text-xs text-gray-400 font-medium">Unavailable</span>
          )}
        </div>
      </div>

      <button
        onClick={onBook}
        disabled={!doctor.isAvailable}
        className="w-full py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 transition-colors"
      >
        View Profile & Book
      </button>
    </div>
  );
}
