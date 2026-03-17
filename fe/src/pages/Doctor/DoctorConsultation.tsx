import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import Toast from '../../components/common/Toast';
import ConsultationForm from '../../components/forms/ConsultationForm';
import appointmentService, {
  AppointmentDTO,
  AppointmentStatus,
} from '../../services/appointmentService';
import { useToast } from '../../hooks/useToast';

type ViewMode = 'selector' | 'form' | 'direct-access-info';

interface SelectedItem {
  appointmentId?: number;
  draftId?: string;
}

interface LocationState {
  fromDoctorToday?: boolean;
  appointmentId?: number;
  appointmentCode?: string;
  patientName?: string;
  queueNumber?: number;
  age?: number | null;
  gender?: string | null;
  reasonForVisit?: string | null;
  allergies?: string | null;
  medicalHistory?: string | null;
}

export default function DoctorConsultation() {
  const navigate = useNavigate();
  const { toast, showToast, dismissToast } = useToast();
  const location = useLocation();
  const locationState = location.state as LocationState | null;

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // If coming from DoctorToday, skip the selector and show the form
    if (locationState?.fromDoctorToday) {
      return 'form';
    }
    // Otherwise, check if opened directly
    return 'direct-access-info';
  });
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(() => {
    // If coming from DoctorToday, pre-select the appointment
    if (locationState?.fromDoctorToday && locationState?.appointmentId) {
      return { appointmentId: locationState.appointmentId };
    }
    return null;
  });

  const handleSelectAppointment = (appointmentId: number) => {
    showToast('📋 Loading appointment details...', 'info');
    setSelectedItem({ appointmentId });
    setViewMode('form');
  };

  const handleBack = () => {
    setSelectedItem(null);
    // If accessed from DoctorToday, go back to direct access info instead of selector
    if (locationState?.fromDoctorToday) {
      setViewMode('direct-access-info');
    } else {
      setViewMode('selector');
    }
  };

  return (
    <>
      <PageMeta
        title='Consultation | Doctor Panel'
        description='Doctor Consultation Workspace'
      />
      <PageBreadcrumb pageTitle='Doctor Consultation' />

      <div className='rounded-lg bg-white shadow-md dark:bg-gray-800'>
        {viewMode === 'direct-access-info' ? (
          <DirectAccessInfo
            onNavigateToDoctorToday={() => navigate('/doctor/today')}
          />
        ) : viewMode === 'form' && selectedItem ? (
          <ConsultationForm
            appointmentId={selectedItem.appointmentId}
            onBack={handleBack}
            patientInfo={
              locationState?.fromDoctorToday
                ? {
                    appointmentCode: locationState.appointmentCode,
                    patientName: locationState.patientName,
                    queueNumber: locationState.queueNumber,
                    age: locationState.age,
                    gender: locationState.gender,
                    reasonForVisit: locationState.reasonForVisit,
                    allergies: locationState.allergies,
                    medicalHistory: locationState.medicalHistory,
                  }
                : undefined
            }
          />
        ) : (
          <AppointmentSelector onSelect={handleSelectAppointment} />
        )}
      </div>
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}

// Appointment selector component
function AppointmentSelector({
  onSelect,
}: {
  onSelect: (appointmentId: number) => void;
}) {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCheckedInAppointments = async () => {
      setLoading(true);
      showToast('📋 Loading appointments...', 'info');
      try {
        const response = await appointmentService.getDoctorAppointments({
          status: AppointmentStatus.CHECKED_IN,
          pageNumber: 0,
          pageSize: 50,
        });
        setAppointments(response.content);

        if (response.content.length === 0) {
          showToast('ℹ️ No checked-in appointments found', 'info');
        } else {
          showToast(
            `✅ Loaded ${response.content.length} appointment(s)`,
            'success'
          );
        }
      } catch (error) {
        console.error('Error loading appointments:', error);
        showToast(
          '❌ Failed to load appointments: ' +
            (error instanceof Error ? error.message : 'Unknown error'),
          'error'
        );
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    loadCheckedInAppointments();
  }, [showToast]);

  if (loading) {
    return (
      <div className='p-8 text-center'>
        <div className='inline-block animate-spin'>
          <svg
            className='h-8 w-8 text-brand-500'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            ></circle>
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            ></path>
          </svg>
        </div>
      </div>
    );
  }

  const handleSelectAppointment = (
    appointmentId: number,
    patientName: string
  ) => {
    showToast(`👤 Starting consultation for ${patientName}...`, 'info');
    onSelect(appointmentId);
  };

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
          Start New Consultation
        </h2>
      </div>

      {appointments.length === 0 ? (
        <div className='p-8 text-center'>
          <p className='text-gray-600 dark:text-gray-400'>
            No checked-in appointments available for consultation
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className='flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-brand-500 hover:bg-white dark:border-gray-700 dark:bg-gray-700/50 dark:hover:bg-gray-700'
            >
              <div className='flex-1'>
                <div className='flex items-center gap-3 mb-2'>
                  <h3 className='text-base font-medium text-gray-900 dark:text-white'>
                    {apt.patientName}
                  </h3>
                  <span className='inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'>
                    {apt.status}
                  </span>
                </div>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  {apt.appointmentDate} {apt.startTime} - {apt.endTime} •{' '}
                  {apt.reasonForVisit}
                </p>
                <p className='mt-1 text-xs text-gray-500 dark:text-gray-500'>
                  {apt.patientPhone} • {apt.patientEmail}
                </p>
              </div>
              <button
                onClick={() => handleSelectAppointment(apt.id, apt.patientName)}
                className='ml-4 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700'
              >
                Start Consultation
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Direct access info component (shown when page is opened directly)
function DirectAccessInfo({
  onNavigateToDoctorToday,
}: {
  onNavigateToDoctorToday: () => void;
}) {
  const { showToast } = useToast();

  const handleGoToSelector = () => {
    showToast('📋 Opening Today page...', 'info');
    onNavigateToDoctorToday();
  };

  return (
    <div className='p-8'>
      <div className='max-w-md mx-auto'>
        <div className='rounded-lg border-2 border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-900/20'>
          {/* Icon */}
          <div className='mb-4 flex justify-center'>
            <svg
              className='h-12 w-12 text-blue-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className='mb-2 text-center text-lg font-semibold text-gray-900 dark:text-white'>
            Quick Access Not Available
          </h2>

          {/* Message */}
          <p className='mb-6 text-center text-sm text-gray-700 dark:text-gray-300'>
            To start a consultation, please go to the <strong>"Today"</strong>{' '}
            page and click the <strong>"Open Consultation Notes"</strong> button
            on the current patient's card.
          </p>

          {/* Instructions */}
          <div className='mb-6 rounded-lg bg-white p-4 dark:bg-gray-800'>
            <h3 className='mb-3 text-sm font-medium text-gray-900 dark:text-white'>
              Steps:
            </h3>
            <ol className='space-y-2 text-sm text-gray-700 dark:text-gray-300'>
              <li className='flex gap-2'>
                <span className='flex-shrink-0 font-semibold text-blue-500'>
                  1
                </span>
                <span>
                  Go to the <strong>Today</strong> page from the sidebar
                </span>
              </li>
              <li className='flex gap-2'>
                <span className='flex-shrink-0 font-semibold text-blue-500'>
                  2
                </span>
                <span>
                  Check the <strong>Current Patient</strong> card
                </span>
              </li>
              <li className='flex gap-2'>
                <span className='flex-shrink-0 font-semibold text-blue-500'>
                  3
                </span>
                <span>
                  Click <strong>"Open Consultation Notes"</strong> button
                </span>
              </li>
            </ol>
          </div>

          {/* Alternative option */}
          <div className='space-y-3'>
            <p className='text-center text-xs text-gray-600 dark:text-gray-400'>
              Or select from existing appointments:
            </p>
            <button
              onClick={handleGoToSelector}
              className='w-full rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
            >
              Select Appointment Manually
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
