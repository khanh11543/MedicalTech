import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import prescriptionService, {
  PrescriptionDTO,
} from '../../services/prescriptionService';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/common';

interface FilteredPrescription extends PrescriptionDTO {
  medicineCount: number;
  medicineList: string;
  prescriptionCode?: string;
  status?: string;
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function PrescriptionDetailModal({
  prescription,
  onClose,
}: {
  prescription: FilteredPrescription;
  onClose: () => void;
}) {
  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
      onClick={onClose}
    >
      <div
        className='bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-semibold text-gray-800 dark:text-white'>
              Prescription Detail
            </h2>
            <code className='text-xs text-gray-500 dark:text-gray-400'>
              {prescription.prescriptionCode || `PRE-${prescription.id}`}
            </code>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none'
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className='px-6 py-4 space-y-4'>
          {/* Status */}
          <div className='flex items-center gap-2'>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                prescription.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : prescription.status === 'CANCELLED'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
              }`}
            >
              {prescription.status || 'ACTIVE'}
            </span>
            <span className='text-xs text-gray-500 dark:text-gray-400'>
              {prescription.prescriptionDate}
            </span>
          </div>

          {/* Patient & Doctor */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1'>Patient</p>
              <p className='text-sm font-semibold text-gray-900 dark:text-white'>{prescription.patientName || '-'}</p>
              {prescription.patientPhone && (
                <p className='text-xs text-gray-500 dark:text-gray-400'>{prescription.patientPhone}</p>
              )}
            </div>
            <div>
              <p className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1'>Appointment</p>
              <p className='text-sm text-gray-700 dark:text-gray-300'>
                {prescription.appointmentDate ? String(prescription.appointmentDate) : '-'}
              </p>
            </div>
          </div>

          {/* Diagnosis */}
          {prescription.diagnosis && (
            <div>
              <p className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1'>Diagnosis</p>
              <p className='text-sm text-gray-700 dark:text-gray-300'>{prescription.diagnosis}</p>
            </div>
          )}

          {/* Medications */}
          <div>
            <p className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2'>
              Medications ({prescription.medicineCount})
            </p>
            <div className='space-y-2'>
              {(prescription.items || []).map((item, idx) => (
                <div
                  key={idx}
                  className='rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800'
                >
                  <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                    {idx + 1}. {item.medicineName}
                  </p>
                  <div className='text-xs text-gray-600 dark:text-gray-400 mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5'>
                    <span><strong>Dosage:</strong> {item.dosage || '-'}</span>
                    <span><strong>Frequency:</strong> {item.frequency || '-'}</span>
                    {item.duration && <span><strong>Duration:</strong> {item.duration}</span>}
                    {item.quantity && <span><strong>Qty:</strong> {item.quantity} {item.unit || ''}</span>}
                    {item.instructions && (
                      <span className='col-span-2'><strong>Instructions:</strong> {item.instructions}</span>
                    )}
                  </div>
                </div>
              ))}
              {prescription.medicineCount === 0 && (
                <p className='text-sm text-gray-400'>No medications listed</p>
              )}
            </div>
          </div>

          {/* Notes */}
          {prescription.notes && (
            <div>
              <p className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1'>Notes</p>
              <p className='text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>{prescription.notes}</p>
            </div>
          )}

          {/* Follow-up */}
          {prescription.followUpDate && (
            <div>
              <p className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1'>Follow-up Date</p>
              <p className='text-sm text-gray-700 dark:text-gray-300'>{String(prescription.followUpDate)}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Void Modal ────────────────────────────────────────────────────────────────
function VoidModal({
  prescription,
  onConfirm,
  onClose,
  loading,
}: {
  prescription: FilteredPrescription;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
      onClick={onClose}
    >
      <div
        className='bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700'>
          <h2 className='text-base font-semibold text-red-600'>Void Prescription</h2>
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
            {prescription.prescriptionCode || `PRE-${prescription.id}`} — {prescription.patientName}
          </p>
        </div>
        <div className='px-6 py-4 space-y-3'>
          <p className='text-sm text-gray-700 dark:text-gray-300'>
            This prescription will be permanently cancelled. A void reason is required.
          </p>
          <textarea
            className='w-full h-24 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none'
            placeholder='Reason for voiding (required)…'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className='px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600'
          >
            Cancel
          </button>
          <button
            disabled={!reason.trim() || loading}
            onClick={() => onConfirm(reason.trim())}
            className='px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Voiding…' : 'Void Prescription'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DoctorPrescriptionsHistory() {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<FilteredPrescription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const { toast, showToast, dismissToast } = useToast();
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<FilteredPrescription[]>([]);

  // modals
  const [viewTarget, setViewTarget] = useState<FilteredPrescription | null>(null);
  const [voidTarget, setVoidTarget] = useState<FilteredPrescription | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  useEffect(() => {
    let results = prescriptions;
    if (statusFilter !== 'All') {
      results = results.filter((p) => p.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      results = results.filter(
        (p) =>
          p.patientName?.toLowerCase().includes(term) ||
          p.prescriptionCode?.toLowerCase().includes(term) ||
          p.medicineList?.toLowerCase().includes(term) ||
          p.diagnosis?.toLowerCase().includes(term)
      );
    }
    setFilteredPrescriptions(results);
  }, [searchTerm, statusFilter, prescriptions]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await prescriptionService.getDoctorPrescriptions({
        pageNumber: 0,
        pageSize: 1000,
      });
      const enriched = (response.content || []).map((p) => ({
        ...p,
        medicineCount: p.items?.length || 0,
        medicineList: p.items?.map((item) => item.medicineName).join(', ') || '',
      }));
      setPrescriptions(enriched);
    } catch {
      showToast('Failed to load prescription history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVoidConfirm = async (reason: string) => {
    if (!voidTarget) return;
    try {
      setActionLoading(true);
      await prescriptionService.voidPrescription(voidTarget.id, reason);
      showToast('Prescription voided successfully', 'success');
      setVoidTarget(null);
      await loadPrescriptions();
    } catch {
      showToast('Failed to void prescription', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReissue = (p: FilteredPrescription) => {
    navigate('/doctor/prescriptions/create', {
      state: {
        reissueMode: true,
        reissueFromCode: p.prescriptionCode || `PRE-${p.id}`,
        patientId: p.patientId,
        patientName: p.patientName,
        appointmentId: p.appointmentId,
        diagnosis: p.diagnosis,
        notes: p.notes,
        followUpDate: p.followUpDate,
        templateItems: p.items,
      },
    });
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statusBadge = (status: string | undefined) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'EXPIRED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <>
      <PageMeta title='Prescription History | Doctor Panel' description='View your prescription history' />
      <PageBreadcrumb pageTitle='Prescription History' />

      <div className='space-y-6'>
        <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]'>
          {/* Header */}
          <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700 space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold text-gray-800 dark:text-white'>Prescription History</h3>
              <span className='text-sm text-gray-500 dark:text-gray-400'>
                {filteredPrescriptions.length} result{filteredPrescriptions.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Search */}
            <input
              type='text'
              placeholder='Search by patient, code, medicine or diagnosis…'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 dark:focus:border-blue-400'
            />

            {/* Status filter */}
            <div className='flex gap-2 flex-wrap'>
              {['All', 'ACTIVE', 'EXPIRED', 'CANCELLED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    statusFilter === s
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-800'>
              <thead>
                <tr>
                  {['Patient', 'Code', 'Medicines', 'Date', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 dark:divide-gray-800'>
                {loading ? (
                  <tr>
                    <td colSpan={6} className='px-6 py-12 text-center text-gray-400 text-sm'>
                      Loading prescriptions…
                    </td>
                  </tr>
                ) : filteredPrescriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className='px-6 py-12 text-center text-gray-400 text-sm'>
                      {prescriptions.length === 0 ? 'No prescription history found' : 'No prescriptions match your search'}
                    </td>
                  </tr>
                ) : (
                  filteredPrescriptions.map((p) => (
                    <tr key={p.id} className='hover:bg-gray-50 dark:hover:bg-white/5 transition-colors'>
                      {/* Patient */}
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <p className='text-sm font-medium text-gray-900 dark:text-white'>{p.patientName || '-'}</p>
                        <p className='text-xs text-gray-500 dark:text-gray-400'>{p.patientPhone || ''}</p>
                      </td>
                      {/* Code */}
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <code className='text-sm font-mono text-gray-600 dark:text-gray-300'>
                          {p.prescriptionCode || '-'}
                        </code>
                      </td>
                      {/* Medicines */}
                      <td className='px-6 py-4'>
                        <p className='text-sm font-medium text-gray-700 dark:text-gray-200'>
                          {p.medicineCount} item{p.medicineCount !== 1 ? 's' : ''}
                        </p>
                        <p className='text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs'>
                          {p.medicineList || '-'}
                        </p>
                      </td>
                      {/* Date */}
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300'>
                        {formatDate(p.prescriptionDate)}
                      </td>
                      {/* Status */}
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(p.status)}`}>
                          {p.status || 'ACTIVE'}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center gap-2'>
                          {/* View */}
                          <button
                            onClick={() => setViewTarget(p)}
                            className='px-2.5 py-1 text-xs font-medium rounded bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40'
                          >
                            View
                          </button>
                          {/* Void — only on ACTIVE */}
                          {p.status === 'ACTIVE' && (
                            <button
                              onClick={() => setVoidTarget(p)}
                              disabled={actionLoading}
                              className='px-2.5 py-1 text-xs font-medium rounded bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                              Void
                            </button>
                          )}
                          {/* Reissue — only on CANCELLED */}
                          {p.status === 'CANCELLED' && (
                            <button
                              onClick={() => handleReissue(p)}
                              className='px-2.5 py-1 text-xs font-medium rounded bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40'
                            >
                              Reissue
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {viewTarget && (
        <PrescriptionDetailModal prescription={viewTarget} onClose={() => setViewTarget(null)} />
      )}
      {voidTarget && (
        <VoidModal
          prescription={voidTarget}
          onConfirm={handleVoidConfirm}
          onClose={() => setVoidTarget(null)}
          loading={actionLoading}
        />
      )}

      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
