import { useState, useEffect } from 'react';
import medicalRecordService, {
  MedicalRecordDTO,
} from '../../services/medicalRecordService';

interface MedicalRecordDetailModalProps {
  isOpen: boolean;
  recordId: number;
  onClose: () => void;
  isDoctorView?: boolean;
}

export default function MedicalRecordDetailModal({
  isOpen,
  recordId,
  onClose,
  isDoctorView = true,
}: MedicalRecordDetailModalProps) {
  const [record, setRecord] = useState<MedicalRecordDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !recordId) return;

    const fetchRecord = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = isDoctorView
          ? await medicalRecordService.getMedicalRecordDetail(recordId)
          : await medicalRecordService.getRecordDetail(recordId);
        setRecord(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load medical record'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [isOpen, recordId, isDoctorView]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] transition-opacity duration-300'
        onClick={onClose}
        style={{
          animation: 'fadeIn 0.3s ease-in-out',
        }}
      />

      {/* Modal */}
      <div
        className='fixed inset-0 z-[1000] flex items-center justify-center p-4'
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className='bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'
          style={{
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          {loading ? (
            <div className='flex items-center justify-center p-12'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin' />
                <p className='text-gray-600 dark:text-gray-400'>
                  Loading medical record...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className='p-6'>
              <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
                <p className='text-red-700 dark:text-red-400'>{error}</p>
              </div>
            </div>
          ) : record ? (
            <>
              {/* Header */}
              <div className='sticky top-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-6 py-6 flex items-start justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-2'>
                    <h2 className='text-2xl font-bold text-white'>
                      Medical Record
                    </h2>
                    <span className='px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full'>
                      {record.recordCode}
                    </span>
                  </div>
                  <p className='text-blue-100 text-sm'>
                    Visit Date:{' '}
                    {medicalRecordService.formatDate(record.visitDate)}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className='text-white hover:bg-white/20 p-2 rounded-lg transition-colors'
                >
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className='p-6 space-y-6'>
                {/* Doctor Info */}
                <Section title='Doctor Information'>
                  <Grid>
                    <Field label='Doctor Name' value={record.doctorName} />
                    <Field
                      label='Specialization'
                      value={record.doctorSpecialization}
                    />
                  </Grid>
                </Section>

                {/* Chief Complaint & Symptoms */}
                {(record.chiefComplaint || record.presentIllness) && (
                  <Section title='Chief Complaint & Symptoms'>
                    {record.chiefComplaint && (
                      <Field
                        label='Chief Complaint'
                        value={record.chiefComplaint}
                        full
                      />
                    )}
                    {record.presentIllness && (
                      <Field
                        label='Present Illness'
                        value={record.presentIllness}
                        full
                      />
                    )}
                  </Section>
                )}

                {/* Vital Signs */}
                {record.vitalSigns &&
                  Object.keys(record.vitalSigns).length > 0 && (
                    <Section title='Vital Signs'>
                      <div className='grid grid-cols-2 gap-4'>
                        {medicalRecordService
                          .formatVitalSigns(record.vitalSigns)
                          .map((vital, idx) => (
                            <div
                              key={idx}
                              className='bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg'
                            >
                              <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                                {vital}
                              </p>
                            </div>
                          ))}
                      </div>
                    </Section>
                  )}

                {/* Physical Examination */}
                {record.physicalExam && (
                  <Section title='Physical Examination'>
                    <Field label='Findings' value={record.physicalExam} full />
                  </Section>
                )}

                {/* Diagnosis & Assessment */}
                {(record.diagnosis || record.diagnosisCode) && (
                  <Section title='Diagnosis'>
                    {record.diagnosis && (
                      <Field label='Diagnosis' value={record.diagnosis} full />
                    )}
                    {record.diagnosisCode && (
                      <Field
                        label='Diagnosis Code'
                        value={record.diagnosisCode}
                      />
                    )}
                  </Section>
                )}

                {/* Treatment Plan */}
                {record.treatmentPlan && (
                  <Section title='Treatment Plan'>
                    <Field label='Plan' value={record.treatmentPlan} full />
                  </Section>
                )}

                {/* Prescription */}
                {record.prescription && (
                  <Section title='Prescription'>
                    <Field
                      label='Medications'
                      value={record.prescription}
                      full
                    />
                  </Section>
                )}

                {/* Lab Results */}
                {record.labResults &&
                  Array.isArray(record.labResults) &&
                  record.labResults.length > 0 && (
                    <Section title='Lab Results'>
                      <div className='space-y-3'>
                        {record.labResults.map((lab: any, idx: number) => (
                          <div
                            key={idx}
                            className='bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700'
                          >
                            <div className='flex items-start justify-between mb-2'>
                              <p className='font-medium text-gray-900 dark:text-white'>
                                {lab.name}
                              </p>
                              {lab.status && (
                                <span
                                  className={`text-xs font-semibold px-2 py-1 rounded ${
                                    lab.status === 'NORMAL'
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                      : lab.status === 'ABNORMAL'
                                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  }`}
                                >
                                  {lab.status}
                                </span>
                              )}
                            </div>
                            <p className='text-gray-700 dark:text-gray-300 text-sm'>
                              {lab.value}
                              {lab.unit && (
                                <span className='ml-2 text-gray-500'>
                                  {lab.unit}
                                </span>
                              )}
                            </p>
                            {lab.normalRange && (
                              <p className='text-gray-500 dark:text-gray-400 text-xs mt-1'>
                                Normal Range: {lab.normalRange}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                {/* Follow-up */}
                {(record.followUpDate || record.followUpNotes) && (
                  <Section title='Follow-up'>
                    {record.followUpDate && (
                      <Field
                        label='Follow-up Date'
                        value={medicalRecordService.formatDate(
                          record.followUpDate
                        )}
                      />
                    )}
                    {record.followUpNotes && (
                      <Field
                        label='Follow-up Notes'
                        value={record.followUpNotes}
                        full
                      />
                    )}
                  </Section>
                )}

                {/* Metadata */}
                <Section title='Record Metadata'>
                  <Grid>
                    <Field
                      label='Created'
                      value={medicalRecordService.formatDateTime(
                        record.createdAt
                      )}
                    />
                    <Field
                      label='Last Updated'
                      value={medicalRecordService.formatDateTime(
                        record.updatedAt
                      )}
                    />
                  </Grid>
                </Section>
              </div>
            </>
          ) : null}

          {/* Animations */}
          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            @keyframes slideUp {
              from {
                transform: translateY(20px);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      </div>
    </>
  );
}

// Helper Components

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>{children}</div>
  );
}

function Field({
  label,
  value,
  full,
}: {
  label: string;
  value: string | undefined;
  full?: boolean;
}) {
  if (!value) return null;

  return (
    <div className={full ? 'col-span-2 md:col-span-2' : ''}>
      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
        {label}
      </label>
      <p className='text-gray-900 dark:text-gray-100 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 whitespace-pre-wrap'>
        {value}
      </p>
    </div>
  );
}
