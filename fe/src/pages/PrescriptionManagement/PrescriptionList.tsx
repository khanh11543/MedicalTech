import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import adminService, { Prescription, PrescriptionListParams, Page } from "../../services/adminService";

export default function PrescriptionList() {
  const [prescriptions, setPrescriptions] = useState<Page<Prescription> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<PrescriptionListParams>({
    pageNumber: 0,
    pageSize: 10,
  });

  useEffect(() => {
    fetchPrescriptions();
  }, [filters]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getPrescriptions(filters);
      setPrescriptions(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof PrescriptionListParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      pageNumber: 0,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, pageNumber: newPage }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  return (
    <>
      <PageMeta
        title="Prescription Management | MediTech Admin"
        description="Manage prescriptions in the MediTech system"
      />
      <PageBreadcrumb pageTitle="Prescription Management" />

      <div className="rounded-lg border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] px-6 pt-6 pb-2.5 shadow-sm">
        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              From Date
            </label>
            <input
              type="date"
              value={filters.from || ""}
              onChange={(e) => handleFilterChange("from", e.target.value || undefined)}
              title="Select start date"
              className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              To Date
            </label>
            <input
              type="date"
              value={filters.to || ""}
              onChange={(e) => handleFilterChange("to", e.target.value || undefined)}
              title="Select end date"
              className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
            />
          </div>

          <div className="lg:col-span-2 flex items-end">
            <button
              onClick={() => setFilters({ pageNumber: 0, pageSize: 10 })}
              className="w-full rounded bg-teal-500 px-4 py-2.5 font-medium text-white hover:bg-teal-600 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 p-4 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-teal-500 border-t-transparent"></div>
          </div>
        )}

        {/* Table */}
        {!loading && prescriptions && (
          <>
            <div className="max-w-full overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-left border-b border-gray-200 dark:border-white/[0.05]">
                    <th className="min-w-[80px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">
                      ID
                    </th>
                    <th className="min-w-[150px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">
                      Patient
                    </th>
                    <th className="min-w-[150px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">
                      Doctor
                    </th>
                    <th className="min-w-[120px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">
                      Date
                    </th>
                    <th className="min-w-[200px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">
                      Diagnosis
                    </th>
                    <th className="min-w-[100px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">
                      Medications
                    </th>
                    <th className="px-4 py-4 font-medium text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.content.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-5 text-center text-gray-500 dark:text-gray-400">
                        No prescriptions found
                      </td>
                    </tr>
                  ) : (
                    prescriptions.content.map((prescription) => (
                      <tr key={prescription.id} className="border-b border-gray-200 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-gray-900/30">
                        <td className="px-4 py-5">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            #{prescription.id}
                          </p>
                        </td>
                        <td className="px-4 py-5">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {prescription.patientName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{prescription.patientPhone}</p>
                        </td>
                        <td className="px-4 py-5">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {prescription.doctorName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{prescription.doctorSpecialization}</p>
                        </td>
                        <td className="px-4 py-5">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {formatDate(prescription.prescriptionDate)}
                          </p>
                        </td>
                        <td className="px-4 py-5">
                          <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                            {prescription.diagnosis}
                          </p>
                        </td>
                        <td className="px-4 py-5">
                          <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-800 dark:text-blue-400">
                            {prescription.items.length} items
                          </span>
                        </td>
                        <td className="px-4 py-5">
                          <button
                            onClick={() => setSelectedPrescription(prescription)}
                            className="rounded bg-teal-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-600 transition-colors"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {prescriptions.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-white/[0.05] px-4 py-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {prescriptions.numberOfElements} of {prescriptions.totalElements} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(prescriptions.number - 1)}
                    disabled={prescriptions.first}
                    className="rounded bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="flex items-center px-4 text-sm text-gray-700 dark:text-gray-300">
                    Page {prescriptions.number + 1} of {prescriptions.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(prescriptions.number + 1)}
                    disabled={prescriptions.last}
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

      {/* Detail Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg bg-white dark:bg-gray-900 shadow-xl">
            <div className="border-b border-gray-200 dark:border-white/[0.05] p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Prescription Details
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    ID: #{selectedPrescription.id}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPrescription(null)}
                  aria-label="Close modal"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Patient & Doctor Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Patient Information</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">Name</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{selectedPrescription.patientName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">Phone</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{selectedPrescription.patientPhone}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">Date of Birth</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{formatDate(selectedPrescription.patientDateOfBirth)}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Doctor Information</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">Name</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{selectedPrescription.doctorName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">Specialization</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{selectedPrescription.doctorSpecialization}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">Prescription Date</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{formatDate(selectedPrescription.prescriptionDate)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Diagnosis</h4>
                <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 rounded p-3">
                  {selectedPrescription.diagnosis}
                </p>
              </div>

              {/* Medications */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Medications</h4>
                <div className="space-y-3">
                  {selectedPrescription.items.map((item, index) => (
                    <div key={item.id} className="border border-gray-200 dark:border-white/[0.05] rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30 text-sm font-medium text-teal-600 dark:text-teal-400">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white">{item.medicineName}</h5>
                          <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Dosage:</span>
                              <span className="ml-1 text-gray-900 dark:text-white">{item.dosage}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Frequency:</span>
                              <span className="ml-1 text-gray-900 dark:text-white">{item.frequency}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                              <span className="ml-1 text-gray-900 dark:text-white">{item.duration}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Quantity:</span>
                              <span className="ml-1 text-gray-900 dark:text-white">{item.quantity} {item.unit}</span>
                            </div>
                          </div>
                          {item.instructions && (
                            <div className="mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Instructions:</span>
                              <p className="text-xs text-gray-900 dark:text-white mt-1">{item.instructions}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedPrescription.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</h4>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 rounded p-3">
                    {selectedPrescription.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

