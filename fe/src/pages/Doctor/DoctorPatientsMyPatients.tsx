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
  getRecentPatients,
  getPatientsWithFlags,
  getPatientsWithAllergies,
  getPatientsWithChronicConditions,
  getPatientsWithMedicationRisk,
  getHighRiskPatients,
  DoctorPatientDTO,
  DoctorPatientRecentDTO,
  DoctorPatientFlagsDTO,
  PageResponse,
  DoctorPatientCohortStatsDTO,
} from '../../services/doctorService';

type PatientsViewTab = 'all' | 'recent' | 'flags';
type FlagsFilter = 'all' | 'allergies' | 'chronic' | 'medication-risk' | 'high-risk';

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
            {patient.avatarUrl ? (
              <img
                src={patient.avatarUrl}
                alt={patient.fullName}
                className='w-12 h-12 rounded-full object-cover shadow-lg'
              />
            ) : (
              <div className='w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-semibold text-white text-sm shadow-lg'>
                {getInitials(patient.fullName)}
              </div>
            )}
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

function riskBadgeVariant(
  level: string
): 'error' | 'warning' | 'light' {
  if (level === 'HIGH') return 'error';
  if (level === 'MEDIUM') return 'warning';
  return 'light';
}

function RecentPatientCard({
  patient,
  onClick,
}: {
  patient: DoctorPatientRecentDTO;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className='group relative p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] hover:shadow-lg dark:hover:shadow-lg/20 hover:border-teal-400 dark:hover:border-teal-500 transition-all duration-200 cursor-pointer'
    >
      <div className='flex items-start justify-between mb-3'>
        <div className='min-w-0'>
          <h3 className='text-base font-semibold text-gray-900 dark:text-white truncate'>
            {patient.fullName}
          </h3>
          <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
            {patient.phone}
          </p>
        </div>
        {patient.daysSinceLastVisit != null && (
          <span className='text-xs font-medium text-teal-600 dark:text-teal-400 shrink-0 ml-2'>
            {patient.daysSinceLastVisit === 0
              ? 'Today'
              : `${patient.daysSinceLastVisit}d ago`}
          </span>
        )}
      </div>
      {patient.lastVisitDate && (
        <div className='flex items-start gap-2 mb-3 p-3 rounded-lg bg-teal-50 dark:bg-teal-500/10'>
          <IconClock className='w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5' />
          <div className='min-w-0'>
            <p className='text-xs text-gray-600 dark:text-gray-400'>Last visit</p>
            <p className='text-sm font-medium text-gray-900 dark:text-white'>
              {formatDateFromTimestamp(patient.lastVisitDate)}
            </p>
            {patient.lastVisitReason && (
              <p className='text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2'>
                {patient.lastVisitReason}
              </p>
            )}
          </div>
        </div>
      )}
      {(patient.allergies || patient.medicalHistory) && (
        <p className='text-xs text-amber-800 dark:text-amber-200/90 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-2 py-1.5 mb-3 line-clamp-2'>
          {[patient.allergies && `Allergies: ${patient.allergies}`, patient.medicalHistory && `History: ${patient.medicalHistory}`]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
      {patient.lastVisitNotes && (
        <p className='text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 border-l-2 border-gray-300 dark:border-gray-600 pl-2'>
          <span className='font-medium text-gray-700 dark:text-gray-300'>Note: </span>
          {patient.lastVisitNotes}
        </p>
      )}
      {patient.hasUpcomingAppointment && (
        <div className='flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-500/10 mb-3'>
          <span className='text-xs font-medium text-green-700 dark:text-green-400'>
            Follow-up scheduled
          </span>
          <span className='text-xs font-semibold text-green-700 dark:text-green-400'>
            {patient.nextAppointmentDate
              ? formatDateFromTimestamp(patient.nextAppointmentDate)
              : '●'}
          </span>
        </div>
      )}
      <button
        type='button'
        className='w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 font-medium group-hover:bg-teal-100 dark:group-hover:bg-teal-500/20 transition-colors duration-200'
      >
        <span>Open patient</span>
        <IconChevronRight className='w-4 h-4' />
      </button>
    </div>
  );
}

function FlagsPatientCard({
  patient,
  onClick,
}: {
  patient: DoctorPatientFlagsDTO;
  onClick: () => void;
}) {
  const hasAllergies = patient.allergies && patient.allergies.length > 0;
  const hasChronic = patient.chronicConditions && patient.chronicConditions.length > 0;

  return (
    <div
      onClick={onClick}
      className='group relative p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] hover:shadow-lg hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-200 cursor-pointer'
    >
      <div className='flex items-start justify-between gap-2 mb-3'>
        <div className='min-w-0 flex-1'>
          <h3 className='text-base font-semibold text-gray-900 dark:text-white truncate'>
            {patient.fullName}
          </h3>
          <p className='text-xs text-gray-500 dark:text-gray-400'>{patient.phone}</p>
        </div>
        <div className='flex flex-col items-end gap-1 shrink-0'>
          <Badge
            variant='light'
            color={riskBadgeVariant(patient.riskLevel)}
            size='sm'
          >
            {patient.riskLevel} risk
          </Badge>
          {patient.hasMedicationRisk && (
            <span className='text-[10px] font-semibold text-rose-600 dark:text-rose-400'>
              Med risk
            </span>
          )}
        </div>
      </div>

      {hasAllergies && (
        <div className='mb-2'>
          <p className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
            Allergies
          </p>
          <div className='flex flex-wrap gap-1'>
            {patient.allergies.slice(0, 4).map((a, idx) => (
              <Badge key={idx} variant='light' color='error' size='sm'>
                {a}
              </Badge>
            ))}
            {patient.allergies.length > 4 && (
              <span className='text-xs text-gray-500'>
                +{patient.allergies.length - 4}
              </span>
            )}
          </div>
        </div>
      )}
      {hasChronic && (
        <div className='mb-2'>
          <p className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
            Chronic conditions
          </p>
          <div className='flex flex-wrap gap-1'>
            {patient.chronicConditions.slice(0, 4).map((c, idx) => (
              <Badge key={idx} variant='light' color='warning' size='sm'>
                {c}
              </Badge>
            ))}
            {patient.chronicConditions.length > 4 && (
              <span className='text-xs text-gray-500'>
                +{patient.chronicConditions.length - 4}
              </span>
            )}
          </div>
        </div>
      )}
      {patient.medicationRiskNote && (
        <p className='text-xs text-rose-800 dark:text-rose-200/90 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-2 py-1.5 mb-2'>
          {patient.medicationRiskNote}
        </p>
      )}
      {patient.lastVisitNotes && (
        <p className='text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 border-l-2 border-amber-400 pl-2'>
          <span className='font-medium text-gray-700 dark:text-gray-300'>
            Last visit note:{' '}
          </span>
          {patient.lastVisitNotes}
        </p>
      )}
      <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3'>
        {patient.lastVisitDate && (
          <span>Last visit: {formatDateFromTimestamp(patient.lastVisitDate)}</span>
        )}
        {patient.activePrescriptionsCount != null && patient.activePrescriptionsCount > 0 && (
          <span>
            {patient.activePrescriptionsCount} active Rx
          </span>
        )}
      </div>
      <button
        type='button'
        className='w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 font-medium group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20 transition-colors duration-200'
      >
        <span>Review patient</span>
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
function EmptyState({
  searchQuery,
  viewTab,
}: {
  searchQuery: string;
  viewTab: PatientsViewTab;
}) {
  const title =
    viewTab === 'recent'
      ? 'No recent patients'
      : viewTab === 'flags'
        ? 'No patients in this list'
        : searchQuery
          ? 'No patients found'
          : 'No patients yet';
  const desc =
    viewTab === 'recent'
      ? 'No visits with you in the last 30 days (completed or in progress). Patients will appear here after appointments.'
      : viewTab === 'flags'
        ? 'Try another flag filter, or patients may have no allergies / chronic data on file yet.'
        : searchQuery
          ? `Try adjusting your search to find what you're looking for.`
          : `You haven't seen any patients yet. Scheduled appointments will appear here.`;

  return (
    <div className='flex flex-col items-center justify-center py-20 px-4'>
      <div className='w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4'>
        <IconUsers className='w-10 h-10 text-gray-400' />
      </div>
      <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
        {title}
      </h3>
      <p className='text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm'>
        {desc}
      </p>
    </div>
  );
}

// ============= Main Component =============
const PAGE_SIZE = 12;

export default function DoctorPatientsMyPatients() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [viewTab, setViewTab] = useState<PatientsViewTab>('all');
  const [flagsFilter, setFlagsFilter] = useState<FlagsFilter>('all');

  const [patients, setPatients] = useState<DoctorPatientDTO[]>([]);
  const [recentPatients, setRecentPatients] = useState<DoctorPatientRecentDTO[]>(
    []
  );
  const [flagPatients, setFlagPatients] = useState<DoctorPatientFlagsDTO[]>(
    []
  );

  const [stats, setStats] = useState<DoctorPatientCohortStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [pageNumber, setPageNumber] = useState(0);
  const [pagination, setPagination] = useState({
    pageNumber: 0,
    pageSize: PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  });

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await getPatientCohortStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    const params = { pageNumber, pageSize: PAGE_SIZE };
    try {
      setLoading(true);
      if (viewTab === 'all') {
        const response: PageResponse<DoctorPatientDTO> = await getMyPatients({
          search: debouncedSearch || undefined,
          pageNumber,
          pageSize: PAGE_SIZE,
          sortBy: 'id',
          sortOrder: 'desc',
        });
        setPatients(response.content);
        setRecentPatients([]);
        setFlagPatients([]);
        setPagination({
          pageNumber: response.pageNumber,
          pageSize: response.pageSize,
          totalElements: response.totalElements,
          totalPages: response.totalPages,
        });
        return;
      }
      if (viewTab === 'recent') {
        const response: PageResponse<DoctorPatientRecentDTO> =
          await getRecentPatients(params);
        setRecentPatients(response.content);
        setPatients([]);
        setFlagPatients([]);
        setPagination({
          pageNumber: response.pageNumber,
          pageSize: response.pageSize,
          totalElements: response.totalElements,
          totalPages: response.totalPages,
        });
        return;
      }
      let response: PageResponse<DoctorPatientFlagsDTO>;
      switch (flagsFilter) {
        case 'allergies':
          response = await getPatientsWithAllergies(params);
          break;
        case 'chronic':
          response = await getPatientsWithChronicConditions(params);
          break;
        case 'medication-risk':
          response = await getPatientsWithMedicationRisk(params);
          break;
        case 'high-risk':
          response = await getHighRiskPatients(params);
          break;
        default:
          response = await getPatientsWithFlags(params);
      }
      setFlagPatients(response.content);
      setPatients([]);
      setRecentPatients([]);
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
      setRecentPatients([]);
      setFlagPatients([]);
      setPagination((p) => ({ ...p, totalElements: 0, totalPages: 0 }));
    } finally {
      setLoading(false);
    }
  }, [
    viewTab,
    flagsFilter,
    debouncedSearch,
    pageNumber,
    showToast,
  ]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPageNumber(0);
  }, [debouncedSearch]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      setPageNumber(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePatientClick = (patientId: number) => {
    navigate(`/doctor/patients/${patientId}`, {
      state: { tab: 'my-patients' },
    });
  };

  const selectViewTab = (tab: PatientsViewTab) => {
    setViewTab(tab);
    setPageNumber(0);
  };

  const selectFlagsFilter = (f: FlagsFilter) => {
    setFlagsFilter(f);
    setPageNumber(0);
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

        {/* View tabs + search */}
        <div className='rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] p-6 space-y-5'>
          <div className='flex flex-col gap-3'>
            <p className='text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>
              View
            </p>
            <div className='flex flex-wrap gap-2'>
              {(
                [
                  { id: 'all' as const, label: 'All patients' },
                  { id: 'recent' as const, label: 'Recent (30 days)' },
                  { id: 'flags' as const, label: 'Clinical flags' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type='button'
                  onClick={() => selectViewTab(t.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                    viewTab === t.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {viewTab === 'flags' && (
            <div className='pt-2 border-t border-gray-100 dark:border-gray-700'>
              <p className='text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2'>
                Flag type
              </p>
              <div className='flex flex-wrap gap-2'>
                {(
                  [
                    { id: 'all' as FlagsFilter, label: 'All flags' },
                    { id: 'allergies' as FlagsFilter, label: 'Allergies' },
                    { id: 'chronic' as FlagsFilter, label: 'Chronic conditions' },
                    {
                      id: 'medication-risk' as FlagsFilter,
                      label: 'Medication risk',
                    },
                    { id: 'high-risk' as FlagsFilter, label: 'High risk' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type='button'
                    onClick={() => selectFlagsFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      flagsFilter === f.id
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-400'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-amber-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {viewTab === 'recent' && (
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Patients with a completed or in-progress visit with you in the
              last 30 days — for quick follow-up and chart review.
            </p>
          )}

          {viewTab === 'flags' && (
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Patients in your cohort with documented allergies, chronic
              conditions, elevated risk, or polypharmacy (medication risk).
              Last-visit notes appear when available.
            </p>
          )}

          <div className='flex flex-col sm:flex-row gap-4 pt-2'>
            <div className='relative flex-1'>
              <IconSearch className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
              <input
                type='text'
                placeholder={
                  viewTab === 'all'
                    ? 'Search by name, email, or phone...'
                    : 'Search is available in All patients view'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={viewTab !== 'all'}
                className='w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
              />
            </div>
            <div className='flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-600 dark:text-gray-400'>
              <span className='font-medium text-gray-900 dark:text-white'>
                {pagination.totalElements}
              </span>
              {viewTab === 'all'
                ? 'patients'
                : viewTab === 'recent'
                  ? 'recent'
                  : 'flagged'}
            </div>
          </div>
        </div>

        {/* Patients Grid Section */}
        <div>
          <div className='mb-6'>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
              {viewTab === 'all'
                ? 'Your patients'
                : viewTab === 'recent'
                  ? 'Recently seen'
                  : 'Flagged patients'}
            </h2>
            <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
              {viewTab === 'all'
                ? 'Click a patient to open details and medical history.'
                : viewTab === 'recent'
                  ? 'Open a patient to continue care or document follow-up.'
                  : 'Review allergies, chronic conditions, and medication risk before the visit.'}
            </p>
          </div>

          {loading ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {[...Array(6)].map((_, i) => (
                <PatientCardSkeleton key={i} />
              ))}
            </div>
          ) : viewTab === 'all' && patients.length > 0 ? (
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
          ) : viewTab === 'recent' && recentPatients.length > 0 ? (
            <>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
                {recentPatients.map((patient) => (
                  <RecentPatientCard
                    key={patient.id}
                    patient={patient}
                    onClick={() => handlePatientClick(patient.id)}
                  />
                ))}
              </div>
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
                              ? 'bg-teal-600 text-white'
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
          ) : viewTab === 'flags' && flagPatients.length > 0 ? (
            <>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
                {flagPatients.map((patient) => (
                  <FlagsPatientCard
                    key={patient.id}
                    patient={patient}
                    onClick={() => handlePatientClick(patient.id)}
                  />
                ))}
              </div>
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
                              ? 'bg-amber-600 text-white'
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
            <EmptyState searchQuery={searchQuery} viewTab={viewTab} />
          )}
        </div>
      </div>
    </>
  );
}
