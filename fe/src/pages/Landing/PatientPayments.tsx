import { useState } from "react";

type TabKey = "paid" | "unpaid" | "completed" | "cancelled";

interface Payment {
  id: number;
  transactionCode: string;
  doctorName: string;
  specialization: string;
  appointmentDate: string;
  amount: number;
  paymentMethod: string;
  status: "PAID" | "UNPAID" | "COMPLETED" | "CANCELLED" | "REFUNDED";
  paidAt: string | null;
  hasReceipt: boolean;
}

const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  PAID:      { label: "Paid",      dot: "bg-blue-500",   bg: "bg-blue-50",    text: "text-blue-700" },
  UNPAID:    { label: "Unpaid",    dot: "bg-red-500",    bg: "bg-red-50",     text: "text-red-600" },
  COMPLETED: { label: "Completed", dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  CANCELLED: { label: "Cancelled", dot: "bg-gray-400",   bg: "bg-gray-50",    text: "text-gray-500" },
  REFUNDED:  { label: "Refunded",  dot: "bg-violet-500", bg: "bg-violet-50",  text: "text-violet-700" },
};

const mockPayments: Payment[] = [
  { id: 1, transactionCode: "TXN-20260301001", doctorName: "Dr. Le Minh Tuan",  specialization: "General Medicine", appointmentDate: "Mar 01, 2026", amount: 400000, paymentMethod: "MoMo",  status: "PAID",      paidAt: "Mar 01, 2026 09:15", hasReceipt: true },
  { id: 2, transactionCode: "TXN-20260301002", doctorName: "Dr. Hoang Thi Mai",  specialization: "Cardiology",      appointmentDate: "Mar 05, 2026", amount: 400000, paymentMethod: "",      status: "UNPAID",    paidAt: null, hasReceipt: false },
  { id: 3, transactionCode: "TXN-20260228001", doctorName: "Dr. Nguyen Van An",  specialization: "Dermatology",     appointmentDate: "Feb 28, 2026", amount: 350000, paymentMethod: "Cash",  status: "COMPLETED", paidAt: "Feb 28, 2026 14:30", hasReceipt: true },
  { id: 4, transactionCode: "TXN-20260225001", doctorName: "Dr. Tran Thi Hoa",   specialization: "Pediatrics",      appointmentDate: "Feb 25, 2026", amount: 300000, paymentMethod: "",      status: "CANCELLED", paidAt: null, hasReceipt: false },
];

function formatCurrency(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ";
}

export default function PatientPayments() {
  const [activeTab, setActiveTab] = useState<TabKey>("paid");

  const tabDefs: { key: TabKey; label: string; statuses: string[] }[] = [
    { key: "paid",      label: "Paid",      statuses: ["PAID"] },
    { key: "unpaid",    label: "Unpaid",    statuses: ["UNPAID"] },
    { key: "completed", label: "Completed", statuses: ["COMPLETED"] },
    { key: "cancelled", label: "Cancelled", statuses: ["CANCELLED", "REFUNDED"] },
  ];

  const filtered = mockPayments.filter((p) =>
    tabDefs.find((t) => t.key === activeTab)?.statuses.includes(p.status)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
        <p className="text-sm text-gray-400 mt-1">Track your payment transactions and invoices</p>
      </div>

      {/* Tabs + Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Tab Bar */}
        <div className="flex border-b border-gray-100 px-1">
          {tabDefs.map((tab) => {
            const count = mockPayments.filter((p) => tab.statuses.includes(p.status)).length;
            return (
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
                  {count}
                </span>
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#049ebb] rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gray-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">No transactions found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((pay) => {
              const st = statusConfig[pay.status];
              return (
                <div key={pay.id} className="p-5 hover:bg-gray-50/40 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Doctor info */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#e6f7fb] flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-[#049ebb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{pay.doctorName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{pay.specialization} · {pay.appointmentDate}</p>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-gray-900">{formatCurrency(pay.amount)}</p>
                      {pay.paymentMethod && (
                        <p className="text-[11px] text-gray-400 mt-0.5">via {pay.paymentMethod}</p>
                      )}
                    </div>

                    {/* Status */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 ${st.bg} ${st.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {pay.hasReceipt && (
                        <button className="px-3 py-1.5 text-xs font-medium text-[#049ebb] bg-[#049ebb]/8 rounded-lg hover:bg-[#049ebb]/15 transition-all border-none cursor-pointer flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          Invoice
                        </button>
                      )}
                      {pay.status === "UNPAID" && (
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
