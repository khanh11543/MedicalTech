import { useState } from "react";
import {
  UserSessionDTO,
  ForceLogoutDTO,
  SESSION_STATUS_LABELS,
} from "../../../services/securityService";

interface Props {
  selectedSession?: UserSessionDTO | null;
  onForceLogout: (dto: ForceLogoutDTO) => void;
  isLoading: boolean;
}

type ModalType = "kill-single" | "kill-user" | "kill-idle" | "kill-all" | null;

export default function ForceLogoutActions({
  selectedSession,
  onForceLogout,
  isLoading,
}: Props) {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [reason, setReason] = useState("");
  const [idleThreshold, setIdleThreshold] = useState(30);

  const closeModal = () => {
    setModalType(null);
    setReason("");
  };

  const handleConfirm = () => {
    if (!reason.trim()) return;

    let dto: ForceLogoutDTO;
    switch (modalType) {
      case "kill-single":
        if (!selectedSession) return;
        dto = { sessionIds: [selectedSession.id], reason: reason.trim() };
        break;
      case "kill-user":
        if (!selectedSession?.user?.id) return;
        dto = { userId: selectedSession.user.id, reason: reason.trim() };
        break;
      case "kill-idle":
        // We use a special reason that includes threshold info for the backend
        dto = {
          reason: `[IDLE>${idleThreshold}min] ${reason.trim()}`,
        };
        break;
      case "kill-all":
        // Kill all: exclude own session (handled by backend via excludeSessionId)
        dto = { reason: reason.trim() };
        break;
      default:
        return;
    }
    onForceLogout(dto);
    closeModal();
  };

  const openKillSingle = (session: UserSessionDTO) => {
    setModalType("kill-single");
    setReason(`Force logout session #${session.id}`);
  };

  // Expose the openKillSingle function via selectedSession prop
  // The parent calls this by setting selectedSession and the modal type
  const handleOpenForSession = () => {
    if (selectedSession) openKillSingle(selectedSession);
  };

  return (
    <>
      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Kill Single Session */}
        {selectedSession && (selectedSession.status === "ACTIVE" || selectedSession.status === "IDLE") && (
          <button
            onClick={handleOpenForSession}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
          >
          Kill Session
          </button>
        )}

        {/* Kill All User Sessions */}
        {selectedSession?.user?.id && (
          <button
            onClick={() => {
              setModalType("kill-user");
              setReason(`Force logout all sessions for user: ${selectedSession.user?.fullName || selectedSession.user?.email}`);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition"
          >
            Kill All User Sessions
          </button>
        )}

        {/* Kill Idle Sessions */}
        <button
          onClick={() => {
            setModalType("kill-idle");
            setReason("Bulk cleanup: killing idle sessions");
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition"
        >
          Kill Idle Sessions
        </button>

        {/* Emergency Kill All */}
        <button
          onClick={() => {
            setModalType("kill-all");
            setReason("");
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
        >
          Emergency: Kill All Sessions
        </button>
      </div>

      {/* Confirmation Modal */}
      {modalType && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div
              className={`p-5 border-b border-gray-200 dark:border-gray-700 ${
                modalType === "kill-all"
                  ? "bg-red-50 dark:bg-red-900/20"
                  : "bg-white dark:bg-gray-900"
              }`}
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                {modalType === "kill-single" && "Kill Session"}
                {modalType === "kill-user" && "Kill All User Sessions"}
                {modalType === "kill-idle" && "Kill Idle Sessions"}
                {modalType === "kill-all" && "Emergency: Kill All Sessions"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {modalType === "kill-single" &&
                  `This will immediately terminate session #${selectedSession?.id} for ${selectedSession?.user?.fullName || "unknown user"}.`}
                {modalType === "kill-user" &&
                  `This will terminate ALL active sessions for ${selectedSession?.user?.fullName || "this user"}.`}
                {modalType === "kill-idle" &&
                  "This will terminate all sessions that have been idle beyond the threshold."}
                {modalType === "kill-all" &&
                  "WARNING: This will immediately log out ALL users except you. Use only in case of security breach or system compromise!"}
              </p>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Session preview for single kill */}
              {modalType === "kill-single" && selectedSession && (
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500 dark:text-gray-400">User:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {selectedSession.user?.fullName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500 dark:text-gray-400">Status:</span>
                    <span>{SESSION_STATUS_LABELS[selectedSession.status]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">IP:</span>
                    <span className="font-mono text-xs">{selectedSession.ipAddress || "—"}</span>
                  </div>
                </div>
              )}

              {/* Idle threshold for bulk idle kill */}
              {modalType === "kill-idle" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Idle Threshold (minutes)
                  </label>
                  <select
                    value={idleThreshold}
                    onChange={(e) => setIdleThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes (default)</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={240}>4 hours</option>
                  </select>
                </div>
              )}

              {/* Emergency warning for kill all */}
              {modalType === "kill-all" && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                    This action cannot be undone!
                  </p>
                  <ul className="text-xs text-red-600 dark:text-red-400 mt-2 space-y-1 list-disc list-inside">
                    <li>All users will be immediately logged out</li>
                    <li>Users will see "Session expired" message</li>
                    <li>Your session will be preserved</li>
                    <li>This action will be logged for audit</li>
                  </ul>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for this action..."
                  maxLength={255}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">{reason.length}/255</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!reason.trim() || isLoading}
                className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition disabled:opacity-50 ${
                  modalType === "kill-all"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    {modalType === "kill-single" && "Kill Session"}
                    {modalType === "kill-user" && "Kill All Sessions"}
                    {modalType === "kill-idle" && `Kill Idle (>${idleThreshold}min)`}
                    {modalType === "kill-all" && "Kill ALL Sessions"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
