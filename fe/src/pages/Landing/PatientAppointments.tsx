import { useState } from "react";

type TabKey = "upcoming" | "completed" | "cancelled";
type Status = "CONFIRMED" | "PENDING" | "COMPLETED" | "CANCELLED" | "CHECKED_IN";

interface Appointment {
  id: number;
  code: string;
  doctorName: string;
  specialization: string;
  date: string;
  startTime: string;
  endTime: string;
  status: Status;
  paymentStatus: "PAID" | "UNPAID";
  amount: number;
  reasonForVisit: string;
}

const statusConfig: Record<Status, { label: string; dot: string; bg: string; text: string }> = {
  CONFIRMED:  { label: "Confirmed",  dot: "bg-emerald-500", bg: "bg-emerald-50",  text: "text-emerald-700" },
  PENDING:    { label: "Pending",    dot: "bg-amber-500",   bg: "bg-amber-50",    text: "text-amber-700" },
  COMPLETED:  { label: "Completed",  dot: "bg-blue-500",    bg: "bg-blue-50",     text: "text-blue-700" },
  CANCELLED:  { label: "Cancelled",  dot: "bg-gray-400",    bg: "bg-gray-50",     text: "text-gray-500" },
  CHECKED_IN: { label: "Checked In", dot: "bg-violet-500",  bg: "bg-violet-50",   text: "text-violet-700" },
};

const mockAppointments: Appointment[] = [
  { id: 1, code: "APT-2026030101", doctorName: "Dr. Hoang Thi Mai",   specialization: "Cardiology",       date: "Mar 15, 2026", startTime: "15:30", endTime: "16:00", status: "CONFIRMED",  paymentStatus: "UNPAID", amount: 400000, reasonForVisit: "General checkup" },
  { id: 2, code: "APT-2026022801", doctorName: "Dr. Le Minh Tuan",    specialization: "General Medicine", date: "Mar 18, 2026", startTime: "09:00", endTime: "09:30", status: "PENDING",    paymentStatus: "UNPAID", amount: 350000, reasonForVisit: "Follow-up" },
  { id: 3, code: "APT-2026022501", doctorName: "Dr. Nguyen Van An",    specialization: "Dermatology",      date: "Feb 20, 2026", startTime: "14:00", endTime: "14:30", status: "COMPLETED",  paymentStatus: "PAID",   amount: 300000, reasonForVisit: "Skin examination" },
  { id: 4, code: "APT-2026022001", doctorName: "Dr. Pham Thi D",       specialization: "Orthopedics",      date: "Feb 10, 2026", startTime: "08:30", endTime: "09:00", status: "CANCELLED",  paymentStatus: "UNPAID", amount: 250000, reasonForVisit: "Joint pain" },
  { id: 5, code: "APT-2026031201", doctorName: "Dr. Tran Hoang E",     specialization: "ENT",              date: "Mar 12, 2026", startTime: "11:00", endTime: "11:30", status: "CHECKED_IN", paymentStatus: "PAID",   amount: 380000, reasonForVisit: "Ear infection" },
];

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US") + " VND";
}

export default function PatientAppointments() {
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "upcoming",  label: "Upcoming",  count: mockAppointments.filter((a) => ["CONFIRMED", "PENDING", "CHECKED_IN"].includes(a.status)).length },
    { key: "completed", label: "Completed", count: mockAppointments.filter((a) => a.status === "COMPLETED").length },
    { key: "cancelled", label: "Cancelled", count: mockAppointments.filter((a) => a.status === "CANCELLED").length },
  ];

  const filtered = mockAppointments.filter((a) => {
    if (activeTab === "upcoming") return ["CONFIRMED", "PENDING", "CHECKED_IN"].includes(a.status);
    return a.status === activeTab.toUpperCase();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Appointments</h2>
          <p className="text-sm text-gray-400 mt-1">View and manage your upcoming and past appointments</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#049ebb] rounded-xl hover:bg-[#037a94] transition-all shadow-md shadow-[#049ebb]/20 border-none cursor-pointer shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Book Now
        </button>
      </div>

      {/* Tabs + Content Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Tab Bar */}
        <div className="flex border-b border-gray-100 px-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3.5 text-[13px] font-medium transition-all border-none bg-transparent cursor-pointer relative ${
                activeTab === tab.key ? "text-[#049ebb]" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-semibold ${
                activeTab === tab.key ? "bg-[#049ebb]/10 text-[#049ebb]" : "bg-gray-100 text-gray-400"
              }`}>
                {tab.count}
              </span>
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#049ebb] rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gray-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">No appointments found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((apt) => {
              const st = statusConfig[apt.status];
              return (
                <div key={apt.id} className="p-5 hover:bg-gray-50/40 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Doctor */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#049ebb] to-[#027a94] flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                        {apt.doctorName.charAt(4)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{apt.doctorName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{apt.specialization}</p>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {apt.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {apt.startTime} – {apt.endTime}
                      </span>
                    </div>

                    {/* Status & Pay */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${st.bg} ${st.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                      {apt.paymentStatus === "UNPAID" && apt.status !== "CANCELLED" && (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-500">
                          {formatCurrency(apt.amount)}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button className="px-3 py-1.5 text-xs font-medium text-[#049ebb] bg-[#049ebb]/8 rounded-lg hover:bg-[#049ebb]/15 transition-all border-none cursor-pointer">
                        Details
                      </button>
                      {apt.status === "CONFIRMED" && (
                        <button className="px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-all border-none cursor-pointer">
                          Cancel
                        </button>
                      )}
                      {apt.paymentStatus === "UNPAID" && apt.status !== "CANCELLED" && (
                        <button className="px-3 py-1.5 text-xs font-medium text-white bg-[#049ebb] rounded-lg hover:bg-[#037a94] transition-all border-none cursor-pointer">
                          Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
