import { useAuth } from "../../context/AuthContext";
import PageMeta from "../../components/common/PageMeta";
import { authStorage } from "../../utils/authStorage";

export default function DebugInfo() {
  const { user, isAuthenticated } = useAuth();
  
  const token = authStorage.getAccessToken();
  const refreshToken = authStorage.getRefreshToken();
  const storedUser = authStorage.getUser();

  return (
    <>
      <PageMeta title="Debug Info | MediTech Admin" description="Debug Information" />
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Debug Information</h1>
        
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Authentication Status</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Is Authenticated:</span>{" "}
              <span className={isAuthenticated ? "text-green-500" : "text-red-500"}>
                {isAuthenticated ? "✓ Yes" : "✗ No"}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Has Access Token:</span>{" "}
              <span className={token ? "text-green-500" : "text-red-500"}>
                {token ? "✓ Yes" : "✗ No"}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Has Refresh Token:</span>{" "}
              <span className={refreshToken ? "text-green-500" : "text-red-500"}>
                {refreshToken ? "✓ Yes" : "✗ No"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">User Info</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">User ID:</span>{" "}
              <span className="text-gray-800 dark:text-white">{user?.userId || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Email:</span>{" "}
              <span className="text-gray-800 dark:text-white">{user?.email || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Roles:</span>{" "}
              <span className="text-gray-800 dark:text-white">
                {user?.roles?.join(", ") || "N/A"}
              </span>
            </div>
            <div className="mt-4">
              <span className="text-gray-500 dark:text-gray-400">Has ADMIN Role:</span>{" "}
              <span className={user?.roles?.includes("ADMIN") ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                {user?.roles?.includes("ADMIN") ? "✓ YES - Can access admin endpoints" : "✗ NO - Cannot access admin endpoints"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">LocalStorage Data</h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-500 dark:text-gray-400 block mb-1">Access Token (first 50 chars):</span>
              <code className="block p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto text-gray-800 dark:text-white">
                {token ? token.substring(0, 50) + "..." : "Not found"}
              </code>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block mb-1">Stored User JSON:</span>
              <code className="block p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto text-gray-800 dark:text-white">
                {storedUser || "Not found"}
              </code>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-900/50 dark:bg-yellow-900/10">
          <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-2">⚠️ Troubleshooting</h2>
          <div className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p><strong>If APIs are failing with "Access denied. Admin role required":</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Your user needs ADMIN role to access admin endpoints</li>
              <li>Current roles: <strong>{user?.roles?.join(", ") || "None"}</strong></li>
              <li>Please login with an admin account or assign ADMIN role to current user in database</li>
            </ul>
            
            <p className="mt-4"><strong>If APIs are failing with "Cannot connect to server":</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Check if backend is running on http://localhost:8080</li>
              <li>Check browser console for CORS or network errors</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify({
                isAuthenticated,
                user,
                hasToken: !!token,
                hasRefreshToken: !!refreshToken,
              }, null, 2));
              alert("Debug info copied to clipboard!");
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Copy Debug Info
          </button>
          
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/signin";
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Clear All & Logout
          </button>
        </div>
      </div>
    </>
  );
}
