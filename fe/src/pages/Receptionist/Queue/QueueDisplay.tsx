import { useEffect, useState } from "react";
import queueService, { type QueueDisplayDTO } from "../../../services/queueService";
import { QueueLoading } from "./SharedComponents";

// ==========================================
// PUBLIC DISPLAY - For TV screens in waiting area
// Shows only queue number + room, NO patient names (GDPR)
// ==========================================
export function QueuePublicDisplay() {
  const [data, setData] = useState<QueueDisplayDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchData = async () => {
    try {
      const res = await queueService.getPublicDisplay();
      setData(res);
    } catch {
      // silent retry
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return <QueueLoading />;

  const nowServing = data.filter((d) => d.status === "SERVING");
  const called = data.filter((d) => d.status === "CALLED");
  const waiting = data.filter((d) => d.status === "WAITING");

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <svg className="w-7 h-7 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Queue Display
        </h1>
        <div className="text-lg font-mono text-gray-600 dark:text-gray-400">
          {currentTime.toLocaleTimeString("vi-VN")}
        </div>
      </div>

      {/* Now Serving */}
      {nowServing.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            NOW SERVING
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nowServing.map((item, idx) => (
              <div
                key={`serving-${item.doctorId}-${idx}`}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-l-4 border-green-500"
              >
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                    #{item.queueNumber}
                  </div>
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Room {item.roomNumber || "—"}
                  </div>
                  <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {item.specialization || ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Called */}
      {called.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
            CALLED — Please proceed
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {called.map((item, idx) => (
              <div
                key={`called-${item.doctorId}-${idx}`}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow border-l-4 border-blue-500"
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    #{item.queueNumber}
                  </div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Room {item.roomNumber || "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waiting Summary */}
      {waiting.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-amber-600 dark:text-amber-400 mb-4">
            WAITING ({waiting.length})
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 p-4">
              {waiting.map((item, idx) => (
                <div
                  key={`waiting-${item.doctorId}-${idx}`}
                  className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                >
                  <div className="text-xl font-bold text-amber-700 dark:text-amber-400">
                    #{item.queueNumber}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Room {item.roomNumber || "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {data.length === 0 && (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <svg className="mx-auto w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium">No active queue at this time</p>
        </div>
      )}
    </div>
  );
}

// ==========================================
// INTERNAL DISPLAY - For staff with full patient info
// ==========================================
export function QueueInternalDisplay() {
  const [data, setData] = useState<QueueDisplayDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await queueService.getInternalDisplay();
      setData(res);
    } catch {
      // silent retry
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <QueueLoading />;

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500">
        <p className="text-lg font-medium">No active queue items</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Internal Queue Board
        </h3>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Auto-refresh 15s
        </span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="text-left px-4 py-3">Queue #</th>
              <th className="text-left px-4 py-3">Patient</th>
              <th className="text-left px-4 py-3">Code</th>
              <th className="text-left px-4 py-3">Doctor</th>
              <th className="text-left px-4 py-3">Room</th>
              <th className="text-center px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {data.map((item, idx) => {
              const statusColors: Record<string, string> = {
                SERVING: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                CALLED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                WAITING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
              };
              return (
                <tr key={`${item.doctorId}-${idx}`} className="text-sm hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 font-bold text-sm">
                      {item.queueNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {item.patientName || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs font-mono">
                    {item.appointmentCode || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {item.doctorName ? `Dr. ${item.doctorName}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {item.roomNumber || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${statusColors[item.status] || ""}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
