import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import Toast from '../../components/common/Toast';
import { useToast } from '../../hooks/useToast';
import prescriptionService, {
  PrescriptionCreateDTO,
  PrescriptionItemDTO,
} from '../../services/prescriptionService';

interface ConsultationData {
  appointmentId?: number;
  patientId?: number;
  patientName?: string;
  diagnosis?: string;
  followUpInstructions?: string;
  consultationId?: number;
  // Template pre-fill (from Templates page)
  templateItems?: PrescriptionItemDTO[];
  templateName?: string;
  notes?: string;
  followUpDays?: number;
  // Reissue mode
  reissueMode?: boolean;
  reissueFromCode?: string;
  followUpDate?: string;
}

interface PrescriptionForm {
  patientId: number;
  appointmentId?: number;
  prescriptionDate: string;
  diagnosis: string;
  notes: string;
  followUpDate: string;
  items: PrescriptionItemDTO[];
}

export default function DoctorPrescriptionsCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, showToast, dismissToast } = useToast();

  const consultationData = (location.state as ConsultationData) || {};

  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<PrescriptionForm>({
    patientId: consultationData.patientId || 0,
    appointmentId: consultationData.appointmentId,
    prescriptionDate: new Date().toISOString().split('T')[0],
    diagnosis: consultationData.diagnosis || '',
    notes: consultationData.notes || consultationData.followUpInstructions || '',
    followUpDate: consultationData.followUpDate || '',
    items: [],
  });

  const [medicines, setMedicines] = useState<PrescriptionItemDTO[]>(
    consultationData.templateItems?.length
      ? consultationData.templateItems
      : [
          {
            medicineName: '',
            dosage: '',
            frequency: '',
            duration: '',
            quantity: undefined,
            unit: '',
            instructions: '',
            notes: '',
          },
        ]
  );

  const handleFormChange = (
    field: keyof PrescriptionForm,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMedicineChange = (
    index: number,
    field: keyof PrescriptionItemDTO,
    value: string | number | undefined
  ) => {
    const updatedMedicines = [...medicines];
    updatedMedicines[index] = {
      ...updatedMedicines[index],
      [field]: value,
    };
    setMedicines(updatedMedicines);
  };

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      {
        medicineName: '',
        dosage: '',
        frequency: '',
        duration: '',
        quantity: undefined,
        unit: '',
        instructions: '',
        notes: '',
      },
    ]);
  };

  const handleRemoveMedicine = (index: number) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((_, i) => i !== index));
    } else {
      showToast('❌ At least one medicine is required', 'error');
    }
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validation
      if (!formData.patientId) {
        showToast('❌ Patient ID is missing', 'error');
        return;
      }

      // Check if all medicines have required fields
      const invalidMedicines = medicines.some(
        (m) => !m.medicineName.trim() || !m.dosage.trim() || !m.frequency.trim()
      );
      if (invalidMedicines) {
        showToast(
          '❌ Please fill in all required fields for medicines (name, dosage, frequency)',
          'error'
        );
        return;
      }

      setCreating(true);
      showToast('💊 Creating prescription...', 'info');

      try {
        const prescriptionDto: PrescriptionCreateDTO = {
          patientId: formData.patientId,
          appointmentId: formData.appointmentId,
          prescriptionDate: formData.prescriptionDate
            ? new Date(formData.prescriptionDate).toISOString().split('T')[0]
            : undefined,
          diagnosis: formData.diagnosis || undefined,
          notes: formData.notes || undefined,
          followUpDate: formData.followUpDate
            ? new Date(formData.followUpDate).toISOString().split('T')[0]
            : undefined,
          items: medicines,
        };

        const result =
          await prescriptionService.createPrescription(prescriptionDto);

        showToast(
          `✅ Prescription created successfully (ID: ${result.id})`,
          'success'
        );

        // Navigate to prescription view or back
        setTimeout(() => {
          navigate('/doctor/prescriptions', {
            state: { justCreated: result.id },
          });
        }, 1500);
      } catch (error) {
        console.error('Error creating prescription:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        showToast(`❌ Failed to create prescription: ${errorMessage}`, 'error');
      } finally {
        setCreating(false);
      }
    },
    [formData, medicines, showToast, navigate]
  );

  return (
    <>
      <PageMeta
        title='Create Prescription | Doctor Panel'
        description='Create a new prescription'
      />
      <PageBreadcrumb pageTitle='Create Prescription' />

      <div className='space-y-6'>
        {/* Show info message if not accessed from consultation page */}
        {!consultationData.patientId && (
          <DirectAccessInfo
            onNavigateToConsultation={() => navigate('/doctor/consultation')}
          />
        )}

        {/* Only show form if consultation data is available */}
        {consultationData.patientId && (
          <>
            {/* Context banner */}
            {consultationData.reissueMode ? (
              <div className='rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/10'>
                <div className='mb-3 flex items-center gap-3'>
                  <span className='text-xl'>📋</span>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                    Reissuing Prescription
                  </h3>
                  <span className='inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'>
                    {consultationData.reissueFromCode}
                  </span>
                </div>
                <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>
                  Review and adjust the details below, then click <strong>Sign</strong> to issue the new prescription.
                </p>
                <div>
                  <p className='text-xs font-medium text-gray-600 dark:text-gray-400'>Patient</p>
                  <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                    {consultationData.patientName || 'N/A'}
                  </p>
                </div>
              </div>
            ) : (
              consultationData.patientId && (
                <div className='rounded-lg border border-brand-200 bg-brand-50 p-6 dark:border-brand-900 dark:bg-brand-900/10'>
                  <div className='mb-4 flex items-center justify-between'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                      📋 Consultation Summary
                    </h3>
                    <span className='inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300'>
                      Just Finalized
                    </span>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <p className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                        Patient
                      </p>
                      <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                        {consultationData.patientName || 'N/A'}
                      </p>
                    </div>
                    {consultationData.appointmentId && (
                      <div>
                        <p className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                          Appointment ID
                        </p>
                        <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                          #{consultationData.appointmentId}
                        </p>
                      </div>
                    )}
                    {consultationData.diagnosis && (
                      <div className='md:col-span-2'>
                        <p className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                          Diagnosis
                        </p>
                        <p className='text-sm text-gray-900 dark:text-white'>
                          {consultationData.diagnosis}
                        </p>
                      </div>
                    )}
                    {consultationData.followUpInstructions && (
                      <div className='md:col-span-2'>
                        <p className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                          Follow-up Instructions
                        </p>
                        <p className='text-sm text-gray-900 dark:text-white'>
                          {consultationData.followUpInstructions}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Prescription Form */}
            <div className='rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-800 dark:bg-gray-900'>
              <div className='border-b border-gray-200 px-6 py-4 dark:border-gray-700'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  {consultationData.reissueMode ? 'Reissue Prescription' : 'New Prescription'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className='space-y-6 p-6'>
                {/* Basic Info */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Patient ID
                    </label>
                    <input
                      type='number'
                      value={formData.patientId}
                      onChange={(e) =>
                        handleFormChange(
                          'patientId',
                          parseInt(e.target.value) || 0
                        )
                      }
                      disabled
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 text-gray-600 cursor-not-allowed'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Prescription Date
                    </label>
                    <input
                      type='date'
                      value={formData.prescriptionDate}
                      onChange={(e) =>
                        handleFormChange('prescriptionDate', e.target.value)
                      }
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Follow-up Date (optional)
                    </label>
                    <input
                      type='date'
                      value={formData.followUpDate}
                      onChange={(e) =>
                        handleFormChange('followUpDate', e.target.value)
                      }
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500'
                    />
                  </div>
                </div>

                {/* Diagnosis */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Diagnosis
                  </label>
                  <textarea
                    value={formData.diagnosis}
                    onChange={(e) =>
                      handleFormChange('diagnosis', e.target.value)
                    }
                    rows={3}
                    placeholder='Confirm or modify the diagnosis from consultation'
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500'
                  />
                </div>

                {/* Medicines */}
                <div>
                  <div className='mb-4 flex items-center justify-between'>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Prescribed Medicines{' '}
                      <span className='text-red-600'>*</span>
                    </label>
                    <span className='text-xs text-gray-600 dark:text-gray-400'>
                      {medicines.length} medicine(s)
                    </span>
                  </div>

                  <div className='space-y-4'>
                    {medicines.map((medicine, index) => (
                      <div
                        key={index}
                        className='border border-gray-200 rounded-lg p-4 dark:border-gray-700'
                      >
                        <div className='flex items-start justify-between mb-4'>
                          <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                            Medicine #{index + 1}
                          </span>
                          {medicines.length > 1 && (
                            <button
                              type='button'
                              onClick={() => handleRemoveMedicine(index)}
                              className='text-red-600 hover:text-red-700 text-sm font-medium'
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                          <div>
                            <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                              Medicine Name{' '}
                              <span className='text-red-600'>*</span>
                            </label>
                            <input
                              type='text'
                              value={medicine.medicineName}
                              onChange={(e) =>
                                handleMedicineChange(
                                  index,
                                  'medicineName',
                                  e.target.value
                                )
                              }
                              placeholder='e.g., Paracetamol, Ibuprofen'
                              className='w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
                            />
                          </div>
                          <div>
                            <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                              Dosage <span className='text-red-600'>*</span>
                            </label>
                            <input
                              type='text'
                              value={medicine.dosage}
                              onChange={(e) =>
                                handleMedicineChange(
                                  index,
                                  'dosage',
                                  e.target.value
                                )
                              }
                              placeholder='e.g., 500mg, 2 tablets'
                              className='w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
                            />
                          </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                          <div>
                            <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                              Frequency <span className='text-red-600'>*</span>
                            </label>
                            <input
                              type='text'
                              value={medicine.frequency}
                              onChange={(e) =>
                                handleMedicineChange(
                                  index,
                                  'frequency',
                                  e.target.value
                                )
                              }
                              placeholder='e.g., 3 times daily'
                              className='w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
                            />
                          </div>
                          <div>
                            <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                              Duration (optional)
                            </label>
                            <input
                              type='text'
                              value={medicine.duration || ''}
                              onChange={(e) =>
                                handleMedicineChange(
                                  index,
                                  'duration',
                                  e.target.value
                                )
                              }
                              placeholder='e.g., 5 days, 2 weeks'
                              className='w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
                            />
                          </div>
                          <div>
                            <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                              Quantity (optional)
                            </label>
                            <div className='flex gap-2'>
                              <input
                                type='number'
                                value={medicine.quantity || ''}
                                onChange={(e) =>
                                  handleMedicineChange(
                                    index,
                                    'quantity',
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined
                                  )
                                }
                                placeholder='10'
                                className='w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
                              />
                              <input
                                type='text'
                                value={medicine.unit || ''}
                                onChange={(e) =>
                                  handleMedicineChange(
                                    index,
                                    'unit',
                                    e.target.value
                                  )
                                }
                                placeholder='tablets'
                                className='w-20 px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
                              />
                            </div>
                          </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <div>
                            <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                              Instructions (optional)
                            </label>
                            <input
                              type='text'
                              value={medicine.instructions || ''}
                              onChange={(e) =>
                                handleMedicineChange(
                                  index,
                                  'instructions',
                                  e.target.value
                                )
                              }
                              placeholder='e.g., Take after meals'
                              className='w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
                            />
                          </div>
                          <div>
                            <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                              Notes (optional)
                            </label>
                            <input
                              type='text'
                              value={medicine.notes || ''}
                              onChange={(e) =>
                                handleMedicineChange(
                                  index,
                                  'notes',
                                  e.target.value
                                )
                              }
                              placeholder='Additional notes'
                              className='w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type='button'
                    onClick={handleAddMedicine}
                    disabled={creating}
                    className='mt-4 px-4 py-2 text-sm font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    + Add Another Medicine
                  </button>
                </div>

                {/* Notes */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Additional Notes (optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    rows={3}
                    placeholder='Additional instructions or notes for the patient'
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500'
                  />
                </div>

                {/* Actions */}
                <div className='flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700 pt-6'>
                  <button
                    type='button'
                    onClick={() => navigate(-1)}
                    disabled={creating}
                    className='px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={creating || medicines.length === 0}
                    className='px-6 py-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-800 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {creating
                      ? consultationData.reissueMode ? 'Signing…' : 'Creating...'
                      : consultationData.reissueMode ? '✍️ Sign' : '💊 Create Prescription'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}

// Direct access info component - shown when page is opened directly
function DirectAccessInfo({
  onNavigateToConsultation,
}: {
  onNavigateToConsultation: () => void;
}) {
  const { showToast } = useToast();

  const handleNavigate = () => {
    showToast('📋 Opening Consultation page...', 'info');
    onNavigateToConsultation();
  };

  return (
    <div className='p-8'>
      <div className='max-w-md mx-auto'>
        <div className='rounded-lg border-2 border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-900/20'>
          {/* Icon */}
          <div className='mb-4 flex justify-center'>
            <svg
              className='h-12 w-12 text-amber-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4v2m0 4v2M9 5h6a2 2 0 012 2v1h2a2 2 0 012 2v3a2 2 0 01-2 2h-2v1a2 2 0 01-2 2H9a2 2 0 01-2-2v-1H5a2 2 0 01-2-2V9a2 2 0 012-2h2V7a2 2 0 012-2z'
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className='mb-2 text-center text-lg font-semibold text-gray-900 dark:text-white'>
            Consultation Required
          </h2>

          {/* Message */}
          <p className='mb-6 text-center text-sm text-gray-700 dark:text-gray-300'>
            To create a prescription, you must first create and finalize a{' '}
            <strong>consultation</strong> for the patient. This will allow you
            to link the prescription to the consultation and auto-fill medical
            information.
          </p>

          {/* Instructions */}
          <div className='mb-6 rounded-lg bg-white p-4 dark:bg-gray-800'>
            <h3 className='mb-3 text-sm font-medium text-gray-900 dark:text-white'>
              Steps to follow:
            </h3>
            <ol className='space-y-2 text-sm text-gray-700 dark:text-gray-300'>
              <li className='flex gap-2'>
                <span className='flex-shrink-0 font-semibold text-amber-600'>
                  1
                </span>
                <span>
                  Go to <strong>Consultation</strong> from the sidebar
                </span>
              </li>
              <li className='flex gap-2'>
                <span className='flex-shrink-0 font-semibold text-amber-600'>
                  2
                </span>
                <span>Fill in the consultation details for the patient</span>
              </li>
              <li className='flex gap-2'>
                <span className='flex-shrink-0 font-semibold text-amber-600'>
                  3
                </span>
                <span>
                  Click <strong>Finalize & Sign</strong> to save the
                  consultation
                </span>
              </li>
              <li className='flex gap-2'>
                <span className='flex-shrink-0 font-semibold text-amber-600'>
                  4
                </span>
                <span>
                  Click <strong>Create Prescription Now</strong> in the success
                  modal
                </span>
              </li>
            </ol>
          </div>

          {/* Navigation */}
          <button
            onClick={handleNavigate}
            className='w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800'
          >
            Go to Consultation Page
          </button>
        </div>
      </div>
    </div>
  );
}
