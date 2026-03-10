import { useState } from "react";
import {
  UserIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import PageMeta from "../../components/common/PageMeta";
import PersonalTab from "./Settings/PersonalTab";
import WorkstationTab from "./Settings/WorkstationTab";
import DataPrivacyTab from "./Settings/DataPrivacyTab";
import HelpSupportTab from "./Settings/HelpSupportTab";

const tabs: { id: string; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { id: "personal", label: "Personal", icon: UserIcon },
  { id: "workstation", label: "Workstation", icon: BuildingOffice2Icon },
  { id: "privacy", label: "Data & Privacy", icon: ShieldCheckIcon },
  { id: "help", label: "Help & Support", icon: QuestionMarkCircleIcon },
];

export default function ReceptionistSettings() {
  const [activeTab, setActiveTab] = useState("personal");

  const renderTab = () => {
    switch (activeTab) {
      case "personal":
        return <PersonalTab />;
      case "workstation":
        return <WorkstationTab />;
      case "privacy":
        return <DataPrivacyTab />;
      case "help":
        return <HelpSupportTab />;
      default:
        return <PersonalTab />;
    }
  };

  return (
    <>
      <PageMeta
        title="Settings | Receptionist MediTech"
        description="Personal and system settings"
      />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Cog6ToothIcon className="w-7 h-7 text-brand-500" />
            Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Personal and system configuration
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="-mb-px flex gap-x-1" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-brand-500 text-brand-500"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4 mr-1.5 inline-block" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Active Tab Content */}
        <div>{renderTab()}</div>
      </div>
    </>
  );
}
