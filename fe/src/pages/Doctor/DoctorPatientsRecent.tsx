import { useEffect, useState } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import { useToast } from '../../hooks/useToast';
import {
  getRecentPatients,
  RecentPatientDTO,
} from '../../services/doctorService';

export default function DoctorPatientsRecent() {
  const { showToast } = useToast();
  const [patients, setPatients] = useState<RecentPatientDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecentPatients = async () => {
      try {
        setLoading(true);
        const data = await getRecentPatients(50);
        setPatients(data);
        if (data.length > 0) {
          showToast(`✅ Loaded ${data.length} recent patients`, 'success');
        }
      } catch (error) {
        console.error('Error loading recent patients:', error);
        showToast('❌ Failed to load recent patients', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadRecentPatients();
  }, [showToast]);

  const formatDateTime = (date: string | null, time: string | null): string => {
    if (!date) return 'N/A';
    try {
      const dateObj = new Date(date);
      let formatted = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      if (time) {
        formatted += ` at ${time}`;
      }
      return formatted;
    } catch {
      return date;
    }
  };

  return (
    <>
      <PageMeta
        title='Recent Patients | Doctor Panel'
        description='View your recent patients'
      />
      <PageBreadcrumb pageTitle='Recent' />

      <div className='space-y-6'>
        {/* Recent Patients Header */}
        <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]'>
          <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700'>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-white'>
              Recent Patients{' '}
              {patients.length > 0 && (
                <span className='text-gray-500'>({patients.length})</span>
              )}
            </h3>
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
              Your recently consulted patients sorted by latest visit
            </p>
          </div>

          {loading ? (
            <div className='px-6 py-12 text-center text-gray-500 dark:text-gray-400'>
              Loading recent patients...
            </div>
          ) : patients.length === 0 ? (
            <div className='px-6 py-12 text-center text-gray-500 dark:text-gray-400'>
              No recent patients
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-800'>
                <thead>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                      Patient Name
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                      Last Visit
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                      Reason
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                      Age
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                      Total Visits
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 dark:divide-gray-800'>
                  {patients.map((patient) => (
                    <tr
                      key={patient.id}
                      className='hover:bg-gray-50 dark:hover:bg-gray-700/30'
                    >
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-3'>
                          <img
                            src={
                              patient.avatarUrl ||
                              'https://via.placeholder.com/40x40?text=' +
                                patient.name[0]
                            }
                            alt={patient.name}
                            className='w-10 h-10 rounded-full object-cover'
                          />
                          <div>
                            <p className='font-medium text-gray-900 dark:text-white'>
                              {patient.name}
                            </p>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                              {patient.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='text-sm text-gray-800 dark:text-gray-200'>
                          {formatDateTime(
                            patient.lastVisitDate,
                            patient.lastVisitTime
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='text-sm text-gray-800 dark:text-gray-200 max-w-xs truncate'>
                          {patient.reasonForVisit || 'Not specified'}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='text-sm text-gray-800 dark:text-gray-200'>
                          {patient.age ? `${patient.age} years` : 'N/A'}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='text-sm font-medium text-gray-800 dark:text-gray-200'>
                          {patient.totalVisits}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <button className='inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition'>
                          Follow-up →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
