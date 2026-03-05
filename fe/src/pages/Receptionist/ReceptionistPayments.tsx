import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import {
  BanknotesIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import CollectPayment from "./Payments/CollectPayment";
import PaymentHistory from "./Payments/PaymentHistory";
import PendingPayments from "./Payments/PendingPayments";
import TodayRevenue from "./Payments/TodayRevenue";

type TabKey = "collect" | "history" | "pending" | "revenue";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { key: "collect", label: "Collect", icon: CreditCardIcon },
  { key: "history", label: "History", icon: DocumentTextIcon },
  { key: "pending", label: "Pending", icon: ExclamationCircleIcon },
  { key: "revenue", label: "Today's Revenue", icon: ChartBarIcon },
];

export default function ReceptionistPayments() {
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const saved = sessionStorage.getItem("receptionist_payment_tab");
    return (saved as TabKey) || "collect";
  });

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    sessionStorage.setItem("receptionist_payment_tab", key);
  };

  return (
    <>
      <PageMeta
        title="Payments | Receptionist MediTech"
        description="Manage payment transactions"
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BanknotesIcon className="w-7 h-7 text-brand-500" />
              Payments
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "collect" && <CollectPayment />}
        {activeTab === "history" && <PaymentHistory />}
        {activeTab === "pending" && <PendingPayments />}
        {activeTab === "revenue" && <TodayRevenue />}
      </div>
    </>
  );
}
