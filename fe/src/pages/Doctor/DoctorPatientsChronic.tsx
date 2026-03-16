import { useEffect, useState } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import { useToast } from '../../hooks/useToast';
import {
  getFlaggedPatients,
  FlaggedPatientDTO,
  PageResponse,
} from '../../services/doctorService';

type FilterType = 'ALL' | 'ALLERGIES' | 'CHRONIC';

export default function DoctorPatientsChronic() {
  const { showToast } = useToast();
  const [patients, setPatients] = useState<FlaggedPatientDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 20,
  });

  const loadFlaggedPatients = async (page = 0, type: FilterType = 'ALL') => {
    if (page === 0) {
      setLoading(true);
    }
    try {
      const response: PageResponse<FlaggedPatientDTO> =
        await getFlaggedPatients({
          type: type,
          page: page,
          size: 20,
        });

      setPatients(response.content);
      setPagination({
        currentPage: response.number,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
        pageSize: response.size,
      });

      if (page === 0) {
        showToast(
          `✅ Loaded ${response.content.length} flagged patients`,
          'success'
        );
      }
    } catch (error) {
      console.error('Error loading flagged patients:', error);
      showToast('❌ Failed to load flagged patients', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load initial data once
  useEffect(() => {
    loadFlaggedPatients(0, filterType);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (newFilter: FilterType) => {
    setFilterType(newFilter);
    loadFlaggedPatients(0, newFilter);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      loadFlaggedPatients(newPage, filterType);
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'SEVERE':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'MILD':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'RESOLVED':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case 'MONITORING':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const filterButtons: Array<{ label: string; value: FilterType }> = [
    { label: 'All', value: 'ALL' },
    { label: 'Allergies', value: 'ALLERGIES' },
    { label: 'Chronic', value: 'CHRONIC' },
  ];

  return (
    <>
      <PageMeta
        title='Chronic/Allergy Flags | Doctor Panel'
        description='View patients with chronic conditions and allergies'
      />
      <PageBreadcrumb pageTitle='Chronic/Allergy Flags' />

      <div className='space-y-6'>
        {/* Flags Header with Filters */}
        <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]'>
          <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-lg font-semibold text-gray-800 dark:text-white'>
                  Chronic Conditions & Allergies{' '}
                  {patients.length > 0 && (
                    <span className='text-gray-500'>
                      ({pagination.totalElements})
                    </span>
                  )}
                </h3>
                <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                  Patients with clinical flags to support safer care
                </p>
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'>
            <div className='flex gap-2'>
              {filterButtons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => handleFilterChange(btn.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    filterType === btn.value
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            <span className='text-sm text-gray-500 dark:text-gray-400'>
              Page {pagination.currentPage + 1} of {pagination.totalPages || 1}
            </span>
          </div>

          {/* Table */}
          {loading ? (
            <div className='px-6 py-12 text-center text-gray-500 dark:text-gray-400'>
              Loading flagged patients...
            </div>
          ) : patients.length === 0 ? (
            <div className='px-6 py-12 text-center text-gray-500 dark:text-gray-400'>
              {filterType === 'ALL'
                ? 'No flagged patients'
                : filterType === 'ALLERGIES'
                  ? 'No patients with allergies'
                  : 'No patients with chronic conditions'}
            </div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-800'>
                  <thead>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                        Patient Name
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                        Age
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                        Allergies
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                        Chronic Conditions
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                        Last Visit
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200 dark:divide-gray-800'>
                    {patients.map((patient) => (
                      <tr
                        key={patient.id}
                        className='hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      >
                        <td className='px-6 py-4'>
                          <div className='flex items-center gap-3'>
                            <img
                              src={
                                patient.avatarUrl ||
                                'https://via.placeholder.com/40x40?text=' +
                                  patient.name[0]
                              }
                              alt={patient.name}
                              className='w-10 h-10 rounded-full object-cover'
                            />
                            <div>
                              <p className='font-medium text-gray-900 dark:text-white'>
                                {patient.name}
                              </p>
                              <p className='text-xs text-gray-500 dark:text-gray-400'>
                                MRN: {patient.mrn}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='text-sm text-gray-800 dark:text-gray-200'>
                            {patient.age ? `${patient.age} years` : 'N/A'}
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='space-y-1'>
                            {patient.allergyList &&
                            patient.allergyList.length > 0 ? (
                              patient.allergyList.map((allergy, idx) => (
                                <div
                                  key={idx}
                                  className='flex items-center gap-2'
                                >
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                                      allergy.severity
                                    )}`}
                                  >
                                    {allergy.allergyName}
                                  </span>
                                  {allergy.reactions &&
                                    allergy.reactions.length > 0 && (
                                      <span
                                        className='text-xs text-gray-500 dark:text-gray-400 cursor-help'
                                        title={allergy.reactions.join(', ')}
                                      >
                                        ({allergy.reactions.length})
                                      </span>
                                    )}
                                </div>
                              ))
                            ) : (
                              <span className='text-sm text-gray-500 dark:text-gray-400'>
                                None
                              </span>
                            )}
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='space-y-1'>
                            {patient.chronicConditionsList &&
                            patient.chronicConditionsList.length > 0 ? (
                              patient.chronicConditionsList.map(
                                (condition, idx) => (
                                  <div
                                    key={idx}
                                    className='flex items-center gap-2'
                                  >
                                    <span
                                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                                        condition.severity
                                      )}`}
                                    >
                                      {condition.conditionName}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(condition.status)}`}
                                    >
                                      {condition.status}
                                    </span>
                                  </div>
                                )
                              )
                            ) : (
                              <span className='text-sm text-gray-500 dark:text-gray-400'>
                                None
                              </span>
                            )}
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='text-sm text-gray-800 dark:text-gray-200'>
                            {patient.lastVisitDate
                              ? new Date(
                                  patient.lastVisitDate
                                ).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Never'}
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <button className='inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition'>
                            View Details →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className='px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between'>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 0}
                    className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    ← Previous
                  </button>
                  <div className='text-sm text-gray-600 dark:text-gray-400'>
                    Page {pagination.currentPage + 1} of {pagination.totalPages}
                  </div>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={
                      pagination.currentPage >= pagination.totalPages - 1
                    }
                    className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
