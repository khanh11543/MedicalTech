import type { DoctorCardDto } from '@/services/dashboardApi';

export function formatConsultationFee(fee: number | string | null | undefined): string {
  if (fee === null || fee === undefined) return '—';
  const n = typeof fee === 'string' ? parseFloat(fee) : fee;
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US').format(n) + ' VND';
}

export function ratingNum(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
}

export function doctorHoursLabel(d: DoctorCardDto): string {
  if (d.city?.trim()) return d.city;
  if (d.experienceYears != null && d.experienceYears > 0) return `${d.experienceYears} yrs exp`;
  return 'Book now';
}
