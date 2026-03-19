import { useEffect, useState, useCallback } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import Badge from '../../components/ui/badge/Badge';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import {
  getPatientsWithFlags,
  getPatientsWithAllergies,
  getPatientsWithChronicConditions,
  DoctorPatientFlagsDTO,
  PageResponse,
} from '../../services/doctorService';

type FilterType = 'ALL' | 'ALLERGIES' | 'CHRONIC';

// ============= Icons =============
const IconAlertTriangle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
    strokeWidth={1.8}
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M12 9v2m0 4v2m0 0v2m0-6v0m0 0H9m3 0h3m-6-6l.75-1.5m3.5 0l.75 1.5M9 20h6a2 2 0 002-2V8a2 2 0 00-2-2H9a2 2 0 00-2 2v10a2 2 0 002 2z'
    />
  </svg>
);

const IconChevronRight = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
    strokeWidth={2}
  >
    <path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' />
  </svg>
);

export default function DoctorPatientsChronic() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [patients, setPatients] = useState<DoctorPatientFlagsDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [pagination, setPagination] = useState({
    pageNumber: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 12,
  });

  const loadFlaggedPatients = useCallback(
    async (pageNum = 0, type: FilterType = 'ALL') => {
      try {
        setLoading(true);
        let response: PageResponse<DoctorPatientFlagsDTO>;

        if (type === 'ALLERGIES') {
          response = await getPatientsWithAllergies({
            pageNumber: pageNum,
            pageSize: 12,
          });
        } else if (type === 'CHRONIC') {
          response = await getPatientsWithChronicConditions({
            pageNumber: pageNum,
            pageSize: 12,
          });
        } else {
          response = await getPatientsWithFlags({
            pageNumber: pageNum,
            pageSize: 12,
          });
        }

        setPatients(response.content);
        setPagination({
          pageNumber: response.pageNumber,
          totalPages: response.totalPages,
          totalElements: response.totalElements,
          pageSize: response.pageSize,
        });
      } catch (error) {
        console.error('Error loading flagged patients:', error);
        showToast(
          'Failed to load flagged patients. Please try again.',
          'error'
        );
        setPatients([]);
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  // Load initial data once
  useEffect(() => {
    loadFlaggedPatients(0, 'ALL');
  }, [loadFlaggedPatients]);

  const handleFilterChange = (newFilter: FilterType) => {
    setFilterType(newFilter);
    loadFlaggedPatients(0, newFilter);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      loadFlaggedPatients(newPage, filterType);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePatientClick = (patientId: number) => {
    navigate(`/doctor/patients/${patientId}`, { state: { tab: 'flags' } });
  };

  const getRiskLevelColor = (riskLevel: string): string => {
    switch (riskLevel.toUpperCase()) {
      case 'HIGH':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'LOW':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const filterButtons: Array<{ label: string; value: FilterType }> = [
    { label: 'All', value: 'ALL' },
    { label: 'Allergies', value: 'ALLERGIES' },
    { label: 'Chronic', value: 'CHRONIC' },
  ];

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDateFromTimestamp = (dateStr: string | null): string => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  return (
    <>
      <PageMeta
        title='Clinical Flags | Doctor Panel'
        description='View patients with allergies and chronic conditions'
      />
      <PageBreadcrumb pageTitle='Clinical Flags' />

      <div className='space-y-8'>
        {/* Filter Buttons */}
        <div className='flex flex-wrap gap-3'>
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => handleFilterChange(btn.value)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                filterType === btn.value
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Header with Count */}
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2'>
              <IconAlertTriangle className='w-6 h-6 text-red-600' />
              Patients with Clinical Flags
            </h2>
            <p className='text-sm text-gray-600 dark:text-gray-400 mt-2'>
              {filterType === 'ALL'
                ? 'Patients with allergies or chronic conditions'
                : filterType === 'ALLERGIES'
                  ? 'Patients with documented allergies'
                  : 'Patients with chronic conditions'}
            </p>
          </div>
          <div className='text-right'>
            <div className='text-3xl font-bold text-red-600'>
              {pagination.totalElements}
            </div>
            <div className='text-sm text-gray-600 dark:text-gray-400'>
              patients found
            </div>
          </div>
        </div>

        {/* Patients Grid */}
        {loading ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className='p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] animate-pulse space-y-4'
              >
                <div className='flex items-center gap-3'>
                  <div className='w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700' />
                  <div className='flex-1 space-y-2'>
                    <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-32' />
                    <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded w-24' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : patients.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20 px-4'>
            <div className='w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4'>
              <IconAlertTriangle className='w-10 h-10 text-gray-400' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
              No flagged patients
            </h3>
            <p className='text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm'>
              {filterType === 'ALL'
                ? 'No patients with allergies or chronic conditions found'
                : filterType === 'ALLERGIES'
                  ? 'No patients with allergies found'
                  : 'No patients with chronic conditions found'}
            </p>
          </div>
        ) : (
          <>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => handlePatientClick(patient.id)}
                  className='group cursor-pointer p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] hover:shadow-lg dark:hover:shadow-lg/20 hover:border-red-400 dark:hover:border-red-500 transition-all duration-200'
                >
                  {/* Risk Level Badge */}
                  <div className='absolute top-4 right-4'>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getRiskLevelColor(
                        patient.riskLevel
                      )}`}
                    >
                      {patient.riskLevel} RISK
                    </span>
                  </div>

                  {/* Patient Header */}
                  <div className='flex items-start gap-3 mb-4 pr-32'>
                    <div className='flex-shrink-0'>
                      <div className='w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center font-semibold text-white text-sm shadow-lg'>
                        {getInitials(patient.fullName)}
                      </div>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <h3 className='text-base font-semibold text-gray-900 dark:text-white truncate'>
                        {patient.fullName}
                      </h3>
                      <p className='text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5'>
                        {patient.phone}
                      </p>
                    </div>
                  </div>

                  {/* Allergies */}
                  {patient.allergies && patient.allergies.length > 0 && (
                    <div className='mb-4 pb-4 border-b border-gray-200 dark:border-gray-600'>
                      <p className='text-xs font-semibold text-red-700 dark:text-red-400 mb-2 uppercase'>
                        ⚠️ Allergies
                      </p>
                      <div className='flex flex-wrap gap-1.5'>
                        {patient.allergies.slice(0, 3).map((allergy, idx) => (
                          <Badge
                            key={idx}
                            variant='light'
                            color='error'
                            size='sm'
                          >
                            {allergy}
                          </Badge>
                        ))}
                        {patient.allergies.length > 3 && (
                          <span className='text-xs text-gray-500 dark:text-gray-400'>
                            +{patient.allergies.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Chronic Conditions */}
                  {patient.chronicConditions &&
                    patient.chronicConditions.length > 0 && (
                      <div className='mb-4'>
                        <p className='text-xs font-semibold text-orange-700 dark:text-orange-400 mb-2 uppercase'>
                          Chronic Conditions
                        </p>
                        <div className='flex flex-wrap gap-1.5'>
                          {patient.chronicConditions
                            .slice(0, 2)
                            .map((condition, idx) => (
                              <Badge
                                key={idx}
                                variant='light'
                                color='warning'
                                size='sm'
                              >
                                {condition}
                              </Badge>
                            ))}
                          {patient.chronicConditions.length > 2 && (
                            <span className='text-xs text-gray-500 dark:text-gray-400'>
                              +{patient.chronicConditions.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Last Visit & Active Prescriptions */}
                  <div className='grid grid-cols-2 gap-2 mb-4 pt-4 border-t border-gray-200 dark:border-gray-600'>
                    <div className='px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50'>
                      <p className='text-xs text-gray-600 dark:text-gray-400'>
                        Last Visit
                      </p>
                      <p className='text-sm font-bold text-gray-900 dark:text-white mt-1'>
                        {formatDateFromTimestamp(patient.lastVisitDate)}
                      </p>
                    </div>
                    <div className='px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50'>
                      <p className='text-xs text-gray-600 dark:text-gray-400'>
                        Prescriptions
                      </p>
                      <p className='text-sm font-bold text-gray-900 dark:text-white mt-1'>
                        {patient.activePrescriptionsCount}
                        <span className='text-xs font-normal text-gray-500 dark:text-gray-400 ml-1'>
                          active
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* View Button */}
                  <button className='w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-medium group-hover:bg-red-100 dark:group-hover:bg-red-500/20 transition-colors duration-200'>
                    <span>View Details</span>
                    <IconChevronRight className='w-4 h-4' />
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className='flex items-center justify-center gap-2 pt-4'>
                <button
                  onClick={() => handlePageChange(pagination.pageNumber - 1)}
                  disabled={pagination.pageNumber === 0}
                  className='px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
                >
                  Previous
                </button>
                <div className='flex items-center gap-1'>
                  {Array.from({ length: pagination.totalPages }).map(
                    (_, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePageChange(idx)}
                        className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                          pagination.pageNumber === idx
                            ? 'bg-red-600 text-white'
                            : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    )
                  )}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.pageNumber + 1)}
                  disabled={pagination.pageNumber >= pagination.totalPages - 1}
                  className='px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
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
