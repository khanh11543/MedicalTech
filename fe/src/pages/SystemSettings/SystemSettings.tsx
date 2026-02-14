import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

export default function SystemSettings() {
  return (
    <>
      <PageMeta
        title="System Settings | MedicalTech Dashboard"
        description="Configure system settings in the MedicalTech system"
      />
      <PageBreadcrumb pageTitle="System Settings" />
      <div className="space-y-6">
        <ComponentCard title="General Settings">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">System Name</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">The name displayed across the application</p>
              </div>
              <input
                type="text"
                defaultValue="MedicalTech"
                className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">Default Language</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">System default language</p>
              </div>
              <select className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <option value="en">English</option>
                <option value="vi">Vietnamese</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">Timezone</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">System default timezone</p>
              </div>
              <select className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
                <option value="UTC">UTC (GMT+0)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">Maintenance Mode</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enable maintenance mode to prevent user access</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Email Settings">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">SMTP Server</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email server address</p>
              </div>
              <input
                type="text"
                defaultValue="smtp.gmail.com"
                className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">SMTP Port</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email server port</p>
              </div>
              <input
                type="text"
                defaultValue="587"
                className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white w-24"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">Email Notifications</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enable email notifications for appointments</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Appointment Settings">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">Default Appointment Duration</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Default duration for appointments in minutes</p>
              </div>
              <select className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <option value="15">15 minutes</option>
                <option value="30" selected>30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">Cancellation Policy (hours)</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Minimum hours before appointment for cancellation</p>
              </div>
              <input
                type="number"
                defaultValue="24"
                className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white w-24"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">Allow Online Booking</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Allow patients to book appointments online</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </ComponentCard>

        <div className="flex justify-end gap-3">
          <button className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
            Reset to Default
          </button>
          <button className="px-6 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
            Save Settings
          </button>
        </div>
      </div>
    </>
  );
}
