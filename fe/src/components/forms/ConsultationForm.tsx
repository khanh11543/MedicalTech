import { useState, useCallback, useEffect } from 'react';
import InputField from '../form/input/InputField';
import TextArea from '../form/input/TextArea';
import Label from '../form/Label';
import Button from '../ui/button/Button';
import Toast from '../common/Toast';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';
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
  onBack: () => void;
  patientInfo?: PatientInfo;
}

export default function ConsultationForm({
  appointmentId,
  onBack,
  patientInfo,
}: ConsultationFormProps) {
  const navigate = useNavigate();
  const { toast, showToast, dismissToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState<ConsultationRecord>({
    id: 0,
    appointmentId: appointmentId || 0,
    patientId: 0,
    patientName: patientInfo?.patientName || '',
    doctorId: 0,
    doctorName: '',
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
    isLocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    amendments: [],
    attachments: [],
  });

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Load existing draft consultation when component mounts
  useEffect(() => {
    if (!appointmentId) {
      return;
    }

    const loadDraftConsultation = async () => {
      try {
        const consultation =
          await consultationService.getConsultation(appointmentId);
        setFormData(consultation);
      } catch (error) {
        console.error('Error loading draft consultation:', error);
        // If loading fails, keep the empty form state
        // Form will still work for new draft creation
      }
    };

    loadDraftConsultation();
  }, [appointmentId]);

  // Memoize handleSaveDraft to avoid unnecessary re-renders
  const handleSaveDraft = useCallback(async () => {
    if (!appointmentId) {
      showToast('❌ Appointment not found', 'error');
      return;
    }

    setSaving(true);
    showToast('💾 Saving consultation draft...', 'info');
    try {
      // Convert formData to the API payload format
      const payload = {
        appointmentId,
        chiefComplaint: formData.chiefComplaint,
        hpi: formData.hpi,
        temperature: formData.vitals.temperature,
        systolic: formData.vitals.systolic,
        diastolic: formData.vitals.diastolic,
        heartRate: formData.vitals.heartRate,
        respiratoryRate: formData.vitals.respiratoryRate,
        height: formData.vitals.height,
        weight: formData.vitals.weight,
        physicalExam: formData.physicalExam,
        diagnosis: formData.diagnosis,
        diagnosticCode: formData.diagnosticCode,
        plan: formData.plan,
        followUpInstructions: formData.followUpInstructions,
      };

      const updatedConsultation = await consultationService.saveDraft(
        appointmentId,
        payload
      );
      setFormData(updatedConsultation);
      showToast('✅ Consultation draft saved successfully', 'success');
    } catch (error) {
      console.error('Error saving draft:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      showToast(`❌ Failed to save draft: ${errorMessage}`, 'error');
    } finally {
      setSaving(false);
    }
  }, [appointmentId, formData, showToast]);

  const handleFinalize = async () => {
    // Clear previous errors
    setFieldErrors({});

    // Validate all required fields
    const errors: Record<string, string> = {};

    if (!formData.chiefComplaint.trim()) {
      errors['chiefComplaint'] = 'Chief Complaint is required';
    }

    if (!formData.diagnosis.trim()) {
      errors['diagnosis'] = 'Diagnosis is required';
    }

    if (Object.values(formData.vitals).every((v) => v === null)) {
      errors['vitals'] = 'At least one vital sign is required';
    }

    // If there are errors, show them and return
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);

      // Show toast with error count
      const errorCount = Object.keys(errors).length;
      showToast(
        `⚠️ Please fix ${errorCount} validation error${errorCount > 1 ? 's' : ''} before finalizing`,
        'error'
      );
      return;
    }

    setSaving(true);
    showToast('🔒 Finalizing consultation...', 'info');
    try {
      console.log('Attempting to finalize consultation:', formData);

      // Convert formData to the API payload format
      const payload = {
        appointmentId: formData.appointmentId,
        chiefComplaint: formData.chiefComplaint,
        hpi: formData.hpi,
        temperature: formData.vitals.temperature,
        systolic: formData.vitals.systolic,
        diastolic: formData.vitals.diastolic,
        heartRate: formData.vitals.heartRate,
        respiratoryRate: formData.vitals.respiratoryRate,
        height: formData.vitals.height,
        weight: formData.vitals.weight,
        physicalExam: formData.physicalExam,
        diagnosis: formData.diagnosis,
        diagnosticCode: formData.diagnosticCode,
        plan: formData.plan,
        followUpInstructions: formData.followUpInstructions,
      };

      const finalizedConsultation = await consultationService.finalize(
        formData.appointmentId,
        payload
      );
      console.log('Finalization successful:', finalizedConsultation);
      setFormData(finalizedConsultation);
      showToast(
        '✅ Consultation finalized successfully. You can now sign it to approve.',
        'success'
      );
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
        } else if (axiosError.response?.data?.statusText) {
          const status = axiosError.response.data.status || 'Unknown';
          errorMessage = `${status} - ${axiosError.response.data.statusText}`;
        } else if (axiosError.response?.statusText) {
          errorMessage = axiosError.response.statusText;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }

        console.error('Detailed error response:', axiosError.response);
      }

      showToast(`❌ Failed to finalize record: ${errorMessage}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSign = async () => {
    if (!appointmentId) {
      showToast('❌ Appointment not found', 'error');
      return;
    }

    if (formData.status !== 'FINALIZED') {
      showToast('⚠️ Consultation must be finalized before signing', 'error');
      return;
    }

    setSaving(true);
    showToast('✍️ Signing consultation...', 'info');
    try {
      const signedConsultation =
        await consultationService.signConsultation(appointmentId);
      console.log('Sign successful:', signedConsultation);
      setFormData(signedConsultation);
      showToast('✅ Consultation signed successfully', 'success');
      // Show modal after signing
      setShowFinalizeModal(true);
    } catch (error) {
      console.error('Error signing consultation:', error);

      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const axiosError = error as {
          response?: {
            data?: {
              message?: string;
              error?: string;
            };
          };
          message?: string;
        };

        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      }

      showToast(`❌ Failed to sign consultation: ${errorMessage}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
    showToast('Printing summary...', 'info');
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

    // Clear vitals error when user enters any vital sign
    if (fieldErrors.vitals) {
      setFieldErrors({ ...fieldErrors, vitals: '' });
    }
  };

  const calculateBMICategory = (bmi: number | null) => {
    if (!bmi) return '';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Store selected files without uploading yet
    const newFiles = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    showToast(`✅ ${newFiles.length} file(s) selected`, 'success');

    // Reset the input
    e.target.value = '';
  };

  const handleUploadAttachments = async () => {
    if (selectedFiles.length === 0) {
      showToast('❌ No files selected', 'error');
      return;
    }

    if (!appointmentId) {
      showToast('❌ Appointment not found', 'error');
      return;
    }

    setSaving(true);
    showToast(`📤 Uploading ${selectedFiles.length} file(s)...`, 'info');
    try {
      for (const file of selectedFiles) {
        const attachment = await consultationService.uploadAttachment(
          appointmentId,
          file
        );
        setFormData((prev) => ({
          ...prev,
          attachments: [...prev.attachments, attachment],
        }));
      }
      showToast(
        `✅ ${selectedFiles.length} file(s) uploaded successfully`,
        'success'
      );
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error uploading file:', error);

      // Extract detailed error message
      let errorMessage = 'Unknown error occurred';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const axiosError = error as {
          response?: {
            data?: {
              message?: string;
              error?: string;
            };
          };
          message?: string;
        };

        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      }

      // Check if error is "no consultation" and provide guidance
      if (errorMessage.toLowerCase().includes('no consultation')) {
        showToast(
          '⚠️ Please save the consultation form first before uploading attachments.',
          'error'
        );
      } else {
        showToast(`❌ Failed to upload file(s): ${errorMessage}`, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!appointmentId) {
      showToast('❌ Appointment not found', 'error');
      return;
    }

    setSaving(true);
    showToast('🗑️ Deleting file...', 'info');
    try {
      await consultationService.deleteAttachment(
        appointmentId,
        attachmentId.toString()
      );
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

  return (
    <>
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
                    {patientInfo.age && (
                      <span>{patientInfo.age} years old</span>
                    )}
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
                  <span className='flex-shrink-0 text-red-500 font-bold'>
                    ⚠️
                  </span>
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
                Last Updated: {new Date(formData.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className='flex gap-3 flex-wrap'>
            <Button variant='outline' onClick={onBack} disabled={saving}>
              Back
            </Button>
            {formData.status === 'DRAFT' && (
              <Button
                variant='outline'
                onClick={handleSaveDraft}
                disabled={saving}
              >
                {saving ? 'Saving...' : '💾 Save Draft'}
              </Button>
            )}
            {formData.status === 'DRAFT' && (
              <Button onClick={handleFinalize} disabled={saving}>
                {saving ? 'Finalizing...' : '🔒 Finalize'}
              </Button>
            )}
            {formData.status === 'FINALIZED' && (
              <Button onClick={handleSign} disabled={saving}>
                {saving ? 'Signing...' : '✍️ Sign'}
              </Button>
            )}
            <Button variant='outline' onClick={handlePrint} disabled={saving}>
              Print Summary
            </Button>
          </div>
        </div>

        {/* Examination Section */}
        <div className='space-y-8'>
          {/* Chief Complaint */}
          <Section
            title='1. Chief Complaint'
            required
            error={fieldErrors.chiefComplaint}
          >
            <TextArea
              placeholder="Enter the patient's main reason for visit (e.g., headache, high fever)"
              value={formData.chiefComplaint}
              onChange={(value) => {
                handleFieldChange('chiefComplaint', value);
                // Clear error when user starts typing
                if (fieldErrors.chiefComplaint) {
                  setFieldErrors({ ...fieldErrors, chiefComplaint: '' });
                }
              }}
              disabled={formData.status === 'FINALIZED'}
              rows={3}
            />
          </Section>

          {/* HPI */}
          <Section title='2. History of Present Illness'>
            <TextArea
              placeholder='Describe in detail the development of the current illness (when it started, severity, associated symptoms)'
              value={formData.hpi}
              onChange={(value) => handleFieldChange('hpi', value)}
              disabled={formData.status === 'FINALIZED'}
              rows={4}
            />
          </Section>

          {/* Vitals */}
          <Section title='3. Vital Signs' required error={fieldErrors.vitals}>
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
                  disabled={formData.status === 'FINALIZED'}
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
                  disabled={formData.status === 'FINALIZED'}
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
                  disabled={formData.status === 'FINALIZED'}
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
                  disabled={formData.status === 'FINALIZED'}
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
                  disabled={formData.status === 'FINALIZED'}
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
                    disabled={formData.status === 'FINALIZED'}
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
                    disabled={formData.status === 'FINALIZED'}
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
              disabled={formData.status === 'FINALIZED'}
              rows={4}
            />
          </Section>

          {/* Diagnosis */}
          <Section title='5. Diagnosis' required error={fieldErrors.diagnosis}>
            <div className='space-y-4'>
              <TextArea
                placeholder='Detailed clinical diagnosis'
                value={formData.diagnosis}
                onChange={(value) => {
                  handleFieldChange('diagnosis', value);
                  // Clear error when user starts typing
                  if (fieldErrors.diagnosis) {
                    setFieldErrors({ ...fieldErrors, diagnosis: '' });
                  }
                }}
                disabled={formData.status === 'FINALIZED'}
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
                  disabled={formData.status === 'FINALIZED'}
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
              disabled={formData.status === 'FINALIZED'}
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
              disabled={formData.status === 'FINALIZED'}
              rows={3}
            />
          </Section>

          {/* Attachments */}
          <Section title='8. Attachments'>
            <div
              className='rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10'
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove(
                  'border-blue-400',
                  'bg-blue-50'
                );
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove(
                  'border-blue-400',
                  'bg-blue-50'
                );
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                  const newFiles = Array.from(files);
                  setSelectedFiles((prev) => [...prev, ...newFiles]);
                  showToast(
                    `✅ ${newFiles.length} file(s) selected`,
                    'success'
                  );
                }
              }}
            >
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
                Drag and drop or click to select files (Images, PDF - Max 10MB)
              </p>
              <input
                type='file'
                multiple
                accept='image/*,.pdf'
                className='mt-4 hidden'
                disabled={formData.status === 'FINALIZED' || saving}
                onChange={handleFileUpload}
                id='file-upload'
              />

              <label
                htmlFor='file-upload'
                className={`mt-4 inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-3.5 text-sm 
    bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 
    dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300
    ${
      formData.status === 'FINALIZED' || saving
        ? 'cursor-not-allowed opacity-50'
        : 'cursor-pointer'
    }`}
              >
                {saving ? '📤 Uploading...' : '📁 Select Files'}
              </label>
            </div>

            {/* Selected Files (Pending Upload) */}
            {selectedFiles.length > 0 && (
              <div className='mt-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900'>
                <h4 className='mb-3 font-medium text-amber-900 dark:text-amber-200 flex items-center gap-2'>
                  <span>⏳ Files Pending Upload</span>
                  <span className='text-xs bg-amber-200 text-amber-900 rounded-full px-2.5 py-0.5 dark:bg-amber-900/30 dark:text-amber-200'>
                    {selectedFiles.length}
                  </span>
                </h4>
                <div className='space-y-2 mb-4'>
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between rounded-lg bg-white p-3 dark:bg-gray-700'
                    >
                      <div className='flex items-start gap-3 flex-1'>
                        <div className='text-xl pt-0'>
                          {file.type === 'application/pdf' ? '📄' : '🖼️'}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                            {file.name}
                          </p>
                          <p className='text-xs text-gray-600 dark:text-gray-400'>
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveSelectedFile(index)}
                        disabled={saving}
                        className='ml-4 flex-shrink-0 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                        title='Remove file'
                      >
                        <svg
                          className='w-5 h-5'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                            clipRule='evenodd'
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className='flex gap-2'>
                  <button
                    onClick={handleUploadAttachments}
                    disabled={saving}
                    className='flex-1 inline-flex items-center justify-center gap-2 rounded-lg transition px-4 py-2.5 text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium'
                  >
                    {saving
                      ? '📤 Uploading...'
                      : `✅ Upload ${selectedFiles.length} File(s)`}
                  </button>
                  <button
                    onClick={() => setSelectedFiles([])}
                    disabled={saving}
                    className='inline-flex items-center justify-center gap-2 rounded-lg transition px-4 py-2.5 text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Attachments List */}
            {formData.attachments.length > 0 && (
              <div className='mt-6'>
                <h4 className='mb-3 font-medium text-gray-900 dark:text-white flex items-center gap-2'>
                  <span>📎 Attached Files</span>
                  <span className='text-xs bg-blue-100 text-blue-800 rounded-full px-2.5 py-0.5 dark:bg-blue-900/30 dark:text-blue-300'>
                    {formData.attachments.length}
                  </span>
                </h4>
                <div className='space-y-2'>
                  {formData.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className='flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-700'
                    >
                      <div className='flex items-start gap-3 flex-1'>
                        <div className='text-2xl pt-0.5'>
                          {attachment.fileType === 'pdf' ? '📄' : '🖼️'}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                            {attachment.filename}
                          </p>
                          <div className='mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400'>
                            <span>
                              {(attachment.fileSize / 1024).toFixed(1)} KB
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(attachment.createdAt).toLocaleString()}
                            </span>
                            {attachment.uploadedByUserName && (
                              <>
                                <span>•</span>
                                <span>by {attachment.uploadedByUserName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {formData.status !== 'FINALIZED' && (
                        <button
                          onClick={() => handleDeleteAttachment(attachment.id)}
                          disabled={saving}
                          className='ml-4 flex-shrink-0 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                          title='Delete attachment'
                        >
                          <svg
                            className='w-5 h-5'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path
                              fillRule='evenodd'
                              d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                              clipRule='evenodd'
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State Message */}
            {formData.attachments.length === 0 &&
              selectedFiles.length === 0 && (
                <div className='mt-4 rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/10 dark:border-blue-900'>
                  <p className='text-sm text-blue-700 dark:text-blue-300'>
                    💡 <span className='font-medium'>Tip:</span> Attach medical
                    images, test results, or other relevant documents to support
                    this consultation record.
                  </p>
                </div>
              )}
          </Section>
        </div>
      </div>

      {/* Finalize Success Modal */}
      {showFinalizeModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='max-w-lg rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800'>
            <div className='mb-4 text-center'>
              <div className='mx-auto mb-4 text-5xl'>🎉</div>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                Consultation Finalized!
              </h2>
            </div>

            <p className='mb-6 text-center text-gray-600 dark:text-gray-400'>
              The consultation record has been successfully finalized and
              locked. Next, please create a prescription for this consultation.
            </p>

            <div className='flex gap-3'>
              <Button
                variant='outline'
                onClick={() => {
                  setShowFinalizeModal(false);
                  onBack();
                }}
                className='flex-1'
              >
                Done
              </Button>
              <Button
                onClick={() => {
                  setShowFinalizeModal(false);
                  navigate('/doctor/prescriptions/create', {
                    state: {
                      appointmentId: formData.appointmentId,
                      patientId: formData.patientId,
                      patientName: formData.patientName,
                      diagnosis: formData.diagnosis,
                      followUpInstructions: formData.followUpInstructions,
                      consultationId: formData.id,
                    },
                  });
                }}
                className='flex-1'
              >
                Create Prescription Now
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}

// Section Component
function Section({
  title,
  required = false,
  error,
  children,
}: {
  title: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg p-6 ${error ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-700/50'}`}
    >
      <div className='mb-4 flex items-center gap-2'>
        <h3 className='text-sm font-semibold text-gray-900 dark:text-white'>
          {title}
        </h3>
        {required && <span className='text-red-600'>*</span>}
      </div>
      {error && (
        <div className='mb-4 rounded bg-red-100 dark:bg-red-900/30 p-3 border-l-4 border-red-500'>
          <p className='text-sm text-red-700 dark:text-red-300'>{error}</p>
        </div>
      )}
      {children}
    </div>
  );
}
