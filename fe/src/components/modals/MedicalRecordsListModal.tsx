import { useState, useEffect } from 'react';
import medicalRecordService, {
  MedicalRecordDTO,
  PageResponse,
} from '../../services/medicalRecordService';

interface MedicalRecordsListModalProps {
  isOpen: boolean;
  patientId?: number;
  onClose: () => void;
  onSelectRecord?: (record: MedicalRecordDTO) => void;
  isDoctorView?: boolean;
}

export default function MedicalRecordsListModal({
  isOpen,
  patientId,
  onClose,
  onSelectRecord,
  isDoctorView = true,
}: MedicalRecordsListModalProps) {
  const [records, setRecords] = useState<MedicalRecordDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const fetchRecords = async () => {
      setLoading(true);
      setError(null);
      try {
        let result: PageResponse<MedicalRecordDTO>;

        if (isDoctorView && patientId) {
          result = await medicalRecordService.getDoctorPatientRecords(
            patientId,
            pageNumber,
            10
          );
        } else if (isDoctorView) {
          result = await medicalRecordService.getMyMedicalRecords({
            pageNumber,
            pageSize: 10,
          });
        } else {
          result = await medicalRecordService.getMyRecords({
            pageNumber,
            pageSize: 10,
          });
        }

        setRecords(result.content);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load medical records'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [isOpen, pageNumber, patientId, isDoctorView]);

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
          className='bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto'
          style={{
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          {/* Header */}
          <div className='sticky top-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 px-6 py-6 flex items-start justify-between'>
            <div className='flex-1'>
              <h2 className='text-2xl font-bold text-white mb-1'>
                Medical Records
              </h2>
              <p className='text-purple-100 text-sm'>
                Total: {totalElements} record{totalElements !== 1 ? 's' : ''}
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
          <div className='p-6'>
            {loading ? (
              <div className='flex items-center justify-center py-12'>
                <div className='flex flex-col items-center gap-3'>
                  <div className='w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-purple-500 rounded-full animate-spin' />
                  <p className='text-gray-600 dark:text-gray-400'>
                    Loading medical records...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
                <p className='text-red-700 dark:text-red-400'>{error}</p>
              </div>
            ) : records.length === 0 ? (
              <div className='text-center py-12'>
                <svg
                  className='w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.5}
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
                <p className='text-gray-600 dark:text-gray-400'>
                  No medical records found
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {records.map((record) => (
                  <div
                    key={record.id}
                    className='bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer'
                    onClick={() => onSelectRecord?.(record)}
                  >
                    <div className='flex items-start justify-between mb-3'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <h3 className='font-semibold text-gray-900 dark:text-white'>
                            {record.recordCode}
                          </h3>
                          {medicalRecordService.isRecent(record.visitDate) && (
                            <span className='px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded'>
                              Recent
                            </span>
                          )}
                        </div>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                          Visit Date:{' '}
                          {medicalRecordService.formatDate(record.visitDate)}
                        </p>
                      </div>
                      {medicalRecordService.hasCriticalInfo(record) && (
                        <svg
                          className='w-5 h-5 text-purple-500'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                            clipRule='evenodd'
                          />
                        </svg>
                      )}
                    </div>

                    {record.diagnosis && (
                      <p className='text-sm text-gray-700 dark:text-gray-300 mb-2'>
                        <span className='font-medium'>Diagnosis:</span>{' '}
                        {record.diagnosis}
                      </p>
                    )}

                    <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700'>
                      <span>Dr. {record.doctorName}</span>
                      <span>
                        {medicalRecordService.formatDate(record.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700'>
                <button
                  onClick={() => setPageNumber((p) => Math.max(0, p - 1))}
                  disabled={pageNumber === 0}
                  className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                >
                  Previous
                </button>
                <span className='text-sm text-gray-600 dark:text-gray-400'>
                  Page {pageNumber + 1} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setPageNumber((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={pageNumber === totalPages - 1}
                  className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                >
                  Next
                </button>
              </div>
            )}
          </div>

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
