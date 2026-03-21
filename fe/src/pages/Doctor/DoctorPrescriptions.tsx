import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import prescriptionService, { PrescriptionDTO } from '../../services/prescriptionService';

interface PrescriptionStats {
  total: number;
  active: number;
  expired: number;
  cancelled: number;
  thisMonth: number;
}

export default function DoctorPrescriptions() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PrescriptionStats>({
    total: 0,
    active: 0,
    expired: 0,
    cancelled: 0,
    thisMonth: 0,
  });
  const [recent, setRecent] = useState<PrescriptionDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const page = await prescriptionService.getDoctorPrescriptions({
          pageNumber: 0,
          pageSize: 100,
        });
        const all = page.content || [];
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        setStats({
          total: all.length,
          active: all.filter((p) => p.status === 'ACTIVE').length,
          expired: all.filter((p) => p.status === 'EXPIRED').length,
          cancelled: all.filter((p) => p.status === 'CANCELLED').length,
          thisMonth: all.filter((p) => p.prescriptionDate && new Date(p.prescriptionDate) >= thisMonthStart).length,
        });

        // 5 most recent
        const sorted = [...all].sort(
          (a, b) => new Date(b.prescriptionDate).getTime() - new Date(a.prescriptionDate).getTime()
        );
        setRecent(sorted.slice(0, 5));
      } catch {
        // ignore – stats are non-critical
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = [
    { label: 'Total', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Active', value: stats.active, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Expired', value: stats.expired, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { label: 'This Month', value: stats.thisMonth, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  return (
    <>
      <PageMeta title='Prescriptions | Doctor Panel' description='Prescription overview' />
      <PageBreadcrumb pageTitle='Prescriptions' />

      <div className='space-y-6'>
        {/* Workflow notice */}
        <div className='rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 px-6 py-4 flex items-start gap-3'>
          <span className='text-blue-500 mt-0.5 text-lg'>ℹ</span>
          <div>
            <p className='text-sm font-medium text-blue-800 dark:text-blue-200'>
              To prescribe for a patient, use the <strong>Consultation</strong> workflow.
            </p>
            <p className='text-xs text-blue-600 dark:text-blue-300 mt-0.5'>
              Open an appointment → finalize the consultation → click "Create Prescription". This ensures every
              prescription is linked to a visit.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {statCards.map((s) => (
            <div
              key={s.label}
              className={`rounded-2xl border border-gray-200 dark:border-gray-800 ${s.bg} px-6 py-5`}
            >
              {loading ? (
                <div className='h-8 w-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded' />
              ) : (
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              )}
              <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <button
            onClick={() => navigate('/doctor/prescriptions/history')}
            className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-6 py-5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors'
          >
            <p className='text-lg font-semibold text-gray-800 dark:text-white'>📋 Prescription History</p>
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
              Browse, search and filter all your issued prescriptions. View details, void or reissue.
            </p>
          </button>
          <button
            onClick={() => navigate('/doctor/prescriptions/templates')}
            className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-6 py-5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors'
          >
            <p className='text-lg font-semibold text-gray-800 dark:text-white'>📄 Templates</p>
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
              Manage reusable prescription templates for common conditions.
            </p>
          </button>
        </div>

        {/* Recent prescriptions */}
        <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]'>
          <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'>
            <h3 className='text-base font-semibold text-gray-800 dark:text-white'>Recent Prescriptions</h3>
            <button
              onClick={() => navigate('/doctor/prescriptions/history')}
              className='text-sm text-blue-500 hover:text-blue-600 font-medium'
            >
              View all →
            </button>
          </div>

          {loading ? (
            <div className='px-6 py-8 text-center text-gray-400 text-sm'>Loading…</div>
          ) : recent.length === 0 ? (
            <div className='px-6 py-8 text-center text-gray-400 text-sm'>No prescriptions yet</div>
          ) : (
            <div className='divide-y divide-gray-100 dark:divide-gray-800'>
              {recent.map((p) => (
                <div key={p.id} className='px-6 py-3 flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-900 dark:text-white'>{p.patientName || '-'}</p>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                      {p.prescriptionCode || `PRE-${p.id}`} · {p.prescriptionDate}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : p.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {p.status || 'ACTIVE'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
