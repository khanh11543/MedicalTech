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

interface AuditLog {
  id: number;
  userAvatar: string;
  userName: string;
  action: string;
  resource: string;
  ipAddress: string;
  timestamp: string;
  status: "Success" | "Failed" | "Warning";
}

const auditLogsData: AuditLog[] = [
  {
    id: 1,
    userAvatar: "/images/user/user-17.jpg",
    userName: "Admin User",
    action: "Login",
    resource: "Authentication",
    ipAddress: "192.168.1.100",
    timestamp: "Feb 14, 2026 09:30:00",
    status: "Success",
  },
  {
    id: 2,
    userAvatar: "/images/user/user-18.jpg",
    userName: "Dr. Nguyen Van A",
    action: "Update",
    resource: "Patient Record #1234",
    ipAddress: "192.168.1.105",
    timestamp: "Feb 14, 2026 09:25:00",
    status: "Success",
  },
  {
    id: 3,
    userAvatar: "/images/user/user-19.jpg",
    userName: "Unknown",
    action: "Login Attempt",
    resource: "Authentication",
    ipAddress: "45.33.32.156",
    timestamp: "Feb 14, 2026 09:20:00",
    status: "Failed",
  },
  {
    id: 4,
    userAvatar: "/images/user/user-20.jpg",
    userName: "Receptionist",
    action: "Create",
    resource: "Appointment #5678",
    ipAddress: "192.168.1.110",
    timestamp: "Feb 14, 2026 09:15:00",
    status: "Success",
  },
  {
    id: 5,
    userAvatar: "/images/user/user-21.jpg",
    userName: "System",
    action: "Password Reset",
    resource: "User Account",
    ipAddress: "192.168.1.1",
    timestamp: "Feb 14, 2026 09:10:00",
    status: "Warning",
  },
];

export default function SecurityAudit() {
  return (
    <>
      <PageMeta
        title="Security & Audit | MedicalTech Dashboard"
        description="Security settings and audit logs in the MedicalTech system"
      />
      <PageBreadcrumb pageTitle="Security & Audit" />
      <div className="space-y-6">
        <ComponentCard title="Security Settings">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Require 2FA for all admin accounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">Session Timeout (minutes)</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Auto logout after inactivity</p>
              </div>
              <select className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <option value="15">15 minutes</option>
                <option value="30" selected>30 minutes</option>
                <option value="60">60 minutes</option>
                <option value="120">120 minutes</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">Password Expiry (days)</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Force password change after specified days</p>
              </div>
              <input
                type="number"
                defaultValue="90"
                className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white w-24"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">Max Login Attempts</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Lock account after failed login attempts</p>
              </div>
              <input
                type="number"
                defaultValue="5"
                className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white w-24"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">IP Whitelist</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Only allow access from specific IP addresses</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Audit Logs">
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
                      Action
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Resource
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      IP Address
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Timestamp
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {auditLogsData.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden rounded-full">
                            <img
                              width={40}
                              height={40}
                              src={log.userAvatar}
                              alt={log.userName}
                            />
                          </div>
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {log.userName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {log.action}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {log.resource}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 font-mono">
                        {log.ipAddress}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {log.timestamp}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge
                          size="sm"
                          color={
                            log.status === "Success"
                              ? "success"
                              : log.status === "Failed"
                              ? "error"
                              : "warning"
                          }
                        >
                          {log.status}
                        </Badge>
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
            Export Logs
          </button>
          <button className="px-6 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
            Save Security Settings
          </button>
        </div>
      </div>
    </>
  );
}
