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

interface BackupRecord {
  id: number;
  backupName: string;
  backupType: string;
  size: string;
  createdAt: string;
  status: "Completed" | "In Progress" | "Failed";
}

const backupData: BackupRecord[] = [
  {
    id: 1,
    backupName: "daily_backup_20260215",
    backupType: "Full Backup",
    size: "2.5 GB",
    createdAt: "Feb 15, 2026 02:00 AM",
    status: "Completed",
  },
  {
    id: 2,
    backupName: "daily_backup_20260214",
    backupType: "Full Backup",
    size: "2.4 GB",
    createdAt: "Feb 14, 2026 02:00 AM",
    status: "Completed",
  },
  {
    id: 3,
    backupName: "incremental_20260215",
    backupType: "Incremental",
    size: "256 MB",
    createdAt: "Feb 15, 2026 08:00 AM",
    status: "In Progress",
  },
  {
    id: 4,
    backupName: "daily_backup_20260213",
    backupType: "Full Backup",
    size: "2.3 GB",
    createdAt: "Feb 13, 2026 02:00 AM",
    status: "Completed",
  },
  {
    id: 5,
    backupName: "weekly_backup_20260209",
    backupType: "Weekly Backup",
    size: "5.2 GB",
    createdAt: "Feb 9, 2026 03:00 AM",
    status: "Failed",
  },
];

export default function BackupMaintenance() {
  return (
    <>
      <PageMeta
        title="Backup & Maintenance | MedicalTech Dashboard"
        description="System backup and maintenance management"
      />
      <PageBreadcrumb pageTitle="Backup & Maintenance" />
      <div className="space-y-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg dark:bg-green-500/20">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">System Status</p>
                <h3 className="text-lg font-bold text-green-500">Healthy</h3>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg dark:bg-blue-500/20">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Database Size</p>
                <h3 className="text-lg font-bold text-blue-500">45.8 GB</h3>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg dark:bg-purple-500/20">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Backup</p>
                <h3 className="text-lg font-bold text-purple-500">2 hours ago</h3>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg dark:bg-yellow-500/20">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Storage Used</p>
                <h3 className="text-lg font-bold text-yellow-500">68%</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Backup Settings */}
        <ComponentCard title="Backup Settings">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">Automatic Daily Backup</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Run full backup every day at 2:00 AM</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">Incremental Backup</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Run incremental backup every 6 hours</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">Backup Retention</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">How long to keep backup files</p>
              </div>
              <select className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30" selected>30 Days</option>
                <option value="90">90 Days</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">Cloud Backup</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sync backups to cloud storage</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </ComponentCard>

        {/* Backup History */}
        <ComponentCard title="Backup History">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Backup Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Type
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Size
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Created At
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
                  {backupData.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {backup.backupName}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {backup.backupType}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {backup.size}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {backup.createdAt}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge
                          size="sm"
                          color={
                            backup.status === "Completed"
                              ? "success"
                              : backup.status === "In Progress"
                              ? "warning"
                              : "error"
                          }
                        >
                          {backup.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
                            Download
                          </button>
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors">
                            Restore
                          </button>
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                            Delete
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

        {/* Maintenance Actions */}
        <ComponentCard title="Maintenance Actions">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button className="p-6 bg-gray-50 dark:bg-white/[0.03] rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors text-left">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg dark:bg-blue-500/20">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">Run Backup Now</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Start immediate full backup</p>
                </div>
              </div>
            </button>

            <button className="p-6 bg-gray-50 dark:bg-white/[0.03] rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors text-left">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg dark:bg-green-500/20">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">Health Check</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Run system diagnostics</p>
                </div>
              </div>
            </button>

            <button className="p-6 bg-gray-50 dark:bg-white/[0.03] rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors text-left">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg dark:bg-yellow-500/20">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">Clear Cache</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Clear system cache files</p>
                </div>
              </div>
            </button>

            <button className="p-6 bg-gray-50 dark:bg-white/[0.03] rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors text-left">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg dark:bg-purple-500/20">
                  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">Optimize Database</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Optimize tables and indexes</p>
                </div>
              </div>
            </button>

            <button className="p-6 bg-gray-50 dark:bg-white/[0.03] rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors text-left">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg dark:bg-red-500/20">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">View Error Logs</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Check system error logs</p>
                </div>
              </div>
            </button>

            <button className="p-6 bg-gray-50 dark:bg-white/[0.03] rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors text-left">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-lg dark:bg-indigo-500/20">
                  <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">System Update</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Check for system updates</p>
                </div>
              </div>
            </button>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
