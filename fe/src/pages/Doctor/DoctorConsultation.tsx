import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ConsultationForm from '../../components/forms/ConsultationForm';
import appointmentService, {
  AppointmentDTO,
  AppointmentStatus,
} from '../../services/appointmentService';
import consultationService, {
  ConsultationRecord,
} from '../../services/consultationService';
import { useToast } from '../../hooks/useToast';

type ViewMode = 'selector' | 'drafts' | 'form' | 'direct-access-info';

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
  const { showToast } = useToast();
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
  const [draftConsultations, setDraftConsultations] = useState<
    ConsultationRecord[]
  >([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);

  // Load drafts on mount
  useEffect(() => {
    loadDraftConsultations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDraftConsultations = async () => {
    setLoadingDrafts(true);
    try {
      const drafts = await consultationService.getDraftConsultations();
      setDraftConsultations(drafts);
      if (drafts.length > 0) {
        showToast(`✅ Loaded ${drafts.length} draft(s)`, 'success');
      }
    } catch (error) {
      console.error('Error loading draft consultations:', error);
      showToast(
        '❌ Failed to load drafts: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
        'error'
      );
    } finally {
      setLoadingDrafts(false);
    }
  };

  const handleSelectAppointment = (appointmentId: number) => {
    showToast('📋 Loading appointment details...', 'info');
    setSelectedItem({ appointmentId });
    setViewMode('form');
  };

  const handleSelectDraft = (draftId: string) => {
    showToast('📝 Loading draft consultation...', 'info');
    setSelectedItem({ draftId });
    setViewMode('form');
  };

  const handleDraftSaved = () => {
    // Reload drafts after saving
    loadDraftConsultations();
  };

  const handleBack = () => {
    setSelectedItem(null);
    // If accessed from DoctorToday, go back to direct access info instead of selector
    if (locationState?.fromDoctorToday) {
      setViewMode('direct-access-info');
    } else {
      setViewMode('selector');
    }
    loadDraftConsultations(); // Reload drafts in case one was finalized
  };

  const handleViewDrafts = () => {
    showToast('📄 Loading draft consultations...', 'info');
    setViewMode('drafts');
  };

  const handleGoToSelector = () => {
    setSelectedItem(null);
    setViewMode('selector');
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
          <DirectAccessInfo onGoToSelector={handleGoToSelector} />
        ) : viewMode === 'form' && selectedItem ? (
          <ConsultationForm
            appointmentId={selectedItem.appointmentId}
            draftId={selectedItem.draftId}
            onBack={handleBack}
            onDraftSaved={handleDraftSaved}
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
        ) : viewMode === 'drafts' ? (
          <DraftConsultationsList
            drafts={draftConsultations}
            loading={loadingDrafts}
            onSelectDraft={handleSelectDraft}
            onBack={() => {
              if (locationState?.fromDoctorToday) {
                setViewMode('direct-access-info');
              } else {
                setViewMode('selector');
              }
            }}
            onDraftFinalized={loadDraftConsultations}
          />
        ) : (
          <AppointmentSelector
            onSelect={handleSelectAppointment}
            onViewDrafts={handleViewDrafts}
            draftCount={draftConsultations.length}
          />
        )}
      </div>
    </>
  );
}

// Appointment selector component
function AppointmentSelector({
  onSelect,
  onViewDrafts,
  draftCount,
}: {
  onSelect: (appointmentId: number) => void;
  onViewDrafts: () => void;
  draftCount: number;
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

  const handleViewDraftsClick = () => {
    showToast('📄 Opening draft consultations...', 'info');
    onViewDrafts();
  };

  const handleSelectAppointment = (
    appointmentId: number,
    patientName: string
  ) => {
    showToast(`👤 Starting consultation for ${patientName}...`, 'info');
    onSelect(appointmentId);
  };

  return (
    <div className='p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
          Start New Consultation
        </h2>
        {draftCount > 0 && (
          <button
            onClick={handleViewDraftsClick}
            className='inline-flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50'
          >
            <span className='inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-600 text-xs font-bold text-white dark:bg-amber-500'>
              {draftCount}
            </span>
            View Drafts
          </button>
        )}
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

// Draft consultations list component
function DraftConsultationsList({
  drafts,
  loading,
  onSelectDraft,
  onBack,
  onDraftFinalized,
}: {
  drafts: ConsultationRecord[];
  loading: boolean;
  onSelectDraft: (draftId: string) => void;
  onBack: () => void;
  onDraftFinalized: () => void;
}) {
  const { showToast } = useToast();
  const [finalizing, setFinalizing] = useState<string | null>(null);

  const handleFinalizeDraft = async (draft: ConsultationRecord) => {
    if (!draft.id) return;

    setFinalizing(draft.id);
    showToast('🔒 Finalizing consultation draft...', 'info');
    try {
      await consultationService.finalize(draft);
      showToast('✅ Consultation finalized successfully', 'success');
      onDraftFinalized();
    } catch (error) {
      console.error('Error finalizing consultation:', error);
      showToast(
        '❌ Failed to finalize: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
        'error'
      );
    } finally {
      setFinalizing(null);
    }
  };

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

  const handleBackClick = () => {
    showToast('⬅️ Going back to appointment list...', 'info');
    onBack();
  };

  const handleEditDraft = (draftId: string) => {
    showToast('✏️ Opening draft for editing...', 'info');
    onSelectDraft(draftId);
  };

  return (
    <div className='p-6'>
      <div className='mb-6 flex items-center gap-4'>
        <button
          onClick={handleBackClick}
          className='inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        >
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M15 19l-7-7 7-7'
            />
          </svg>
          Back
        </button>
        <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
          Draft Consultations ({drafts.length})
        </h2>
      </div>

      {drafts.length === 0 ? (
        <div className='p-8 text-center'>
          <p className='text-gray-600 dark:text-gray-400'>
            No draft consultations found
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className='rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/50'
            >
              <div className='flex items-start justify-between gap-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-2'>
                    <h3 className='text-base font-medium text-gray-900 dark:text-white'>
                      Draft #{draft.id?.substring(0, 8)}...
                    </h3>
                    <span className='inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'>
                      {draft.status}
                    </span>
                  </div>
                  <div className='space-y-1'>
                    <p className='text-sm text-gray-700 dark:text-gray-300'>
                      <span className='font-medium'>Chief Complaint:</span>{' '}
                      {draft.chiefComplaint || 'Not filled'}
                    </p>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      <span className='font-medium'>Last Saved:</span>{' '}
                      {new Date(draft.lastSavedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className='flex flex-col gap-2'>
                  <button
                    onClick={() => handleEditDraft(draft.id!)}
                    className='rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleFinalizeDraft(draft)}
                    disabled={finalizing === draft.id}
                    className='rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-600 dark:hover:bg-green-700'
                  >
                    {finalizing === draft.id ? 'Finalizing...' : 'Finalize'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Direct access info component (shown when page is opened directly)
function DirectAccessInfo({ onGoToSelector }: { onGoToSelector: () => void }) {
  const { showToast } = useToast();

  const handleGoToSelector = () => {
    showToast('📋 Opening appointment selector...', 'info');
    onGoToSelector();
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
