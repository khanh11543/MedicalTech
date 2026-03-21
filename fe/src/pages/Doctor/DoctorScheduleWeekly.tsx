import { useState, useEffect, useMemo, useCallback } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import doctorScheduleService, {
  DoctorScheduleDTO,
  TimeSlotDTO,
  GenerateSlotsDTO,
} from '../../services/doctorScheduleService';
import { useToast } from '../../hooks/useToast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function timeToMinutes(t: string): number {
  const parts = t.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function normalizeTime(t: string | undefined | null): string {
  if (!t) return '00:00';
  const parts = t.split(':');
  return `${parts[0].padStart(2, '0')}:${(parts[1] || '00').padStart(2, '0')}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return toDateStr(a) === toDateStr(b);
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Week starts Monday; weekDates[i] → service dayOfWeek = (i+1)%7
// because Mon=1, Tue=2, ..., Sat=6, Sun=0
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CAL_START    = 6;  // 06:00
const CAL_END      = 22; // 22:00
const PX_PER_HOUR  = 80;

interface SlotColor { bg: string; border: string; text: string; dot: string }
const SLOT_COLORS: Record<string, SlotColor> = {
  AVAILABLE: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-400' },
  BOOKED:    { bg: 'bg-blue-50 dark:bg-blue-900/30',       border: 'border-blue-300 dark:border-blue-700',       text: 'text-blue-700 dark:text-blue-300',       dot: 'bg-blue-400'    },
  BLOCKED:   { bg: 'bg-red-50 dark:bg-red-900/30',         border: 'border-red-300 dark:border-red-700',         text: 'text-red-600 dark:text-red-400',         dot: 'bg-red-400'     },
  COMPLETED: { bg: 'bg-gray-50 dark:bg-gray-800',          border: 'border-gray-300 dark:border-gray-600',       text: 'text-gray-500 dark:text-gray-400',       dot: 'bg-gray-400'    },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DoctorScheduleWeekly() {
  const { showToast } = useToast();

  const [weekStart, setWeekStart]   = useState<Date>(() => getMonday(new Date()));
  const [schedules, setSchedules]   = useState<DoctorScheduleDTO[]>([]);
  const [slots,     setSlots]       = useState<TimeSlotDTO[]>([]);
  const [loading,   setLoading]     = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error,     setError]       = useState<string | null>(null);

  // 7 dates Mon → Sun
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isCurrentWeek = useMemo(
    () => toDateStr(weekStart) === toDateStr(getMonday(new Date())),
    [weekStart],
  );

  // Load recurring schedules + time slots for the week
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const startDate = toDateStr(weekDates[0]);
      const endDate   = toDateStr(weekDates[6]);
      const [sc, sl] = await Promise.all([
        doctorScheduleService.getDoctorSchedules(),
        doctorScheduleService.listTimeSlots(startDate, endDate),
      ]);
      setSchedules(sc);
      setSlots(sl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  }, [weekDates]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Generate time slots for the displayed week
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const dto: GenerateSlotsDTO = {
        startDate: toDateStr(weekDates[0]),
        endDate:   toDateStr(weekDates[6]),
        overwriteExisting: false,
      };
      const result = await doctorScheduleService.generateTimeSlots(dto);
      showToast(result.message || 'Slots generated successfully', 'success');
      const newSlots = await doctorScheduleService.listTimeSlots(
        toDateStr(weekDates[0]), toDateStr(weekDates[6]),
      );
      setSlots(newSlots);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to generate slots', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // ─── Calendar helpers ─────────────────────────────────────────────────────

  const hours = useMemo(
    () => Array.from({ length: CAL_END - CAL_START }, (_, i) => CAL_START + i),
    [],
  );
  const calHeight = hours.length * PX_PER_HOUR;

  // Map weekDates[dayIndex] → service dayOfWeek: (dayIndex+1)%7
  function getScheduleForDay(dayIndex: number): DoctorScheduleDTO | undefined {
    const dow = (dayIndex + 1) % 7;
    return schedules.find(s => s.dayOfWeek === dow && s.isActive !== false);
  }

  function getSlotsForDate(date: Date): TimeSlotDTO[] {
    const ds = toDateStr(date);
    return slots.filter(s => s.slotDate === ds);
  }

  // Stats per status
  const countByStatus = useMemo(
    () => slots.reduce<Record<string, number>>((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {}),
    [slots],
  );

  const weekLabel = (() => {
    const s = weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const e = weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${s} – ${e}`;
  })();

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <PageMeta
        title='Weekly Schedule | Doctor Panel'
        description='View your weekly working schedule'
      />
      <PageBreadcrumb pageTitle='Weekly Schedule' />

      <div className='space-y-5'>

        {/* ── Top bar ── */}
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
              Weekly Schedule
            </h2>
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-0.5'>
              Calendar view of your working hours and time slots
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || loading}
            className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors'
          >
            {generating ? (
              <svg className='w-4 h-4 animate-spin' viewBox='0 0 24 24' fill='none'>
                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
              </svg>
            ) : (
              <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
              </svg>
            )}
            {generating ? 'Generating…' : 'Generate Slots'}
          </button>
        </div>

        {/* ── Week navigator ── */}
        <div className='rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] px-4 py-3 flex items-center justify-between'>
          <button
            onClick={() => setWeekStart(d => addDays(d, -7))}
            className='inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors'
          >
            <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
              <path strokeLinecap='round' strokeLinejoin='round' d='M15 19l-7-7 7-7' />
            </svg>
            Previous
          </button>

          <div className='flex items-center gap-3'>
            <span className='text-base font-semibold text-gray-800 dark:text-white'>
              {weekLabel}
            </span>
            {!isCurrentWeek && (
              <button
                onClick={() => setWeekStart(getMonday(new Date()))}
                className='px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors'
              >
                Today
              </button>
            )}
          </div>

          <button
            onClick={() => setWeekStart(d => addDays(d, 7))}
            className='inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors'
          >
            Next
            <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
              <path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' />
            </svg>
          </button>
        </div>

        {/* ── Stats row ── */}
        {!loading && !error && slots.length > 0 && (
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
            {[
              { key: 'AVAILABLE', label: 'Available',  numClass: 'text-emerald-600 dark:text-emerald-400', cardClass: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30' },
              { key: 'BOOKED',    label: 'Booked',     numClass: 'text-blue-600 dark:text-blue-400',       cardClass: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30'         },
              { key: 'BLOCKED',   label: 'Blocked',    numClass: 'text-red-600 dark:text-red-400',         cardClass: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30'             },
              { key: 'COMPLETED', label: 'Completed',  numClass: 'text-gray-500 dark:text-gray-400',       cardClass: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'               },
            ].map(({ key, label, numClass, cardClass }) => (
              <div key={key} className={`rounded-xl border p-4 ${cardClass}`}>
                <p className='text-sm text-gray-500 dark:text-gray-400'>{label}</p>
                <p className={`text-2xl font-bold mt-0.5 ${numClass}`}>
                  {countByStatus[key] || 0}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Error banner ── */}
        {error && !loading && (
          <div className='rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 p-5 flex items-center gap-4'>
            <svg className='w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
              <path strokeLinecap='round' strokeLinejoin='round' d='M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
            <div className='flex-1'>
              <p className='font-semibold text-red-800 dark:text-red-200'>Failed to Load Schedule</p>
              <p className='text-sm text-red-700 dark:text-red-300 mt-0.5'>{error}</p>
            </div>
            <button
              onClick={loadData}
              className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors'
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Calendar card ── */}
        <div className='rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] overflow-hidden'>

          {/* Day header row */}
          <div
            className='grid border-b border-gray-200 dark:border-gray-700 divide-x divide-gray-200 dark:divide-gray-700'
            style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}
          >
            {/* Corner spacer */}
            <div className='bg-gray-50 dark:bg-gray-800/50' />

            {weekDates.map((date, i) => {
              const isToday   = isSameDay(date, today);
              const sched     = getScheduleForDay(i);
              const daySlots  = getSlotsForDate(date);
              const hasBooked = daySlots.some(s => s.status === 'BOOKED');

              return (
                <div
                  key={i}
                  className={`py-3 px-2 text-center ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}
                >
                  <div className='text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider'>
                    {DAY_LABELS[i]}
                  </div>
                  <div className={`text-xl font-bold mt-0.5 leading-none ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-white'}`}>
                    {date.getDate()}
                  </div>
                  <div className='text-[11px] text-gray-400 dark:text-gray-500 mt-0.5'>
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  {sched ? (
                    <div className='mt-1.5 text-[10px] text-indigo-500 dark:text-indigo-400 font-medium truncate'>
                      {normalizeTime(sched.startTime as unknown as string)}–{normalizeTime(sched.endTime as unknown as string)}
                    </div>
                  ) : (
                    <div className='mt-1.5 text-[10px] text-gray-300 dark:text-gray-700'>Day off</div>
                  )}
                  {hasBooked && (
                    <div className='flex justify-center mt-1'>
                      <span className='w-1.5 h-1.5 rounded-full bg-blue-400' />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          {loading ? (
            <div className='flex items-center justify-center py-24 gap-3'>
              <svg className='w-8 h-8 animate-spin text-blue-600 dark:text-blue-400' fill='none' viewBox='0 0 24 24'>
                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
              </svg>
              <span className='text-gray-500 dark:text-gray-400 font-medium'>Loading schedule…</span>
            </div>
          ) : (
            <div className='overflow-y-auto' style={{ maxHeight: '580px' }}>
              <div
                className='grid'
                style={{ gridTemplateColumns: '56px repeat(7, 1fr)', height: calHeight }}
              >
                {/* Time labels column */}
                <div className='relative bg-gray-50 dark:bg-gray-800/30 border-r border-gray-100 dark:border-gray-800' style={{ height: calHeight }}>
                  {hours.map(h => (
                    <div
                      key={h}
                      className='absolute right-2 text-[11px] text-gray-400 dark:text-gray-500 select-none leading-none'
                      style={{ top: (h - CAL_START) * PX_PER_HOUR - 6 }}
                    >
                      {String(h).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDates.map((date, dayIndex) => {
                  const sched    = getScheduleForDay(dayIndex);
                  const daySlots = getSlotsForDate(date);
                  const isToday  = isSameDay(date, today);

                  let workBlockTop    = 0;
                  let workBlockHeight = 0;
                  let startMin        = 0;

                  if (sched) {
                    const st = normalizeTime(sched.startTime as unknown as string);
                    const et = normalizeTime(sched.endTime   as unknown as string);
                    startMin        = timeToMinutes(st);
                    const endMin    = timeToMinutes(et);
                    workBlockTop    = Math.max(0, (startMin / 60 - CAL_START) * PX_PER_HOUR);
                    workBlockHeight = ((endMin - startMin) / 60) * PX_PER_HOUR;
                  }

                  return (
                    <div
                      key={dayIndex}
                      className={`relative border-l border-gray-100 dark:border-gray-800 ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/5' : 'bg-white dark:bg-transparent'}`}
                      style={{ height: calHeight }}
                    >
                      {/* Hour grid lines */}
                      {hours.map(h => (
                        <div
                          key={h}
                          className='absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800'
                          style={{ top: (h - CAL_START) * PX_PER_HOUR }}
                        />
                      ))}

                      {/* Half-hour guide lines */}
                      {hours.map(h => (
                        <div
                          key={`h${h}`}
                          className='absolute left-0 right-0 border-t border-dashed border-gray-50 dark:border-gray-800/60'
                          style={{ top: (h - CAL_START) * PX_PER_HOUR + PX_PER_HOUR / 2 }}
                        />
                      ))}

                      {/* Current-time indicator */}
                      {isToday && isCurrentWeek && (() => {
                        const now     = new Date();
                        const nowMin  = now.getHours() * 60 + now.getMinutes();
                        const lineTop = (nowMin / 60 - CAL_START) * PX_PER_HOUR;
                        if (lineTop < 0 || lineTop > calHeight) return null;
                        return (
                          <div
                            className='absolute left-0 right-0 z-20 flex items-center pointer-events-none'
                            style={{ top: lineTop }}
                          >
                            <span className='w-2 h-2 rounded-full bg-red-500 flex-shrink-0 -ml-1' />
                            <span className='flex-1 border-t-2 border-red-400' />
                          </div>
                        );
                      })()}

                      {/* Working-hours block */}
                      {sched && workBlockHeight > 0 && (
                        <div
                          className='absolute left-1 right-1 rounded-lg bg-indigo-50/80 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 overflow-hidden z-10'
                          style={{ top: workBlockTop, height: workBlockHeight }}
                        >
                          {daySlots.length === 0 ? (
                            <div className='flex items-center justify-center h-full'>
                              <span className='text-[11px] text-indigo-300 dark:text-indigo-600'>No slots</span>
                            </div>
                          ) : (
                            daySlots.map(slot => {
                              const sMin      = timeToMinutes(normalizeTime(slot.startTime));
                              const eMin      = timeToMinutes(normalizeTime(slot.endTime));
                              const slotTop   = ((sMin - startMin) / 60) * PX_PER_HOUR;
                              const slotH     = Math.max(((eMin - sMin) / 60) * PX_PER_HOUR, 16);
                              const col       = SLOT_COLORS[slot.status] || SLOT_COLORS['AVAILABLE'];
                              return (
                                <div
                                  key={slot.id}
                                  title={`${normalizeTime(slot.startTime)} – ${normalizeTime(slot.endTime)}: ${slot.status}`}
                                  className={`absolute left-0.5 right-0.5 rounded border flex items-center overflow-hidden cursor-default ${col.bg} ${col.border}`}
                                  style={{ top: slotTop, height: slotH }}
                                >
                                  <span className={`w-1 self-stretch flex-shrink-0 ${col.dot}`} />
                                  <span className={`text-[10px] font-medium px-1 truncate leading-none ${col.text}`}>
                                    {normalizeTime(slot.startTime)}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}

                      {/* Off-day watermark */}
                      {!sched && (
                        <div className='absolute inset-0 flex items-center justify-center pointer-events-none select-none'>
                          <span className='text-xs text-gray-200 dark:text-gray-800 font-medium [writing-mode:vertical-rl]'>
                            Day off
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── No-slots notice ── */}
        {!loading && !error && schedules.length > 0 && slots.length === 0 && (
          <div className='rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10 p-5 flex items-start gap-4'>
            <svg className='w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
              <path strokeLinecap='round' strokeLinejoin='round' d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z' />
            </svg>
            <div>
              <p className='font-semibold text-amber-800 dark:text-amber-200'>No time slots for this week</p>
              <p className='text-sm text-amber-700 dark:text-amber-300 mt-0.5'>
                Your recurring schedule is set up but no slots exist for this week. Click <strong>Generate Slots</strong> to create them.
              </p>
            </div>
          </div>
        )}

        {/* ── No-schedule notice ── */}
        {!loading && !error && schedules.length === 0 && (
          <div className='rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.02] p-10 text-center'>
            <svg className='w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
              <path strokeLinecap='round' strokeLinejoin='round' d='M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5' />
            </svg>
            <p className='font-semibold text-gray-600 dark:text-gray-300'>No recurring schedule configured</p>
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
              Set up your weekly schedule pattern to start generating time slots.
            </p>
          </div>
        )}

        {/* ── Legend ── */}
        {!loading && (
          <div className='flex flex-wrap items-center gap-x-5 gap-y-2 px-1'>
            <span className='text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide'>Legend</span>
            {[
              { label: 'Working hours', dotClass: 'bg-indigo-300', borderClass: 'border-indigo-300' },
              { label: 'Available',     dotClass: 'bg-emerald-400', borderClass: 'border-emerald-400' },
              { label: 'Booked',        dotClass: 'bg-blue-400',    borderClass: 'border-blue-400'    },
              { label: 'Blocked',       dotClass: 'bg-red-400',     borderClass: 'border-red-400'     },
              { label: 'Completed',     dotClass: 'bg-gray-400',    borderClass: 'border-gray-400'    },
            ].map(({ label, dotClass, borderClass }) => (
              <div key={label} className='flex items-center gap-1.5'>
                <span className={`w-3 h-3 rounded-sm flex-shrink-0 ${dotClass} border ${borderClass}`} />
                <span className='text-xs text-gray-600 dark:text-gray-400'>{label}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  );
}
