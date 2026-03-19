import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import Badge from '../../components/ui/badge/Badge';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import {
  getRecentPatients,
  DoctorPatientRecentDTO,
  PageResponse,
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

const IconCheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill='currentColor' viewBox='0 0 24 24'>
    <path d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' />
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

function getDaysSinceVisit(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ============= Recent Patient Card Component =============
function RecentPatientCard({
  patient,
  onClick,
}: {
  patient: DoctorPatientRecentDTO;
  onClick: () => void;
}) {
  const hasAllergies = patient.allergies && patient.allergies.length > 0;
  const hasMedicalHistory =
    patient.medicalHistory && patient.medicalHistory.length > 0;
  const timeStatus = getDaysSinceVisit(patient.daysSinceLastVisit);

  return (
    <div
      onClick={onClick}
      className='group relative p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] hover:shadow-lg dark:hover:shadow-lg/20 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer'
    >
      {/* Time Badge */}
      <div className='absolute top-4 right-4'>
        <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-sm font-medium text-blue-700 dark:text-blue-400'>
          <IconClock className='w-3.5 h-3.5' />
          {timeStatus}
        </span>
      </div>

      {/* Header with Avatar */}
      <div className='flex items-start justify-between mb-4 pr-32'>
        <div className='flex items-center gap-3 flex-1'>
          <div className='flex-shrink-0'>
            <div className='w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-semibold text-white text-sm shadow-lg'>
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
      </div>

      {/* Medical Alerts */}
      {(hasAllergies || hasMedicalHistory) && (
        <div className='mb-4 pb-4 border-b border-gray-200 dark:border-gray-600'>
          {hasAllergies && (
            <div className='mb-2'>
              <p className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                Allergies
              </p>
              <Badge variant='light' color='error' size='sm'>
                {patient.allergies}
              </Badge>
            </div>
          )}
          {hasMedicalHistory && (
            <div>
              <p className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                Medical History
              </p>
              <p className='text-xs text-gray-700 dark:text-gray-300 line-clamp-2'>
                {patient.medicalHistory}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Last Visit Details */}
      {patient.lastVisitDate && (
        <div className='mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20'>
          <p className='text-xs font-medium text-amber-700 dark:text-amber-400 mb-1'>
            Last Visit
          </p>
          <p className='text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1'>
            {formatDateFromTimestamp(patient.lastVisitDate)}
          </p>
          {patient.lastVisitReason && (
            <div className='mb-2 pt-2 border-t border-amber-200 dark:border-amber-500/20'>
              <p className='text-xs text-amber-800 dark:text-amber-300'>
                <span className='font-medium'>Reason:</span>{' '}
                {patient.lastVisitReason}
              </p>
            </div>
          )}
          {patient.lastVisitNotes && (
            <p className='text-xs text-amber-700 dark:text-amber-400 line-clamp-2'>
              <span className='font-medium'>Notes:</span>{' '}
              {patient.lastVisitNotes}
            </p>
          )}
        </div>
      )}

      {/* Upcoming Appointment Status */}
      {patient.hasUpcomingAppointment && (
        <div className='mb-4 flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20'>
          <IconCheckCircle className='w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0' />
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium text-green-700 dark:text-green-400'>
              Upcoming Appointment
            </p>
            {patient.nextAppointmentDate && (
              <p className='text-xs text-green-600 dark:text-green-500'>
                {formatDateFromTimestamp(patient.nextAppointmentDate)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Follow-up Button */}
      <button className='w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors duration-200'>
        <span>View Details</span>
        <IconChevronRight className='w-4 h-4' />
      </button>
    </div>
  );
}

// ============= Loading Skeleton =============
function RecentPatientCardSkeleton() {
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
        <IconClock className='w-10 h-10 text-gray-400' />
      </div>
      <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
        {searchQuery ? 'No recent patients found' : 'No recent patients'}
      </h3>
      <p className='text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm'>
        {searchQuery
          ? `Try adjusting your search to find what you're looking for.`
          : `You haven't seen any patients recently. Visit history will appear here.`}
      </p>
    </div>
  );
}

// ============= Main Component =============
export default function DoctorPatientsRecent() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // State Management
  const [patients, setPatients] = useState<DoctorPatientRecentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [pagination, setPagination] = useState({
    pageNumber: 0,
    pageSize: 12,
    totalElements: 0,
    totalPages: 0,
  });

  // Load patients
  const loadPatients = useCallback(
    async (pageNum: number = 0, search: string = '') => {
      try {
        setLoading(true);
        const response: PageResponse<DoctorPatientRecentDTO> =
          await getRecentPatients({
            pageNumber: pageNum,
            pageSize: 12,
          });

        // Filter by search locally since the API doesn't support search for recent endpoint
        let filtered = response.content;
        if (search.toLowerCase()) {
          filtered = filtered.filter(
            (patient) =>
              patient.fullName.toLowerCase().includes(search.toLowerCase()) ||
              patient.email.toLowerCase().includes(search.toLowerCase()) ||
              patient.phone.toLowerCase().includes(search.toLowerCase())
          );
        }

        setPatients(filtered);
        setPagination({
          pageNumber: response.pageNumber,
          pageSize: response.pageSize,
          totalElements: response.totalElements,
          totalPages: response.totalPages,
        });
      } catch (error) {
        console.error('Error loading recent patients:', error);
        showToast('Failed to load recent patients. Please try again.', 'error');
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
  }, [loadPatients]);

  // Handle search debounce (reload first page)
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
    navigate(`/doctor/patients/${patientId}`, { state: { tab: 'recent' } });
  };

  // Sort by recency
  const sortedPatients = useMemo(() => {
    return [...patients].sort(
      (a, b) => a.daysSinceLastVisit - b.daysSinceLastVisit
    );
  }, [patients]);

  return (
    <>
      <PageMeta
        title='Recent Patients | Doctor Panel'
        description='View your recently seen patients'
      />
      <PageBreadcrumb pageTitle='Recent Patients' />

      <div className='space-y-8'>
        {/* Search Section */}
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
              recent patients
            </div>
          </div>
        </div>

        {/* Recent Patients Section */}
        <div>
          <div className='mb-6'>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
              Recently Seen Patients
            </h2>
            <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
              Your last 30 days of patient visits, sorted by most recent
            </p>
          </div>

          {loading ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {[...Array(6)].map((_, i) => (
                <RecentPatientCardSkeleton key={i} />
              ))}
            </div>
          ) : sortedPatients.length > 0 ? (
            <>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
                {sortedPatients.map((patient) => (
                  <RecentPatientCard
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
