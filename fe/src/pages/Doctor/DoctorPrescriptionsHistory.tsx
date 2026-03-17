import { useEffect, useState } from 'react';
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

export default function DoctorPrescriptionsHistory() {
  const [prescriptions, setPrescriptions] = useState<FilteredPrescription[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const { toast, showToast, dismissToast } = useToast();
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<
    FilteredPrescription[]
  >([]);

  // Load prescriptions on mount
  useEffect(() => {
    loadPrescriptions();
  }, []);

  // Filter prescriptions when search or status changes
  useEffect(() => {
    let results = prescriptions;

    // Filter by status
    if (statusFilter !== 'All') {
      results = results.filter((p) => p.status === statusFilter);
    }

    // Filter by search term (patient name, prescription code, or medicine)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      results = results.filter((p) => {
        return (
          p.patientName?.toLowerCase().includes(term) ||
          p.prescriptionCode?.toLowerCase().includes(term) ||
          p.medicineList?.toLowerCase().includes(term) ||
          p.diagnosis?.toLowerCase().includes(term)
        );
      });
    }

    setFilteredPrescriptions(results);
  }, [searchTerm, statusFilter, prescriptions]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await prescriptionService.getDoctorPrescriptions({
        pageNumber: 0,
        pageSize: 1000, // Load all for now
      });

      // Enrich prescription data with medicine count and list
      const enriched = (response.content || []).map((p) => ({
        ...p,
        medicineCount: p.items?.length || 0,
        medicineList:
          p.items?.map((item) => item.medicineName).join(', ') || '',
      }));

      setPrescriptions(enriched);
    } catch (error) {
      console.error(error);
      showToast.error('Failed to load prescription history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeColor = (status: string | undefined) => {
    if (!status)
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'CANCELLED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <>
      <PageMeta
        title='Prescription History | Doctor Panel'
        description='View your prescription history'
      />
      <PageBreadcrumb pageTitle='Prescription History' />

      <div className='space-y-6'>
        {/* History Header */}
        <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]'>
          {/* Header with search and filters */}
          <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700 space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold text-gray-800 dark:text-white'>
                Prescription History
              </h3>
              <span className='text-sm text-gray-500 dark:text-gray-400'>
                {filteredPrescriptions.length} prescription
                {filteredPrescriptions.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Search bar */}
            <div className='mb-4'>
              <input
                type='text'
                placeholder='Search by patient name, prescription code, or medicine...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20'
              />
            </div>

            {/* Status filter buttons */}
            <div className='flex gap-2 flex-wrap'>
              {['All', 'ACTIVE', 'EXPIRED', 'CANCELLED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    statusFilter === status
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-800'>
              <thead>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                    Patient
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                    Code
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                    Medicines
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                    Date
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 dark:divide-gray-800'>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='px-6 py-12 text-center text-gray-500 dark:text-gray-400'
                    >
                      Loading prescriptions...
                    </td>
                  </tr>
                ) : filteredPrescriptions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='px-6 py-12 text-center text-gray-500 dark:text-gray-400'
                    >
                      {prescriptions.length === 0
                        ? 'No prescription history found'
                        : 'No prescriptions match your search'}
                    </td>
                  </tr>
                ) : (
                  filteredPrescriptions.map((prescription) => (
                    <tr
                      key={prescription.id}
                      className='hover:bg-gray-50 dark:hover:bg-white/5 transition-colors'
                    >
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div>
                          <p className='text-sm font-medium text-gray-900 dark:text-white'>
                            {prescription.patientName || '-'}
                          </p>
                          <p className='text-xs text-gray-500 dark:text-gray-400'>
                            {prescription.patientPhone || '-'}
                          </p>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <code className='text-sm font-mono text-gray-600 dark:text-gray-300'>
                          {prescription.prescriptionCode || '-'}
                        </code>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='text-sm text-gray-600 dark:text-gray-300'>
                          <p className='font-medium'>
                            {prescription.medicineCount} medicine(s)
                          </p>
                          <p className='text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs'>
                            {prescription.medicineList || '-'}
                          </p>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300'>
                        {formatDate(prescription.prescriptionDate)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                            prescription.status
                          )}`}
                        >
                          {prescription.status || 'UNKNOWN'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
