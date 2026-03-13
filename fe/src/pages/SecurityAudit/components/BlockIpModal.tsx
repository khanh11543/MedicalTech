import { useState } from "react";
import {
  BlockIpRequest,
  BlockType,
  BlockScope,
} from "../../../services/securityService";

interface Props {
  isOpen: boolean;
  initialIp?: string;
  onClose: () => void;
  onSubmit: (data: BlockIpRequest) => void;
  isPending: boolean;
}

export default function BlockIpModal({
  isOpen,
  initialIp = "",
  onClose,
  onSubmit,
  isPending,
}: Props) {
  const [form, setForm] = useState<BlockIpRequest>({
    ipAddress: initialIp,
    reason: "",
    blockType: "TEMPORARY",
    blockScope: "ENTIRE_SYSTEM",
    expiresAt: "",
  });
  const [durationHours, setDurationHours] = useState(24);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const data: BlockIpRequest = {
      ...form,
    };
    if (form.blockType === "TEMPORARY" && !form.expiresAt) {
      const expires = new Date();
      expires.setHours(expires.getHours() + durationHours);
      data.expiresAt = expires.toISOString().slice(0, 19);
    }
    if (form.blockType === "PERMANENT") {
      delete data.expiresAt;
    }
    onSubmit(data);
  };

  const setField = <K extends keyof BlockIpRequest>(
    key: K,
    value: BlockIpRequest[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-red-50 p-2.5 text-red-600 dark:bg-red-900/20 dark:text-red-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Block IP Address
            </h3>
            <p className="text-sm text-gray-500">Block a single IP or IP range</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* IP Address */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              IP Address or Range <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.ipAddress}
              onChange={(e) => setField("ipAddress", e.target.value)}
              placeholder="192.168.1.100 or 192.168.1.0/24"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-400">
              Single: 192.168.1.100 | Range: 192.168.1.0/24
            </p>
          </div>

          {/* Block Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Block Type
            </label>
            <div className="flex gap-3">
              {(["TEMPORARY", "PERMANENT"] as BlockType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setField("blockType", type)}
                  className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    form.blockType === type
                      ? type === "PERMANENT"
                        ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                        : "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-400"
                  }`}
                >
                  {type === "TEMPORARY" ? "Temporary" : "Permanent"}
                </button>
              ))}
            </div>
          </div>

          {/* Duration (for Temporary) */}
          {form.blockType === "TEMPORARY" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Duration (hours) or Specific Date
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {[1, 6, 12, 24, 48, 72].map((h) => (
                      <button
                        key={h}
                        onClick={() => {
                          setDurationHours(h);
                          setField("expiresAt", "");
                        }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          durationHours === h && !form.expiresAt
                            ? "bg-brand-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <input
                  type="datetime-local"
                  value={form.expiresAt || ""}
                  onChange={(e) => setField("expiresAt", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => setField("reason", e.target.value)}
              rows={3}
              placeholder="Describe why this IP should be blocked..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Block Scope */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Block Scope
            </label>
            <div className="flex gap-2">
              {(
                [
                  { value: "ENTIRE_SYSTEM" as BlockScope, label: "Entire System", desc: "Block everywhere" },
                  { value: "ADMIN_PANEL_ONLY" as BlockScope, label: "Admin Panel", desc: "Admin access only" },
                  { value: "API_ONLY" as BlockScope, label: "API Only", desc: "API endpoints only" },
                ]
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setField("blockScope", opt.value)}
                  className={`flex-1 rounded-lg border-2 px-3 py-2 text-left transition-colors ${
                    form.blockScope === opt.value
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <p className="text-xs font-medium text-gray-800 dark:text-white">
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-gray-400">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !form.ipAddress || !form.reason}
            className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            {isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            )}
            Block IP
          </button>
        </div>
      </div>
    </div>
  );
}
