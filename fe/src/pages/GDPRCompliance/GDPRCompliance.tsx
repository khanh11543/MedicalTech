import { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataExportRequests from "./DataExportRequests";
import DataDeletionRequests from "./DataDeletionRequests";
import ConsentManagement from "./ConsentManagement";

type Tab = "export" | "deletion" | "consent";

const TABS: { key: Tab; label: string; icon: JSX.Element }[] = [
  {
    key: "export",
    label: "Data Export Requests",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: "deletion",
    label: "Data Deletion Requests",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
  {
    key: "consent",
    label: "Consent Management",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

export default function GDPRCompliance() {
  const [activeTab, setActiveTab] = useState<Tab>("export");

  return (
    <>
      <PageMeta
        title="GDPR & Compliance | MedicalTech Dashboard"
        description="GDPR compliance and data protection management"
      />
      <PageBreadcrumb pageTitle="GDPR & Compliance" />
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-0 -mb-px" aria-label="GDPR tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "export" && <DataExportRequests />}
        {activeTab === "deletion" && <DataDeletionRequests />}
        {activeTab === "consent" && <ConsentManagement />}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex space-x-8">
          <button onClick={() => setActiveTab("overview")} className={`${activeTab === "overview" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
            Overview
          </button>
          <button onClick={() => setActiveTab("requests")} className={`${activeTab === "requests" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
            Data Requests
            {dashboard.pendingRequests > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                {dashboard.pendingRequests}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab("consents")} className={`${activeTab === "consents" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
            User Consents
          </button>
          <button onClick={() => setActiveTab("activities")} className={`${activeTab === "activities" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
            Processing Activities
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Request Types</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Export Requests</span>
                <span className="font-semibold text-gray-900 dark:text-white">{dashboard.exportRequests}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Deletion Requests</span>
                <span className="font-semibold text-gray-900 dark:text-white">{dashboard.deletionRequests}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Rectification Requests</span>
                <span className="font-semibold text-gray-900 dark:text-white">{dashboard.rectificationRequests}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Consent Statistics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Total Consents</span>
                <span className="font-semibold text-gray-900 dark:text-white">{dashboard.totalConsents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Active Consents</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{dashboard.activeConsents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Revoked Consents</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{dashboard.revokedConsents}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Processing Activities</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Total Activities</span>
                <span className="font-semibold text-gray-900 dark:text-white">{dashboard.totalProcessingActivities}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Active Activities</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{dashboard.activeProcessingActivities}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">All Data Requests</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {dataRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">#{request.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{request.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{request.requestType.replace("_", " ")}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{formatDate(request.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {request.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateRequestStatus(request.id, "IN_PROGRESS")} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">Start</button>
                          <button onClick={() => handleUpdateRequestStatus(request.id, "COMPLETED")} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">Complete</button>
                          <button onClick={() => handleUpdateRequestStatus(request.id, "REJECTED")} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Reject</button>
                        </div>
                      )}
                      {request.status === "IN_PROGRESS" && (
                        <button onClick={() => handleUpdateRequestStatus(request.id, "COMPLETED")} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">Complete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Consents Tab */}
      {activeTab === "consents" && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Consents</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Consent Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Granted At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {consents.map((consent) => (
                  <tr key={consent.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">#{consent.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{consent.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{consent.consentType.replace("_", " ")}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{formatDate(consent.grantedAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {consent.revokedAt ? (
                        <span className="text-red-600 dark:text-red-400">Revoked on {formatDate(consent.revokedAt)}</span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activities Tab */}
      {activeTab === "activities" && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Processing Activities</h3>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{activity.activityName}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{activity.purpose.replace("_", " ")}</p>
                  </div>
                  <span className="text-xs text-gray-500">#{activity.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Legal Basis:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{activity.legalBasis.replace("_", " ")}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Data Categories:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{activity.dataCategories}</span>
                  </div>
                  {activity.retentionPeriod && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Retention:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{activity.retentionPeriod}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Status:</span>
                    <span className={`ml-2 ${activity.isActive ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}>
                      {activity.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
