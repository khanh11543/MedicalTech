import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";

export default function SystemHealth() {
  return (
    <>
      <PageMeta
        title="System Health | MedicalTech Dashboard"
        description="Monitor system health and performance metrics"
      />
      <PageBreadcrumb pageTitle="System Health" />
      <div className="space-y-6">
        {/* Overall Status */}
        <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-green-100 rounded-full dark:bg-green-500/20">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">All Systems Operational</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last checked: 2 minutes ago</p>
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
              Refresh Status
            </button>
          </div>
        </div>

        {/* Service Status */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800 dark:text-white/90">API Server</h3>
              <Badge size="sm" color="success">Online</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Response Time</span>
                <span className="font-medium text-gray-800 dark:text-white/90">45ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Uptime</span>
                <span className="font-medium text-green-500">99.99%</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800 dark:text-white/90">Database</h3>
              <Badge size="sm" color="success">Online</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Query Time</span>
                <span className="font-medium text-gray-800 dark:text-white/90">12ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Connections</span>
                <span className="font-medium text-gray-800 dark:text-white/90">45/100</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800 dark:text-white/90">Cache Server</h3>
              <Badge size="sm" color="success">Online</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Hit Rate</span>
                <span className="font-medium text-green-500">94.5%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Memory Used</span>
                <span className="font-medium text-gray-800 dark:text-white/90">2.1 GB</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800 dark:text-white/90">File Storage</h3>
              <Badge size="sm" color="warning">Degraded</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Used Space</span>
                <span className="font-medium text-yellow-500">85%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Available</span>
                <span className="font-medium text-gray-800 dark:text-white/90">150 GB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Usage */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ComponentCard title="CPU Usage">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-800 dark:text-white/90">34%</span>
                <span className="text-sm text-green-500">Normal</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
                <div className="bg-blue-500 h-4 rounded-full" style={{ width: '34%' }}></div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Core 1</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">42%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Core 2</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">28%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Core 3</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">35%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Core 4</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">31%</p>
                </div>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Memory Usage">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-800 dark:text-white/90">68%</span>
                <span className="text-sm text-yellow-500">Moderate</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
                <div className="bg-yellow-500 h-4 rounded-full" style={{ width: '68%' }}></div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">32 GB</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Used</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">21.8 GB</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Free</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">10.2 GB</p>
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>

        {/* Network & Disk I/O */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ComponentCard title="Network Traffic">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg dark:bg-green-500/20">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Inbound</p>
                    <p className="font-medium text-gray-800 dark:text-white/90">125.4 MB/s</p>
                  </div>
                </div>
                <span className="text-sm text-green-500">↑ 12%</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-500/20">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Outbound</p>
                    <p className="font-medium text-gray-800 dark:text-white/90">89.2 MB/s</p>
                  </div>
                </div>
                <span className="text-sm text-green-500">↑ 8%</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-500/20">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Latency</p>
                    <p className="font-medium text-gray-800 dark:text-white/90">24ms</p>
                  </div>
                </div>
                <span className="text-sm text-green-500">Good</span>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Disk I/O">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-500/20">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Read Speed</p>
                    <p className="font-medium text-gray-800 dark:text-white/90">450 MB/s</p>
                  </div>
                </div>
                <span className="text-sm text-green-500">Fast</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg dark:bg-green-500/20">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Write Speed</p>
                    <p className="font-medium text-gray-800 dark:text-white/90">380 MB/s</p>
                  </div>
                </div>
                <span className="text-sm text-green-500">Fast</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg dark:bg-yellow-500/20">
                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">IOPS</p>
                    <p className="font-medium text-gray-800 dark:text-white/90">15,420</p>
                  </div>
                </div>
                <span className="text-sm text-green-500">Normal</span>
              </div>
            </div>
          </ComponentCard>
        </div>

        {/* Recent Incidents */}
        <ComponentCard title="Recent Incidents">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg border border-yellow-200 dark:border-yellow-500/20">
              <div className="p-2 bg-yellow-100 rounded-lg dark:bg-yellow-500/20">
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-400">High Storage Usage Warning</h4>
                  <span className="text-sm text-yellow-600 dark:text-yellow-500">2 hours ago</span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-400/80 mt-1">
                  File storage usage exceeded 80% threshold. Consider cleaning up old files or expanding storage.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/20">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-500/20">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-green-800 dark:text-green-400">Database Connection Restored</h4>
                  <span className="text-sm text-green-600 dark:text-green-500">1 day ago</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-400/80 mt-1">
                  Database connection issue was automatically resolved. No data loss occurred.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/20">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-500/20">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-green-800 dark:text-green-400">Scheduled Maintenance Completed</h4>
                  <span className="text-sm text-green-600 dark:text-green-500">3 days ago</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-400/80 mt-1">
                  System maintenance completed successfully. All services are running normally.
                </p>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
