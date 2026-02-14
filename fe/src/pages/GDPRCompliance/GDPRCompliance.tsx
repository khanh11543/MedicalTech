import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";

interface ConsentRecord {
  id: number;
  userName: string;
  email: string;
  consentType: string;
  consentDate: string;
  status: "Active" | "Withdrawn" | "Expired";
}

const consentRecordsData: ConsentRecord[] = [
  {
    id: 1,
    userName: "Nguyen Van A",
    email: "nguyenvana@example.com",
    consentType: "Data Processing",
    consentDate: "Feb 14, 2026",
    status: "Active",
  },
  {
    id: 2,
    userName: "Le Thi B",
    email: "lethib@example.com",
    consentType: "Marketing Communications",
    consentDate: "Feb 10, 2026",
    status: "Active",
  },
  {
    id: 3,
    userName: "Tran Van C",
    email: "tranvanc@example.com",
    consentType: "Data Processing",
    consentDate: "Jan 15, 2026",
    status: "Withdrawn",
  },
  {
    id: 4,
    userName: "Pham Thi D",
    email: "phamthid@example.com",
    consentType: "Third Party Sharing",
    consentDate: "Dec 20, 2025",
    status: "Expired",
  },
  {
    id: 5,
    userName: "Hoang Van E",
    email: "hoangvane@example.com",
    consentType: "Data Processing",
    consentDate: "Feb 12, 2026",
    status: "Active",
  },
];

export default function GDPRCompliance() {
  return (
    <>
      <PageMeta
        title="GDPR & Compliance | MedicalTech Dashboard"
        description="GDPR compliance and data protection settings"
      />
      <PageBreadcrumb pageTitle="GDPR & Compliance" />
      <div className="space-y-6">
        {/* Compliance Status */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg dark:bg-green-500/20">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">GDPR Status</p>
                <h3 className="text-lg font-bold text-green-500">Compliant</h3>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg dark:bg-blue-500/20">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Data Encryption</p>
                <h3 className="text-lg font-bold text-blue-500">AES-256</h3>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg dark:bg-purple-500/20">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Consents</p>
                <h3 className="text-lg font-bold text-purple-500">8,456</h3>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg dark:bg-yellow-500/20">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Audit</p>
                <h3 className="text-lg font-bold text-yellow-500">Feb 1, 2026</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Data Protection Settings */}
        <ComponentCard title="Data Protection Settings">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">Data Retention Period</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">How long to keep patient data after last activity</p>
              </div>
              <select className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <option value="1">1 Year</option>
                <option value="3">3 Years</option>
                <option value="5" selected>5 Years</option>
                <option value="7">7 Years</option>
                <option value="10">10 Years</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">Automatic Data Anonymization</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Anonymize data after retention period</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">Cookie Consent Banner</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Show cookie consent banner to visitors</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">Right to be Forgotten</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Allow users to request complete data deletion</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">Data Portability</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Allow users to export their data</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </ComponentCard>

        {/* Consent Records */}
        <ComponentCard title="Recent Consent Records">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      User
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Email
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Consent Type
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Date
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {consentRecordsData.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {record.userName}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {record.email}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {record.consentType}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {record.consentDate}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge
                          size="sm"
                          color={
                            record.status === "Active"
                              ? "success"
                              : record.status === "Withdrawn"
                              ? "error"
                              : "warning"
                          }
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
                            View
                          </button>
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                            Revoke
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentCard>

        <div className="flex justify-end gap-3">
          <button className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
            Export Compliance Report
          </button>
          <button className="px-6 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
            Save Settings
          </button>
        </div>
      </div>
    </>
  );
}
