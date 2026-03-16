import { useEffect, useState, useCallback } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import { useToast } from '../../hooks/useToast';
import {
  getDoctorPatients,
  DoctorPatientDTO,
  PageResponse,
} from '../../services/doctorService';

export default function DoctorPatients() {
  const { showToast } = useToast();
  const [patients, setPatients] = useState<DoctorPatientDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 20,
  });

  const loadPatients = useCallback(
    async (page = 0, search = '') => {
      if (page === 0) {
        setLoading(true);
      }
      try {
        const response: PageResponse<DoctorPatientDTO> =
          await getDoctorPatients({
            search: search,
            page: page,
            size: 20,
            sortBy: 'lastVisitDate',
            sortDir: 'DESC',
          });

        setPatients(response.content);
        setPagination({
          currentPage: response.number,
          totalPages: response.totalPages,
          totalElements: response.totalElements,
          pageSize: response.size,
        });

        if (page === 0 && search === '') {
          showToast(`✅ Loaded ${response.content.length} patients`, 'success');
        }
      } catch (error) {
        console.error('Error loading patients:', error);
        showToast('❌ Failed to load patients', 'error');
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadPatients(0, '');
  }, [loadPatients]);

  const handleSearch = async (value: string) => {
    setSearchQuery(value);
    setSearching(true);
    try {
      if (value.trim()) {
        showToast(`🔍 Searching for "${value}"...`, 'info');
      }
      await loadPatients(0, value);
    } finally {
      setSearching(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      loadPatients(newPage, searchQuery);
    }
  };

  return (
    <>
      <PageMeta
        title='My Patients | Doctor Panel'
        description='View your patients'
      />
      <PageBreadcrumb pageTitle='My Patients' />

      <div className='space-y-6'>
        {/* Search Bar */}
        <div className='flex items-center gap-4'>
          <div className='flex-1 relative'>
            <input
              type='text'
              placeholder='Search patients by name, phone, email, or MRN...'
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className='w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white'
            />
            <svg
              className='absolute left-3 top-3 text-gray-400 w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
            {searching && (
              <div className='absolute right-3 top-3 text-gray-400'>
                Loading...
              </div>
            )}
          </div>
        </div>

        {/* Patient List */}
        <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]'>
          <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold text-gray-800 dark:text-white'>
                Patient List{' '}
                {patients.length > 0 && (
                  <span className='text-gray-500'>
                    ({pagination.totalElements})
                  </span>
                )}
              </h3>
              <span className='text-sm text-gray-500 dark:text-gray-400'>
                Page {pagination.currentPage + 1} of{' '}
                {pagination.totalPages || 1}
              </span>
            </div>
          </div>

          {loading ? (
            <div className='px-6 py-12 text-center text-gray-500 dark:text-gray-400'>
              Loading patients...
            </div>
          ) : patients.length === 0 ? (
            <div className='px-6 py-12 text-center text-gray-500 dark:text-gray-400'>
              {searchQuery
                ? 'No patients found matching your search'
                : 'No patients found'}
            </div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-800'>
                  <thead>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                        Patient
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                        Contact
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                        Age/Gender
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                        Allergies
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                        Last Visit
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                        Total Visits
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
                            <p>{patient.phone}</p>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                              {patient.email}
                            </p>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='text-sm text-gray-800 dark:text-gray-200'>
                            <p>
                              {patient.age ? `${patient.age} years` : 'N/A'}
                            </p>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                              {patient.gender || 'N/A'}
                            </p>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='space-y-1'>
                            {patient.allergies ? (
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700`}
                              >
                                ⚠️ {patient.allergies}
                              </span>
                            ) : (
                              <span className='text-sm text-gray-500 dark:text-gray-400'>
                                None reported
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
                          <div className='text-sm font-medium text-gray-800 dark:text-gray-200'>
                            {patient.totalCompletedAppointments} visits
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
