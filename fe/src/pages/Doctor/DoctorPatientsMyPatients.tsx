import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import Badge from '../../components/ui/badge/Badge';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import {
  getMyPatients,
  getPatientCohortStats,
  DoctorPatientDTO,
  PageResponse,
  DoctorPatientCohortStatsDTO,
} from '../../services/doctorService';

// ============= Icons =============
const IconSearch = ({ className }: { className?: string }) => (
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
      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
    />
  </svg>
);

const IconUsers = ({ className }: { className?: string }) => (
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
      d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
    />
  </svg>
);

const IconAlertCircle = ({ className }: { className?: string }) => (
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
      d='M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
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

const IconClock = ({ className }: { className?: string }) => (
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
      d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    />
  </svg>
);

// ============= Helper Functions =============
function formatDateFromTimestamp(dateStr: string | null): string {
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
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ============= Stat Card Component =============
function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: (props: { className?: string }) => any;
}) {
  return (
    <div className='flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05]'>
      <div className='flex-shrink-0'>
        <Icon className='w-8 h-8 text-blue-600 dark:text-blue-400' />
      </div>
      <div>
        <p className='text-sm text-gray-600 dark:text-gray-400'>{label}</p>
        <p className='text-2xl font-bold text-gray-900 dark:text-white'>
          {value}
        </p>
      </div>
    </div>
  );
}

// ============= Patient Card Component =============
function PatientCard({
  patient,
  onClick,
}: {
  patient: DoctorPatientDTO;
  onClick: () => void;
}) {
  const allergies = patient.allergyList || [];
  const conditions = patient.chronicConditions || [];
  const hasFlags = allergies.length > 0 || conditions.length > 0;

  return (
    <div
      onClick={onClick}
      className='group relative p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] hover:shadow-lg dark:hover:shadow-lg/20 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer'
    >
      {/* Header with Avatar */}
      <div className='flex items-start justify-between mb-4'>
        <div className='flex items-center gap-3 flex-1'>
          <div className='flex-shrink-0'>
            <div className='w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-semibold text-white text-sm shadow-lg'>
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
        {hasFlags && (
          <div className='flex-shrink-0 ml-2'>
            <IconAlertCircle className='w-5 h-5 text-amber-500' />
          </div>
        )}
      </div>

      {/* Medical Flags */}
      {hasFlags && (
        <div className='mb-4 pb-4 border-b border-gray-200 dark:border-gray-600'>
          {allergies.length > 0 && (
            <div className='mb-2'>
              <p className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                Allergies
              </p>
              <div className='flex flex-wrap gap-1'>
                {allergies.slice(0, 2).map((allergy, idx) => (
                  <Badge key={idx} variant='light' color='error' size='sm'>
                    {allergy}
                  </Badge>
                ))}
                {allergies.length > 2 && (
                  <span className='text-xs text-gray-500 dark:text-gray-400'>
                    +{allergies.length - 2}
                  </span>
                )}
              </div>
            </div>
          )}
          {conditions.length > 0 && (
            <div>
              <p className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                Chronic Conditions
              </p>
              <div className='flex flex-wrap gap-1'>
                {conditions.slice(0, 2).map((condition, idx) => (
                  <Badge key={idx} variant='light' color='warning' size='sm'>
                    {condition}
                  </Badge>
                ))}
                {conditions.length > 2 && (
                  <span className='text-xs text-gray-500 dark:text-gray-400'>
                    +{conditions.length - 2}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Medical Summary */}
      <div className='grid grid-cols-2 gap-3 mb-4'>
        <div className='px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50'>
          <p className='text-xs text-gray-600 dark:text-gray-400'>
            Total Visits
          </p>
          <p className='text-lg font-bold text-gray-900 dark:text-white mt-0.5'>
            {patient.totalVisits}
          </p>
        </div>
        <div className='px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50'>
          <p className='text-xs text-gray-600 dark:text-gray-400'>
            Prescriptions
          </p>
          <p className='text-sm font-bold text-gray-900 dark:text-white mt-0.5'>
            <span className='text-blue-600 dark:text-blue-400'>
              {patient.activePrescriptionsCount}
            </span>
            <span className='text-xs font-normal text-gray-500 dark:text-gray-400 mx-1'>
              active
            </span>
            {patient.totalPrescriptionsCount > 0 && (
              <span className='text-xs font-normal text-gray-500 dark:text-gray-400'>
                / {patient.totalPrescriptionsCount} total
              </span>
            )}
          </p>
          {patient.mostRecentPrescriptionDate && (
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
              Last: {formatDateFromTimestamp(patient.mostRecentPrescriptionDate)}
            </p>
          )}
        </div>
      </div>

      {/* Last Visit */}
      {patient.lastVisitDate && (
        <div className='flex items-start gap-2 mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10'>
          <IconClock className='w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5' />
          <div className='min-w-0'>
            <p className='text-xs text-gray-600 dark:text-gray-400'>
              Last Visit
            </p>
            <p className='text-sm font-medium text-gray-900 dark:text-white'>
              {formatDateFromTimestamp(patient.lastVisitDate)}
            </p>
            {patient.lastVisitReason && (
              <p className='text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5'>
                "{patient.lastVisitReason}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Appointment Badge */}
      {patient.hasUpcomingAppointment && (
        <div className='flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-500/10 mb-4'>
          <span className='text-xs font-medium text-green-700 dark:text-green-400'>
            Upcoming Appointment
          </span>
          <span className='text-xs font-semibold text-green-700 dark:text-green-400'>
            {patient.nextAppointmentDate
              ? formatDateFromTimestamp(patient.nextAppointmentDate)
              : '●'}
          </span>
        </div>
      )}

      {/* View Detail Button */}
      <button className='w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors duration-200'>
        <span>Open consultation record</span>
        <IconChevronRight className='w-4 h-4' />
      </button>
    </div>
  );
}

// ============= Loading Skeleton =============
function PatientCardSkeleton() {
  return (
    <div className='p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05]'>
      <div className='animate-pulse space-y-4'>
        <div className='flex items-center gap-3'>
          <div className='w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700' />
          <div className='flex-1 space-y-2'>
            <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-32' />
            <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded w-24' />
          </div>
        </div>
        <div className='space-y-2'>
          <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded' />
          <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6' />
        </div>
      </div>
    </div>
  );
}

// ============= Empty State =============
function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className='flex flex-col items-center justify-center py-20 px-4'>
      <div className='w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4'>
        <IconUsers className='w-10 h-10 text-gray-400' />
      </div>
      <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
        {searchQuery ? 'No patients found' : 'No patients yet'}
      </h3>
      <p className='text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm'>
        {searchQuery
          ? `Try adjusting your search or filters to find what you're looking for.`
          : `You haven't seen any patients yet. Scheduled appointments will appear here.`}
      </p>
    </div>
  );
}

// ============= Main Component =============
export default function DoctorPatientsMyPatients() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // State Management
  const [patients, setPatients] = useState<DoctorPatientDTO[]>([]);
  const [stats, setStats] = useState<DoctorPatientCohortStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [pagination, setPagination] = useState({
    pageNumber: 0,
    pageSize: 12,
    totalElements: 0,
    totalPages: 0,
  });

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await getPatientCohortStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Don't show toast for stats failure, it's secondary data
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load patients
  const loadPatients = useCallback(
    async (pageNum: number = 0, search: string = '') => {
      try {
        setLoading(true);
        const response: PageResponse<DoctorPatientDTO> = await getMyPatients({
          search: search || undefined,
          pageNumber: pageNum,
          pageSize: 12,
          sortBy: 'id',
          sortOrder: 'desc',
        });

        setPatients(response.content);
        setPagination({
          pageNumber: response.pageNumber,
          pageSize: response.pageSize,
          totalElements: response.totalElements,
          totalPages: response.totalPages,
        });
      } catch (error) {
        console.error('Error loading patients:', error);
        showToast('Failed to load patients. Please try again.', 'error');
        setPatients([]);
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  // Initial load
  useEffect(() => {
    loadPatients(0, '');
    loadStats();
  }, [loadPatients, loadStats]);

  // Handle search debounce
  useEffect(() => {
    loadPatients(0, debouncedSearch);
  }, [debouncedSearch, loadPatients]);

  // Pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      loadPatients(newPage, debouncedSearch);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle patient click
  const handlePatientClick = (patientId: number) => {
    navigate(`/doctor/patients/${patientId}`, {
      state: { tab: 'my-patients' },
    });
  };

  // Render stats
  const statsCards = useMemo(() => {
    if (!stats) return null;
    return (
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatCard
          label='Total Patients'
          value={stats.totalPatients}
          icon={IconUsers}
        />
        <StatCard
          label='Recent (30 Days)'
          value={stats.patientsInLast30Days}
          icon={IconClock}
        />
        <StatCard
          label='With Allergies'
          value={stats.patientsWithAllergies}
          icon={IconAlertCircle}
        />
        <StatCard
          label='High Risk'
          value={stats.highRiskPatients}
          icon={IconAlertCircle}
        />
      </div>
    );
  }, [stats]);

  return (
    <>
      <PageMeta
        title='My Patients | Doctor Panel'
        description='View and manage your patient cohort'
      />
      <PageBreadcrumb pageTitle='My Patients' />

      <div className='space-y-8'>
        {/* Statistics Section */}
        {!statsLoading && statsCards}

        {/* Search & Filter Section */}
        <div className='rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] p-6'>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='relative flex-1'>
              <IconSearch className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
              <input
                type='text'
                placeholder='Search by name, email, or phone...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-all duration-200'
              />
            </div>
            <div className='flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-600 dark:text-gray-400'>
              <span className='font-medium text-gray-900 dark:text-white'>
                {pagination.totalElements}
              </span>
              patients found
            </div>
          </div>
        </div>

        {/* Patients Grid Section */}
        <div>
          <div className='mb-6'>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
              Your Patients
            </h2>
            <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
              Click on any patient to view detailed information and medical
              history
            </p>
          </div>

          {loading ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {[...Array(6)].map((_, i) => (
                <PatientCardSkeleton key={i} />
              ))}
            </div>
          ) : patients.length > 0 ? (
            <>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
                {patients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    onClick={() => handlePatientClick(patient.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className='flex items-center justify-center gap-2'>
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
                              ? 'bg-blue-600 text-white'
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
                    disabled={
                      pagination.pageNumber >= pagination.totalPages - 1
                    }
                    className='px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState searchQuery={searchQuery} />
          )}
        </div>
      </div>
    </>
  );
}
