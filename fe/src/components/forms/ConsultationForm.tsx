import { useState, useEffect, useCallback } from 'react';
import InputField from '../form/input/InputField';
import TextArea from '../form/input/TextArea';
import Label from '../form/Label';
import Button from '../ui/button/Button';
import { useToast } from '../../hooks/useToast';
import consultationService, {
  ConsultationRecord,
} from '../../services/consultationService';

interface PatientInfo {
  appointmentCode?: string;
  patientName?: string;
  queueNumber?: number;
  age?: number | null;
  gender?: string | null;
  reasonForVisit?: string | null;
  allergies?: string | null;
  medicalHistory?: string | null;
}

interface ConsultationFormProps {
  appointmentId?: number;
  draftId?: string;
  onBack: () => void;
  onDraftSaved?: () => void;
  patientInfo?: PatientInfo;
}

export default function ConsultationForm({
  appointmentId,
  draftId,
  onBack,
  onDraftSaved,
  patientInfo,
}: ConsultationFormProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tabActive, setTabActive] = useState<'examination' | 'amendments'>(
    'examination'
  );
  const [formData, setFormData] = useState<ConsultationRecord>({
    appointmentId: appointmentId || 0,
    status: 'DRAFT',
    chiefComplaint: '',
    hpi: '',
    vitals: {
      temperature: null,
      systolic: null,
      diastolic: null,
      heartRate: null,
      respiratoryRate: null,
      height: null,
      weight: null,
      bmi: null,
    },
    physicalExam: '',
    diagnosis: '',
    diagnosticCode: '',
    plan: '',
    followUpInstructions: '',
    attachments: [],
    lastSavedAt: new Date().toISOString(),
  });

  const [amendments, setAmendments] = useState<
    Array<{
      id: string;
      content: string;
      createdAt: string;
      signedAt?: string;
    }>
  >([]);

  const [newAmendment, setNewAmendment] = useState('');
  const [showAmendmentModal, setShowAmendmentModal] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);

  useEffect(() => {
    const loadConsultation = async () => {
      // If no appointmentId and no draftId, we can't load anything
      if (!appointmentId && !draftId) {
        return;
      }

      setLoading(true);
      try {
        let consultation: ConsultationRecord;

        if (draftId) {
          // Load draft consultation if draftId is provided
          // In backend, we would need to get consultation by ID
          // For now, we'll use the appointmentId from the draft
          // This would require a backend change to support fetching by draftId
          showToast('Loading draft consultation...', 'info');
          // TODO: Implement getConsultationById in backend
        } else if (appointmentId) {
          // Load by appointment ID
          showToast('Loading consultation data...', 'info');
          consultation =
            await consultationService.getConsultation(appointmentId);
          setFormData(consultation);
          setIsFinalized(consultation.status === 'FINALIZED');
          showToast('Consultation loaded successfully', 'success');

          if (consultation.status === 'FINALIZED') {
            const amendments =
              await consultationService.getAmendments(appointmentId);
            setAmendments(amendments);
          }
        }
      } catch (error) {
        console.error('Failed to load consultation:', error);

        // Check if it's a "not found" error (404) - this is expected for new consultations
        const isNotFound =
          error instanceof Error && error.message?.includes('404');

        if (isNotFound) {
          showToast('📝 Creating new consultation draft...', 'info');
          // Initialize with empty draft if no existing consultation
          const newDraft: ConsultationRecord = {
            appointmentId: appointmentId || 0,
            status: 'DRAFT',
            chiefComplaint: '',
            hpi: '',
            vitals: {
              temperature: null,
              systolic: null,
              diastolic: null,
              heartRate: null,
              respiratoryRate: null,
              height: null,
              weight: null,
              bmi: null,
            },
            physicalExam: '',
            diagnosis: '',
            diagnosticCode: '',
            plan: '',
            followUpInstructions: '',
            attachments: [],
            lastSavedAt: new Date().toISOString(),
          };

          setFormData(newDraft);

          // Auto-save the draft to backend so it exists for finalize operation
          try {
            showToast('💾 Auto-saving draft to server...', 'info');
            const savedDraft = await consultationService.saveDraft(newDraft);
            setFormData(savedDraft);
            showToast('✅ Consultation draft created and saved', 'success');
          } catch (saveError) {
            console.error('Failed to auto-save draft:', saveError);
            showToast(
              '⚠️ Draft created locally but failed to sync with server: ' +
                (saveError instanceof Error
                  ? saveError.message
                  : 'Unknown error') +
                '. Please save manually.',
              'info'
            );
          }
        } else {
          showToast(
            '❌ Failed to load consultation: ' +
              (error instanceof Error ? error.message : 'Unknown error'),
            'error'
          );
          // Initialize with empty draft
          setFormData((prev) => ({
            ...prev,
            appointmentId: appointmentId || 0,
            lastSavedAt: new Date().toISOString(),
          }));
        }
      } finally {
        setLoading(false);
      }
    };

    loadConsultation();
  }, [appointmentId, draftId, showToast]);

  const handleSaveDraftCallback = useCallback(async () => {
    if (formData.status === 'DRAFT' && !isFinalized) {
      setSaving(true);
      try {
        const savedConsultation = await consultationService.saveDraft(formData);
        setFormData(savedConsultation);
        // Silent success for auto-save - only show on errors to avoid notification spam
      } catch (error) {
        console.error('Failed to auto-save draft:', error);
        showToast(
          '⚠️ Failed to auto-save draft: ' +
            (error instanceof Error ? error.message : 'Unknown error'),
          'error'
        );
      } finally {
        setSaving(false);
      }
    }
  }, [isFinalized, formData, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSaveDraftCallback();
    }, 3000);

    return () => clearTimeout(timer);
  }, [handleSaveDraftCallback]);

  const handleSaveDraft = async () => {
    if (isFinalized) {
      showToast('Record is finalized and cannot be edited directly', 'info');
      return;
    }

    setSaving(true);
    showToast('💾 Saving draft...', 'info');
    try {
      const savedConsultation = await consultationService.saveDraft(formData);
      setFormData(savedConsultation);
      showToast(
        '✅ Draft saved successfully at ' + new Date().toLocaleTimeString(),
        'success'
      );
      // Call the callback to notify parent component
      onDraftSaved?.();
    } catch (error) {
      console.error('Error saving draft:', error);
      showToast(
        '❌ Failed to save draft: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!formData.chiefComplaint.trim()) {
      showToast('❌ Please enter Chief Complaint', 'error');
      return;
    }

    if (Object.values(formData.vitals).every((v) => v === null)) {
      showToast('❌ Please enter at least one vital sign', 'error');
      return;
    }

    if (!formData.diagnosis.trim()) {
      showToast('❌ Please enter Diagnosis', 'error');
      return;
    }

    setSaving(true);
    showToast('🔒 Finalizing consultation...', 'info');
    try {
      console.log('Attempting to finalize consultation:', formData);
      const finalizedConsultation =
        await consultationService.finalize(formData);
      console.log('Finalization successful:', finalizedConsultation);
      setFormData(finalizedConsultation);
      setIsFinalized(true);
      showToast(
        '✅ Consultation finalized and appointment approved',
        'success'
      );
      // Notify parent component
      onDraftSaved?.();
      // Return to previous view
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (error) {
      console.error('Error finalizing record - full error object:', error);

      // Extract detailed error message from various possible error formats
      let errorMessage = 'Unknown error occurred';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const axiosError = error as {
          response?: {
            data?: {
              message?: string;
              error?: string;
              statusText?: string;
              status?: number;
            };
            statusText?: string;
          };
          message?: string;
        };

        // Check for axios error response
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        } else if (axiosError.response?.statusText) {
          errorMessage = `${axiosError.response.status} - ${axiosError.response.statusText}`;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }

        console.error('Detailed error response:', axiosError.response);
      }

      showToast(
        `❌ Failed to finalize record: ${errorMessage}. Please ensure the draft was saved and try again.`,
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
    showToast('Printing summary...', 'info');
  };

  const handleAddAmendment = async () => {
    if (!newAmendment.trim()) {
      showToast('❌ Please enter amendment content', 'error');
      return;
    }

    if (!appointmentId) {
      showToast('❌ Appointment not found', 'error');
      return;
    }

    setSaving(true);
    showToast('📝 Adding amendment...', 'info');
    try {
      const amendment = await consultationService.addAmendment(
        appointmentId,
        newAmendment
      );
      setAmendments((prev) => [...prev, amendment]);
      setNewAmendment('');
      setShowAmendmentModal(false);
      showToast('✅ Amendment added successfully', 'success');
    } catch (error) {
      console.error('Error adding amendment:', error);
      showToast(
        '❌ Failed to add amendment: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSignAmendment = async (amendmentId: string) => {
    if (!appointmentId) {
      showToast('❌ Appointment not found', 'error');
      return;
    }

    setSaving(true);
    showToast('✍️ Signing amendment...', 'info');
    try {
      const signedAmendment = await consultationService.signAmendment(
        appointmentId,
        amendmentId
      );
      setAmendments((prev) =>
        prev.map((a) =>
          a.id === amendmentId
            ? { ...a, signedAt: signedAmendment.signedAt }
            : a
        )
      );
      showToast('✅ Amendment signed successfully', 'success');
    } catch (error) {
      console.error('Error signing amendment:', error);
      showToast(
        '❌ Failed to sign amendment: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: string | number | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVitalChange = (vital: string, value: number | null) => {
    const updatedVitals = { ...formData.vitals, [vital]: value };

    if (vital === 'height' || vital === 'weight') {
      if (updatedVitals.height && updatedVitals.weight) {
        const heightInMeters = updatedVitals.height / 100;
        updatedVitals.bmi =
          Math.round(
            (updatedVitals.weight / (heightInMeters * heightInMeters)) * 10
          ) / 10;
      }
    }

    setFormData((prev) => ({
      ...prev,
      vitals: updatedVitals,
    }));
  };

  const calculateBMICategory = (bmi: number | null) => {
    if (!bmi) return '';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (!appointmentId) {
      showToast('❌ Appointment not found', 'error');
      return;
    }

    setSaving(true);
    showToast(`📤 Uploading ${files.length} file(s)...`, 'info');
    try {
      for (const file of Array.from(files)) {
        const attachment = await consultationService.uploadAttachment(
          appointmentId,
          file
        );
        setFormData((prev) => ({
          ...prev,
          attachments: [...prev.attachments, attachment],
        }));
      }
      showToast(`✅ ${files.length} file(s) uploaded successfully`, 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast(
        '❌ Failed to upload file(s): ' +
          (error instanceof Error ? error.message : 'Unknown error'),
        'error'
      );
    } finally {
      setSaving(false);
      // Reset the input
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!appointmentId) {
      showToast('❌ Appointment not found', 'error');
      return;
    }

    setSaving(true);
    showToast('🗑️ Deleting file...', 'info');
    try {
      await consultationService.deleteAttachment(appointmentId, attachmentId);
      setFormData((prev) => ({
        ...prev,
        attachments: prev.attachments.filter((a) => a.id !== attachmentId),
      }));
      showToast('✅ File deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting file:', error);
      showToast(
        '❌ Failed to delete file: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
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

  return (
    <div className='p-6'>
      {/* Patient Info Section (from DoctorToday) */}
      {patientInfo && (
        <div className='mb-6 rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-900 dark:bg-brand-900/10'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Left side: Basic info */}
            <div className='space-y-2'>
              <div>
                <p className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                  Appointment Code
                </p>
                <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                  {patientInfo.appointmentCode || 'N/A'}
                </p>
              </div>
              <div>
                <p className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                  Patient Name
                </p>
                <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                  {patientInfo.patientName || 'N/A'}
                </p>
              </div>
              {patientInfo.queueNumber && (
                <div>
                  <p className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                    Queue Number
                  </p>
                  <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                    #{patientInfo.queueNumber}
                  </p>
                </div>
              )}
            </div>

            {/* Right side: Demographics & clinical info */}
            <div className='space-y-2'>
              <div>
                <p className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                  Demographics
                </p>
                <div className='text-sm text-gray-900 dark:text-white'>
                  {patientInfo.age && <span>{patientInfo.age} years old</span>}
                  {patientInfo.age && patientInfo.gender && (
                    <span className='mx-1'>•</span>
                  )}
                  {patientInfo.gender && <span>{patientInfo.gender}</span>}
                </div>
              </div>
              {patientInfo.reasonForVisit && (
                <div>
                  <p className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                    Reason for Visit
                  </p>
                  <p className='text-sm text-gray-900 dark:text-white'>
                    {patientInfo.reasonForVisit}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Alerts section */}
          <div className='mt-3 space-y-2 pt-3 border-t border-brand-200 dark:border-brand-900'>
            {patientInfo.allergies && (
              <div className='flex items-start gap-2 rounded bg-red-50 p-2 dark:bg-red-900/20'>
                <span className='flex-shrink-0 text-red-500 font-bold'>⚠️</span>
                <div>
                  <p className='text-xs font-semibold text-red-700 dark:text-red-400'>
                    ALLERGIES
                  </p>
                  <p className='text-xs text-red-600 dark:text-red-300'>
                    {patientInfo.allergies}
                  </p>
                </div>
              </div>
            )}
            {patientInfo.medicalHistory && (
              <div className='flex items-start gap-2 rounded bg-amber-50 p-2 dark:bg-amber-900/20'>
                <span className='flex-shrink-0 text-amber-600 font-bold'>
                  📋
                </span>
                <div>
                  <p className='text-xs font-semibold text-amber-700 dark:text-amber-400'>
                    MEDICAL HISTORY
                  </p>
                  <p className='text-xs text-amber-600 dark:text-amber-300 line-clamp-2'>
                    {patientInfo.medicalHistory}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className='mb-6 flex items-start justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
            Medical Examination Record
          </h1>
          <div className='mt-2 flex items-center gap-4'>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                formData.status === 'FINALIZED'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
              }`}
            >
              {formData.status === 'FINALIZED' ? '🔒 Finalized' : '📝 Draft'}
            </span>
            <span className='text-xs text-gray-500 dark:text-gray-400'>
              Last Updated: {new Date(formData.lastSavedAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className='flex gap-3'>
          <Button variant='outline' onClick={onBack} disabled={saving}>
            Back
          </Button>
          {!isFinalized && (
            <Button
              variant='outline'
              onClick={handleSaveDraft}
              disabled={saving}
            >
              {saving ? 'Saving...' : '💾 Save Draft'}
            </Button>
          )}
          {!isFinalized && (
            <Button onClick={handleFinalize} disabled={saving}>
              ✍️ Finalize & Sign
            </Button>
          )}
          {isFinalized && (
            <Button variant='outline' onClick={handlePrint} disabled={saving}>
              🖨️ Print Summary
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className='mb-6 border-b border-gray-200 dark:border-gray-700'>
        <div className='flex gap-6'>
          <button
            onClick={() => setTabActive('examination')}
            className={`border-b-2 px-0 py-3 text-sm font-medium transition-colors ${
              tabActive === 'examination'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Examination & Findings
          </button>
          {isFinalized && (
            <button
              onClick={() => setTabActive('amendments')}
              className={`border-b-2 px-0 py-3 text-sm font-medium transition-colors ${
                tabActive === 'amendments'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Amendments ({amendments.length})
            </button>
          )}
        </div>
      </div>

      {/* Examination Tab */}
      {tabActive === 'examination' && (
        <div className='space-y-8'>
          {/* Chief Complaint */}
          <Section title='1. Chief Complaint' required>
            <TextArea
              placeholder="Enter the patient's main reason for visit (e.g., headache, high fever)"
              value={formData.chiefComplaint}
              onChange={(value) => handleFieldChange('chiefComplaint', value)}
              disabled={isFinalized}
              rows={3}
            />
          </Section>

          {/* HPI */}
          <Section title='2. History of Present Illness'>
            <TextArea
              placeholder='Describe in detail the development of the current illness (when it started, severity, associated symptoms)'
              value={formData.hpi}
              onChange={(value) => handleFieldChange('hpi', value)}
              disabled={isFinalized}
              rows={4}
            />
          </Section>

          {/* Vitals */}
          <Section title='3. Vital Signs' required>
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
              <div>
                <Label htmlFor='temperature'>Temperature (°C)</Label>
                <InputField
                  id='temperature'
                  type='number'
                  placeholder='36.5'
                  value={formData.vitals.temperature ?? ''}
                  onChange={(e) =>
                    handleVitalChange(
                      'temperature',
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  disabled={isFinalized}
                />
              </div>
              <div>
                <Label htmlFor='systolic'>Systolic BP (mmHg)</Label>
                <InputField
                  id='systolic'
                  type='number'
                  placeholder='120'
                  value={formData.vitals.systolic ?? ''}
                  onChange={(e) =>
                    handleVitalChange(
                      'systolic',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  disabled={isFinalized}
                />
              </div>
              <div>
                <Label htmlFor='diastolic'>Diastolic BP (mmHg)</Label>
                <InputField
                  id='diastolic'
                  type='number'
                  placeholder='80'
                  value={formData.vitals.diastolic ?? ''}
                  onChange={(e) =>
                    handleVitalChange(
                      'diastolic',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  disabled={isFinalized}
                />
              </div>
              <div>
                <Label htmlFor='heartRate'>Heart Rate (bpm)</Label>
                <InputField
                  id='heartRate'
                  type='number'
                  placeholder='72'
                  value={formData.vitals.heartRate ?? ''}
                  onChange={(e) =>
                    handleVitalChange(
                      'heartRate',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  disabled={isFinalized}
                />
              </div>
              <div>
                <Label htmlFor='respiratoryRate'>Respiratory Rate (bpm)</Label>
                <InputField
                  id='respiratoryRate'
                  type='number'
                  placeholder='16'
                  value={formData.vitals.respiratoryRate ?? ''}
                  onChange={(e) =>
                    handleVitalChange(
                      'respiratoryRate',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  disabled={isFinalized}
                />
              </div>
            </div>

            {/* BMI Calculation */}
            <div className='mt-6 border-t border-gray-200 pt-6 dark:border-gray-700'>
              <h4 className='mb-4 font-medium text-gray-900 dark:text-white'>
                Body Mass Index (BMI)
              </h4>
              <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
                <div>
                  <Label htmlFor='height'>Height (cm)</Label>
                  <InputField
                    id='height'
                    type='number'
                    placeholder='170'
                    value={formData.vitals.height ?? ''}
                    onChange={(e) =>
                      handleVitalChange(
                        'height',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    disabled={isFinalized}
                  />
                </div>
                <div>
                  <Label htmlFor='weight'>Weight (kg)</Label>
                  <InputField
                    id='weight'
                    type='number'
                    placeholder='70'
                    value={formData.vitals.weight ?? ''}
                    onChange={(e) =>
                      handleVitalChange(
                        'weight',
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    disabled={isFinalized}
                  />
                </div>
                {formData.vitals.bmi && (
                  <div className='rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20'>
                    <div className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                      BMI
                    </div>
                    <div className='mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400'>
                      {formData.vitals.bmi}
                    </div>
                    <div className='mt-1 text-xs text-gray-600 dark:text-gray-400'>
                      {calculateBMICategory(formData.vitals.bmi)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* Physical Exam */}
          <Section title='4. Physical Exam'>
            <TextArea
              placeholder='Detailed findings from physical examination (skin condition, pulses, respiration, heart sounds, abdomen, etc.)'
              value={formData.physicalExam}
              onChange={(value) => handleFieldChange('physicalExam', value)}
              disabled={isFinalized}
              rows={4}
            />
          </Section>

          {/* Diagnosis */}
          <Section title='5. Diagnosis' required>
            <div className='space-y-4'>
              <TextArea
                placeholder='Detailed clinical diagnosis'
                value={formData.diagnosis}
                onChange={(value) => handleFieldChange('diagnosis', value)}
                disabled={isFinalized}
                rows={3}
              />
              <div>
                <Label htmlFor='diagnosticCode'>
                  ICD-10 Code (if applicable)
                </Label>
                <InputField
                  id='diagnosticCode'
                  placeholder='e.g: J00.9'
                  value={formData.diagnosticCode}
                  onChange={(e) =>
                    handleFieldChange('diagnosticCode', e.target.value)
                  }
                  disabled={isFinalized}
                />
              </div>
            </div>
          </Section>

          {/* Plan */}
          <Section title='6. Treatment Plan'>
            <TextArea
              placeholder='Describe detailed treatment plan (medications, tests, procedures, etc.)'
              value={formData.plan}
              onChange={(value) => handleFieldChange('plan', value)}
              disabled={isFinalized}
              rows={4}
            />
          </Section>

          {/* Follow-up */}
          <Section title='7. Follow-up Instructions'>
            <TextArea
              placeholder='Guidance for patient regarding follow-up appointments and home care instructions'
              value={formData.followUpInstructions}
              onChange={(value) =>
                handleFieldChange('followUpInstructions', value)
              }
              disabled={isFinalized}
              rows={3}
            />
          </Section>

          {/* Attachments */}
          <Section title='8. Attachments'>
            <div className='rounded-lg border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-600'>
              <svg
                className='mx-auto h-12 w-12 text-gray-400 dark:text-gray-500'
                stroke='currentColor'
                fill='none'
                viewBox='0 0 48 48'
              >
                <path
                  d='M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-14-12l6 6m-6-6v12'
                  strokeWidth={2}
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
              <p className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
                Upload Images or Test Results
              </p>
              <p className='mt-1 text-xs text-gray-600 dark:text-gray-400'>
                Drag and drop or click to select files
              </p>
              <input
                type='file'
                multiple
                accept='image/*,.pdf'
                className='mt-4 hidden'
                disabled={isFinalized || saving}
                onChange={handleFileUpload}
                id='file-upload'
              />
              <label htmlFor='file-upload' className='cursor-pointer'>
                <span className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
                  Click to upload or drag and drop
                </span>
              </label>
            </div>

            {formData.attachments.length > 0 && (
              <div className='mt-4 space-y-2'>
                {formData.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className='flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700'
                  >
                    <div>
                      <p className='text-sm font-medium text-gray-900 dark:text-white'>
                        {attachment.filename}
                      </p>
                      <p className='text-xs text-gray-600 dark:text-gray-400'>
                        {new Date(attachment.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                    {!isFinalized && (
                      <button
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        disabled={saving}
                        className='text-red-600 hover:text-red-700 disabled:opacity-50'
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}

      {/* Amendments Tab */}
      {tabActive === 'amendments' && (
        <div className='space-y-6'>
          <div className='rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20'>
            <h3 className='font-medium text-blue-900 dark:text-blue-300'>
              ℹ️ Addendum Mode
            </h3>
            <p className='mt-1 text-sm text-blue-800 dark:text-blue-400'>
              The finalized record cannot be directly edited. You can add new
              amendments to update information without modifying the original
              record.
            </p>
          </div>

          {/* Amendment Form */}
          {!showAmendmentModal && (
            <Button onClick={() => setShowAmendmentModal(true)}>
              + Add Amendment
            </Button>
          )}

          {showAmendmentModal && (
            <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20'>
              <h4 className='mb-3 font-medium text-gray-900 dark:text-white'>
                Add New Amendment
              </h4>
              <TextArea
                placeholder='Enter amendment content for the record...'
                value={newAmendment}
                onChange={(value) => setNewAmendment(value)}
                rows={4}
              />
              <div className='mt-3 flex gap-2'>
                <Button onClick={handleAddAmendment} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Amendment'}
                </Button>
                <Button
                  variant='outline'
                  onClick={() => {
                    setNewAmendment('');
                    setShowAmendmentModal(false);
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Amendments List */}
          {amendments.length > 0 && (
            <div className='space-y-4'>
              <h4 className='font-medium text-gray-900 dark:text-white'>
                Amendment List
              </h4>
              {amendments.map((amendment, index) => (
                <div
                  key={amendment.id}
                  className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'
                >
                  <div className='mb-3 flex items-start justify-between'>
                    <div>
                      <h5 className='font-medium text-gray-900 dark:text-white'>
                        Amendment #{index + 1}
                      </h5>
                      <p className='text-xs text-gray-600 dark:text-gray-400'>
                        {new Date(amendment.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        amendment.signedAt
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}
                    >
                      {amendment.signedAt ? '✓ Signed' : '⏳ Pending Signature'}
                    </span>
                  </div>
                  <p className='whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300'>
                    {amendment.content}
                  </p>
                  {!amendment.signedAt && (
                    <div className='mt-4'>
                      <Button
                        onClick={() => handleSignAmendment(amendment.id)}
                        disabled={saving}
                      >
                        Sign Amendment
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Section Component
function Section({
  title,
  required = false,
  children,
}: {
  title: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className='rounded-lg bg-gray-50 p-6 dark:bg-gray-700/50'>
      <div className='mb-4 flex items-center gap-2'>
        <h3 className='text-sm font-semibold text-gray-900 dark:text-white'>
          {title}
        </h3>
        {required && <span className='text-red-600'>*</span>}
      </div>
      {children}
    </div>
  );
}
