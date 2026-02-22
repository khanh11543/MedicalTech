import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import adminService, { Review, ReviewListParams, ModerateReviewRequest, Page } from "../../services/adminService";

export default function ReviewList() {
  const [reviews, setReviews] = useState<Page<Review> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<ReviewListParams>({
    pageNumber: 0,
    pageSize: 10,
  });

  // Moderate modal
  const [moderateModal, setModerateModal] = useState<{
    open: boolean;
    review: Review | null;
    isVisible: boolean;
    adminResponse: string;
  }>({ open: false, review: null, isVisible: true, adminResponse: "" });

  const ratingColors: Record<number, string> = {
    1: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    2: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    3: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    4: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    5: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  };

  useEffect(() => {
    fetchReviews();
  }, [filters]);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getReviews(filters);
      setReviews(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ReviewListParams, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      pageNumber: 0,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, pageNumber: newPage }));
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("vi-VN");
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const openModerateModal = (review: Review) => {
    setModerateModal({
      open: true,
      review,
      isVisible: review.isVisible,
      adminResponse: review.adminResponse || "",
    });
  };

  const handleModerate = async () => {
    if (!moderateModal.review) return;
    try {
      const data: ModerateReviewRequest = {
        isVisible: moderateModal.isVisible,
        adminResponse: moderateModal.adminResponse || undefined,
      };
      await adminService.moderateReview(moderateModal.review.id, data);
      setModerateModal({ open: false, review: null, isVisible: true, adminResponse: "" });
      setSuccessMsg("Review moderated successfully");
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchReviews();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to moderate review");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) return;
    try {
      await adminService.deleteReview(id);
      setSuccessMsg("Review deleted successfully");
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchReviews();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete review");
    }
  };

  return (
    <>
      <PageMeta
        title="Review Management | MediTech Admin"
        description="Manage patient reviews and ratings in the MediTech system"
      />
      <PageBreadcrumb pageTitle="Review Management" />

      <div className="rounded-lg border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] px-6 pt-6 pb-2.5 shadow-sm">
        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search
            </label>
            <input
              type="text"
              placeholder="Doctor name, patient, comment..."
              value={filters.keyword || ""}
              onChange={(e) => handleFilterChange("keyword", e.target.value || undefined)}
              className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Visibility
            </label>
            <select
              value={filters.isVisible === undefined ? "" : String(filters.isVisible)}
              onChange={(e) =>
                handleFilterChange("isVisible", e.target.value === "" ? undefined : e.target.value === "true")
              }
              title="Filter by visibility"
              className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
            >
              <option value="">All</option>
              <option value="true">Visible</option>
              <option value="false">Hidden</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rating
            </label>
            <select
              value={filters.rating || ""}
              onChange={(e) =>
                handleFilterChange("rating", e.target.value ? Number(e.target.value) : undefined)
              }
              title="Filter by rating"
              className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ pageNumber: 0, pageSize: 10 })}
              className="w-full rounded bg-teal-500 px-4 py-2.5 font-medium text-white hover:bg-teal-600 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Messages */}
        {successMsg && (
          <div className="mb-4 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800 p-4 text-green-700 dark:text-green-400">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 p-4 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-teal-500 border-t-transparent"></div>
          </div>
        )}

        {/* Table */}
        {!loading && reviews && (
          <>
            <div className="max-w-full overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-left border-b border-gray-200 dark:border-white/[0.05]">
                    <th className="min-w-[50px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">ID</th>
                    <th className="min-w-[140px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Patient</th>
                    <th className="min-w-[140px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Doctor</th>
                    <th className="min-w-[100px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Rating</th>
                    <th className="min-w-[200px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Comment</th>
                    <th className="min-w-[80px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Visible</th>
                    <th className="min-w-[130px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Created At</th>
                    <th className="min-w-[150px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.content.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-5 text-center text-gray-500 dark:text-gray-400">
                        No reviews found
                      </td>
                    </tr>
                  ) : (
                    reviews.content.map((review) => (
                      <tr
                        key={review.id}
                        className="border-b border-gray-200 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-gray-900/30"
                      >
                        <td className="px-4 py-5 text-sm text-gray-900 dark:text-white">#{review.id}</td>
                        <td className="px-4 py-5">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {review.patientName || "Anonymous"}
                          </p>
                          {review.isAnonymous && (
                            <span className="text-xs text-gray-400 italic">Anonymous</span>
                          )}
                        </td>
                        <td className="px-4 py-5">
                          <p className="text-sm text-gray-900 dark:text-white">{review.doctorName}</p>
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                            <span
                              className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                ratingColors[review.rating] || "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {review.rating}/5
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 max-w-[250px]">
                            {review.comment || <span className="italic text-gray-400">No comment</span>}
                          </p>
                          {review.adminResponse && (
                            <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">
                              Admin reply: {review.adminResponse.substring(0, 50)}
                              {review.adminResponse.length > 50 ? "..." : ""}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              review.isVisible
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {review.isVisible ? "Visible" : "Hidden"}
                          </span>
                        </td>
                        <td className="px-4 py-5 text-sm text-gray-900 dark:text-white">
                          {formatDate(review.createdAt)}
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openModerateModal(review)}
                              className="rounded bg-teal-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-600 transition-colors"
                            >
                              Moderate
                            </button>
                            <button
                              onClick={() => handleDelete(review.id)}
                              className="rounded bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {reviews.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-white/[0.05] px-4 py-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {reviews.numberOfElements} of {reviews.totalElements} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(reviews.number - 1)}
                    disabled={reviews.first}
                    className="rounded bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="flex items-center px-4 text-sm text-gray-700 dark:text-gray-300">
                    Page {reviews.number + 1} of {reviews.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(reviews.number + 1)}
                    disabled={reviews.last}
                    className="rounded bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Moderate Modal */}
      {moderateModal.open && moderateModal.review && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Moderate Review #{moderateModal.review.id}
            </h3>

            <div className="mb-4 rounded bg-gray-50 dark:bg-gray-800 p-3">
              <div className="flex items-center gap-2 mb-2">
                {renderStars(moderateModal.review.rating)}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  by {moderateModal.review.patientName || "Anonymous"}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {moderateModal.review.comment || "No comment"}
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Visibility
              </label>
              <select
                value={String(moderateModal.isVisible)}
                title="Review visibility"
                onChange={(e) =>
                  setModerateModal((prev) => ({ ...prev, isVisible: e.target.value === "true" }))
                }
                className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
              >
                <option value="true">Visible</option>
                <option value="false">Hidden</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Admin Response
              </label>
              <textarea
                value={moderateModal.adminResponse}
                onChange={(e) =>
                  setModerateModal((prev) => ({ ...prev, adminResponse: e.target.value }))
                }
                rows={3}
                placeholder="Write an admin response to this review..."
                className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setModerateModal({ open: false, review: null, isVisible: true, adminResponse: "" })
                }
                className="rounded bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleModerate}
                className="rounded bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
