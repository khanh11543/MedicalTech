import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import Badge from '../../components/ui/badge/Badge';
import { useToast } from '../../hooks/useToast';
import {
  getPatientDetail,
  getPatientMedicalRecords,
  DoctorPatientDetailDTO,
  MedicalRecordSummary,
} from '../../services/doctorService';
import prescriptionService, {
  PrescriptionDTO,
} from '../../services/prescriptionService';

// ============= Icons =============
const IconArrowLeft = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
    strokeWidth={2}
  >
    <path strokeLinecap='round' strokeLinejoin='round' d='M15 19l-7-7 7-7' />
  </svg>
);

const IconPhone = ({ className }: { className?: string }) => (
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
      d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
    />
  </svg>
);

const IconEmail = ({ className }: { className?: string }) => (
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
      d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
    />
  </svg>
);

const IconCalendar = ({ className }: { className?: string }) => (
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
      d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
    />
  </svg>
);

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

const IconCheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill='currentColor' viewBox='0 0 24 24'>
    <path d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' />
  </svg>
);

const IconActivity = ({ className }: { className?: string }) => (
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
      d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    />
  </svg>
);

// ============= Helper Functions =============
function formatDate(dateStr: string | null): string {
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

// ============= Main Component =============
export default function DoctorPatientDetail() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [patient, setPatient] = useState<DoctorPatientDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'medical' | 'prescriptions' | 'appointments'
  >('overview');
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordSummary[]>([]);
  const [medRecordsLoading, setMedRecordsLoading] = useState(false);
  const [medRecordsPage, setMedRecordsPage] = useState(0);
  const [medRecordsTotalPages, setMedRecordsTotalPages] = useState(0);
  const [medRecordsTotalElements, setMedRecordsTotalElements] = useState(0);
  const [selectedMedicalRecord, setSelectedMedicalRecord] =
    useState<MedicalRecordSummary | null>(null);
  const [selectedPrescription, setSelectedPrescription] =
    useState<PrescriptionDTO | null>(null);
  const [prescriptionLoadingId, setPrescriptionLoadingId] = useState<
    number | null
  >(null);

  const previousPage = location.state?.tab || 'my-patients';

  const loadPatientDetail = useCallback(async () => {
    if (!patientId) return;

    try {
      setLoading(true);
      const data = await getPatientDetail(Number(patientId));
      setPatient(data);
    } catch (error) {
      console.error('Error loading patient details:', error);
      showToast('Failed to load patient details', 'error');
    } finally {
      setLoading(false);
    }
  }, [patientId, showToast]);

  useEffect(() => {
    loadPatientDetail();
  }, [loadPatientDetail]);

  const loadMedicalRecordsPage = useCallback(
    async (page: number) => {
      if (!patientId) return;
      try {
        setMedRecordsLoading(true);
        const data = await getPatientMedicalRecords(Number(patientId), {
          pageNumber: page,
          pageSize: 10,
        });
        setMedicalRecords(data.content);
        setMedRecordsPage(data.pageNumber);
        setMedRecordsTotalPages(data.totalPages);
        setMedRecordsTotalElements(data.totalElements);
      } catch (error) {
        console.error('Error loading patient medical records:', error);
        showToast('Failed to load medical records', 'error');
      } finally {
        setMedRecordsLoading(false);
      }
    },
    [patientId, showToast]
  );

  useEffect(() => {
    if (activeTab === 'medical') {
      loadMedicalRecordsPage(0);
    }
  }, [activeTab, loadMedicalRecordsPage]);

  const handleBack = () => {
    const backPathMap: Record<string, string> = {
      'my-patients': '/doctor/patients/my-patients',
      recent: '/doctor/patients/recent',
      flags: '/doctor/patients/chronic-allergy-flags',
      'chronic-allergy-flags': '/doctor/patients/chronic-allergy-flags',
    };
    navigate(backPathMap[previousPage] || '/doctor/patients/my-patients');
  };

  const handleViewPrescription = useCallback(
    async (prescriptionId: number) => {
      try {
        setPrescriptionLoadingId(prescriptionId);
        const detail = await prescriptionService.getPrescription(prescriptionId);
        setSelectedPrescription(detail);
      } catch (error) {
        console.error('Error loading prescription detail:', error);
        showToast('Failed to load prescription detail', 'error');
      } finally {
        setPrescriptionLoadingId(null);
      }
    },
    [showToast]
  );

  if (loading) {
    return (
      <>
        <PageMeta title='Patient Details' />
        <PageBreadcrumb pageTitle='Patient Details' />
        <div className='space-y-6'>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className='p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] animate-pulse'
            >
              <div className='space-y-4'>
                <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-32' />
                <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6' />
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (!patient) {
    return (
      <>
        <PageMeta title='Patient Not Found' />
        <PageBreadcrumb pageTitle='Patient Details' />
        <div className='flex flex-col items-center justify-center py-20'>
          <div className='w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4'>
            <IconAlertTriangle className='w-10 h-10 text-gray-400' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
            Patient not found
          </h3>
          <p className='text-sm text-gray-600 dark:text-gray-400 mb-6'>
            The patient information could not be loaded.
          </p>
          <button
            onClick={handleBack}
            className='px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors'
          >
            Go Back
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={`${patient.fullName} - Patient Details`}
        description='View comprehensive patient information'
      />
      <PageBreadcrumb pageTitle={`Patient: ${patient.fullName}`} />

      <div className='space-y-6'>
        {/* Header with Back Button */}
        <div className='flex items-center justify-between'>
          <button
            onClick={handleBack}
            className='flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
          >
            <IconArrowLeft className='w-5 h-5' />
            Back
          </button>
          <div className='text-right'>
            <p className='text-xs text-gray-600 dark:text-gray-400'>
              Patient ID: {patient.id}
            </p>
          </div>
        </div>

        {/* Patient Header Card */}
        <div className='rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] p-6'>
          <div className='flex items-start gap-6'>
            <div className='flex-shrink-0'>
              <div className='w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-bold text-white text-2xl shadow-lg'>
                {getInitials(patient.fullName)}
              </div>
            </div>
            <div className='flex-1'>
              <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                {patient.fullName}
              </h1>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mb-4'>
                <div className='flex items-center gap-2 text-gray-700 dark:text-gray-300'>
                  <IconPhone className='w-4 h-4 text-gray-500' />
                  {patient.phone}
                </div>
                <div className='flex items-center gap-2 text-gray-700 dark:text-gray-300'>
                  <IconEmail className='w-4 h-4 text-gray-500' />
                  {patient.email}
                </div>
                <div className='flex items-center gap-2 text-gray-700 dark:text-gray-300'>
                  <IconCalendar className='w-4 h-4 text-gray-500' />
                  Age: {patient.age}
                  {patient.gender ? ` • ${patient.gender}` : ''}
                </div>
                {patient.bloodGroup && (
                  <div className='flex items-center gap-2'>
                    <Badge variant='light' color='error' size='sm'>
                      Blood: {patient.bloodGroup}
                    </Badge>
                  </div>
                )}
              </div>
              {patient.address && (
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  📍 {patient.address}
                </p>
              )}
            </div>
            <div className='flex-shrink-0 text-right space-y-2'>
              <div className='px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-500/10'>
                <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                  {patient.totalVisitsWithThisDoctor}
                </div>
                <div className='text-xs text-blue-700 dark:text-blue-300'>
                  Total Visits
                </div>
              </div>
              <div className='px-4 py-2 rounded-lg bg-purple-50 dark:bg-purple-500/10'>
                <div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
                  {patient.activePrescriptions}
                </div>
                <div className='text-xs text-purple-700 dark:text-purple-300'>
                  Active Rx
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className='flex gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto'>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'medical', label: 'Medical Records' },
            { id: 'prescriptions', label: 'Prescriptions' },
            { id: 'appointments', label: 'Appointments' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(
                  tab.id as
                    | 'overview'
                    | 'medical'
                    | 'prescriptions'
                    | 'appointments'
                )
              }
              className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className='space-y-6'>
            {/* Clinical Information */}
            {(patient.allergyList.length > 0 ||
              patient.chronicConditionsList.length > 0) && (
              <div className='rounded-xl border border-red-200 dark:border-red-600 bg-red-50 dark:bg-red-500/10 p-6'>
                <h3 className='text-lg font-bold text-red-900 dark:text-red-200 mb-4 flex items-center gap-2'>
                  <IconAlertTriangle className='w-6 h-6' />
                  Clinical Flags
                </h3>
                <div className='space-y-4'>
                  {patient.allergyList.length > 0 && (
                    <div>
                      <p className='text-sm font-semibold text-red-700 dark:text-red-300 mb-2'>
                        ⚠️ Allergies
                      </p>
                      <div className='flex flex-wrap gap-2'>
                        {patient.allergyList.map((allergy, idx) => (
                          <Badge
                            key={idx}
                            variant='light'
                            color='error'
                            size='sm'
                          >
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {patient.chronicConditionsList.length > 0 && (
                    <div>
                      <p className='text-sm font-semibold text-orange-700 dark:text-orange-300 mb-2'>
                        Chronic Conditions
                      </p>
                      <div className='flex flex-wrap gap-2'>
                        {patient.chronicConditionsList.map((condition, idx) => (
                          <Badge
                            key={idx}
                            variant='light'
                            color='warning'
                            size='sm'
                          >
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Visit Summary */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] p-6'>
                <h4 className='font-semibold text-gray-900 dark:text-white mb-4'>
                  Visit History
                </h4>
                <div className='space-y-3 text-sm'>
                  <div>
                    <p className='text-gray-600 dark:text-gray-400'>
                      First Visit
                    </p>
                    <p className='font-medium text-gray-900 dark:text-white'>
                      {formatDate(patient.firstVisitDate)}
                    </p>
                  </div>
                  <div>
                    <p className='text-gray-600 dark:text-gray-400'>
                      Last Visit
                    </p>
                    <p className='font-medium text-gray-900 dark:text-white'>
                      {formatDate(patient.lastVisitDate)}
                    </p>
                  </div>
                  {patient.lastVisitReason && (
                    <div>
                      <p className='text-gray-600 dark:text-gray-400'>Reason</p>
                      <p className='font-medium text-gray-900 dark:text-white'>
                        {patient.lastVisitReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className='rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] p-6'>
                <h4 className='font-semibold text-gray-900 dark:text-white mb-4'>
                  Contact Information
                </h4>
                <div className='space-y-3 text-sm'>
                  <div>
                    <p className='text-gray-600 dark:text-gray-400'>Email</p>
                    <p className='font-medium text-gray-900 dark:text-white'>
                      {patient.email}
                    </p>
                  </div>
                  <div>
                    <p className='text-gray-600 dark:text-gray-400'>Phone</p>
                    <p className='font-medium text-gray-900 dark:text-white'>
                      {patient.phone}
                    </p>
                  </div>
                  {patient.emergencyContact && (
                    <div>
                      <p className='text-gray-600 dark:text-gray-400'>
                        Emergency Contact
                      </p>
                      <p className='font-medium text-gray-900 dark:text-white'>
                        {patient.emergencyContact}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            {patient.insuranceNumber && (
              <div className='rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] p-6'>
                <h4 className='font-semibold text-gray-900 dark:text-white mb-4'>
                  Insurance
                </h4>
                <p className='text-gray-700 dark:text-gray-300'>
                  {patient.insuranceNumber}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'medical' && (
          <div className='space-y-4'>
            {/* Header with count */}
            <div className='flex items-center justify-between'>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                {medRecordsTotalElements > 0
                  ? `${medRecordsTotalElements} record${medRecordsTotalElements !== 1 ? 's' : ''} found`
                  : ''}
              </p>
            </div>

            {medRecordsLoading ? (
              <div className='space-y-4'>
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className='p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] animate-pulse'
                  >
                    <div className='space-y-3'>
                      <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-32' />
                      <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4' />
                      <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2' />
                    </div>
                  </div>
                ))}
              </div>
            ) : medicalRecords.length > 0 ? (
              <>
                {medicalRecords.map((record) => (
                  <div
                    key={record.id}
                    className='rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] p-6 hover:shadow-lg transition-shadow'
                  >
                    <div className='flex items-start justify-between mb-4 gap-3'>
                      <div className='flex items-center gap-2'>
                        <IconActivity className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                        <div>
                          <h4 className='font-semibold text-gray-900 dark:text-white'>
                            {formatDate(record.visitDate)}
                          </h4>
                        </div>
                      </div>
                      <button
                        type='button'
                        onClick={() => setSelectedMedicalRecord(record)}
                        className='px-3 py-1.5 text-xs font-medium rounded bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40'
                      >
                        View
                      </button>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {record.chiefComplaint && (
                        <div>
                          <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1'>
                            Chief Complaint
                          </p>
                          <p className='text-sm text-gray-700 dark:text-gray-300'>
                            {record.chiefComplaint}
                          </p>
                        </div>
                      )}
                      {record.diagnosis && (
                        <div>
                          <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1'>
                            Diagnosis
                          </p>
                          <p className='text-sm text-gray-700 dark:text-gray-300'>
                            {record.diagnosis}
                          </p>
                        </div>
                      )}
                      {record.treatmentPlan && (
                        <div>
                          <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1'>
                            Treatment Plan
                          </p>
                          <p className='text-sm text-gray-700 dark:text-gray-300'>
                            {record.treatmentPlan}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {medRecordsTotalPages > 1 && (
                  <div className='flex items-center justify-center gap-2'>
                    <button
                      onClick={() => loadMedicalRecordsPage(medRecordsPage - 1)}
                      disabled={medRecordsPage === 0 || medRecordsLoading}
                      className='px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
                    >
                      Previous
                    </button>
                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                      Page {medRecordsPage + 1} / {medRecordsTotalPages}
                    </span>
                    <button
                      onClick={() => loadMedicalRecordsPage(medRecordsPage + 1)}
                      disabled={medRecordsPage >= medRecordsTotalPages - 1 || medRecordsLoading}
                      className='px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className='text-center py-12'>
                <IconActivity className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-600 dark:text-gray-400'>
                  No medical records available
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className='space-y-4'>
            {patient.recentPrescriptions.length > 0 ? (
              patient.recentPrescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className='rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] p-6 hover:shadow-lg transition-shadow'
                >
                  <div className='flex items-start justify-between mb-3'>
                    <div>
                      <h4 className='font-semibold text-gray-900 dark:text-white'>
                        {prescription.prescriptionCode}
                      </h4>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>
                        {formatDate(prescription.prescriptionDate)}
                      </p>
                    </div>
                    <Badge
                      variant='light'
                      color={
                        prescription.status.toUpperCase() === 'ACTIVE'
                          ? 'success'
                          : prescription.status.toUpperCase() === 'EXPIRED'
                            ? 'error'
                            : 'info'
                      }
                      size='sm'
                    >
                      {prescription.status}
                    </Badge>
                  </div>
                  {prescription.diagnosis && (
                    <p className='text-sm text-gray-700 dark:text-gray-300'>
                      <span className='font-medium'>Diagnosis:</span>{' '}
                      {prescription.diagnosis}
                    </p>
                  )}
                  <div className='mt-4 flex justify-end'>
                    <button
                      type='button'
                      onClick={() => handleViewPrescription(prescription.id)}
                      disabled={prescriptionLoadingId === prescription.id}
                      className='px-3 py-1.5 text-xs font-medium rounded bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {prescriptionLoadingId === prescription.id
                        ? 'Loading...'
                        : 'View'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className='text-center py-12'>
                <IconAlertTriangle className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-600 dark:text-gray-400'>
                  No prescriptions available
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className='space-y-4'>
            {patient.upcomingAppointments.length > 0 ? (
              patient.upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className='rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] p-6 hover:shadow-lg transition-shadow'
                >
                  <div className='flex items-start justify-between mb-3'>
                    <div>
                      <h4 className='font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
                        <IconCheckCircle className='w-5 h-5 text-green-600 dark:text-green-400' />
                        {appointment.appointmentCode}
                      </h4>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>
                        {formatDate(appointment.appointmentDate)}
                      </p>
                    </div>
                    <Badge
                      variant='light'
                      color={
                        appointment.status.toUpperCase() === 'SCHEDULED'
                          ? 'info'
                          : 'success'
                      }
                      size='sm'
                    >
                      {appointment.status}
                    </Badge>
                  </div>
                  <div className='space-y-2 text-sm'>
                    {appointment.appointmentType && (
                      <p>
                        <span className='font-medium text-gray-600 dark:text-gray-400'>
                          Type:
                        </span>{' '}
                        <span className='text-gray-700 dark:text-gray-300'>
                          {appointment.appointmentType}
                        </span>
                      </p>
                    )}
                    {appointment.reasonForVisit && (
                      <p>
                        <span className='font-medium text-gray-600 dark:text-gray-400'>
                          Reason:
                        </span>{' '}
                        <span className='text-gray-700 dark:text-gray-300'>
                          {appointment.reasonForVisit}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className='text-center py-12'>
                <IconCalendar className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-600 dark:text-gray-400'>
                  No upcoming appointments
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      {selectedPrescription && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
            <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'>
              <div>
                <h3 className='text-lg font-semibold text-gray-800 dark:text-white'>
                  Prescription Detail
                </h3>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  {selectedPrescription.prescriptionCode ||
                    `PRE-${selectedPrescription.id}`}
                </p>
              </div>
              <button
                type='button'
                onClick={() => setSelectedPrescription(null)}
                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none'
              >
                ×
              </button>
            </div>

            <div className='px-6 py-4 space-y-4'>
              <div className='flex items-center gap-3'>
                <span className='text-xs text-gray-500 dark:text-gray-400'>
                  Date: {formatDate(selectedPrescription.prescriptionDate)}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedPrescription.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {selectedPrescription.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              {selectedPrescription.diagnosis && (
                <div>
                  <p className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1'>
                    Diagnosis
                  </p>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    {selectedPrescription.diagnosis}
                  </p>
                </div>
              )}

              <div>
                <p className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2'>
                  Medications ({selectedPrescription.items?.length || 0})
                </p>
                <div className='space-y-2'>
                  {(selectedPrescription.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      className='rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800'
                    >
                      <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                        {idx + 1}. {item.medicineName}
                      </p>
                      <p className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                        {item.dosage} • {item.frequency}
                        {item.duration ? ` • ${item.duration}` : ''}
                        {item.quantity ? ` • Qty: ${item.quantity}` : ''}
                        {item.unit ? ` ${item.unit}` : ''}
                      </p>
                      {item.instructions && (
                        <p className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                          Instructions: {item.instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedPrescription.notes && (
                <div>
                  <p className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1'>
                    Notes
                  </p>
                  <p className='text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
                    {selectedPrescription.notes}
                  </p>
                </div>
              )}

              {selectedPrescription.followUpDate && (
                <div>
                  <p className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1'>
                    Follow-up Date
                  </p>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    {formatDate(selectedPrescription.followUpDate)}
                  </p>
                </div>
              )}
            </div>
            <div className='px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end'>
              <button
                type='button'
                onClick={() => setSelectedPrescription(null)}
                className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedMedicalRecord && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto'>
            <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'>
              <div>
                <h3 className='text-lg font-semibold text-gray-800 dark:text-white'>
                  Medical Record Detail
                </h3>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Visit date: {formatDate(selectedMedicalRecord.visitDate)}
                </p>
              </div>
              <button
                type='button'
                onClick={() => setSelectedMedicalRecord(null)}
                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none'
              >
                ×
              </button>
            </div>
            <div className='px-6 py-5 space-y-5'>
              <div>
                <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1'>
                  Health History
                </p>
                <p className='text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
                  {selectedMedicalRecord.healthHistory || 'No health history'}
                </p>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1'>
                    Chief Complaint
                  </p>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    {selectedMedicalRecord.chiefComplaint || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1'>
                    Present Illness
                  </p>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    {selectedMedicalRecord.presentIllness || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1'>
                    Diagnosis
                  </p>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    {selectedMedicalRecord.diagnosis || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1'>
                    Treatment Plan
                  </p>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    {selectedMedicalRecord.treatmentPlan || 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1'>
                  Physical Exam
                </p>
                <p className='text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
                  {selectedMedicalRecord.physicalExam || 'N/A'}
                </p>
              </div>
              <div>
                <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1'>
                  Vital Signs
                </p>
                <pre className='text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap'>
                  {selectedMedicalRecord.vitalSigns
                    ? JSON.stringify(selectedMedicalRecord.vitalSigns, null, 2)
                    : 'No vital signs'}
                </pre>
              </div>
              <div>
                <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1'>
                  Lab Results
                </p>
                <pre className='text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap'>
                  {selectedMedicalRecord.labResults
                    ? JSON.stringify(selectedMedicalRecord.labResults, null, 2)
                    : 'No lab results'}
                </pre>
              </div>
              <div>
                <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1'>
                  Follow-up Notes
                </p>
                <p className='text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
                  {selectedMedicalRecord.followUpNotes || 'N/A'}
                </p>
              </div>
            </div>
            <div className='px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end'>
              <button
                type='button'
                onClick={() => setSelectedMedicalRecord(null)}
                className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
