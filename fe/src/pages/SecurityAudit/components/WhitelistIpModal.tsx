import { useState } from "react";
import {
  CreateIpRuleDTO,
  IpStatus,
  BlockScope,
} from "../../../services/securityService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateIpRuleDTO) => void;
  isPending: boolean;
}

export default function WhitelistIpModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: Props) {
  const [form, setForm] = useState<CreateIpRuleDTO>({
    ipAddress: "",
    ruleType: "ALLOW",
    status: "WHITELISTED",
    scope: "ENTIRE_SYSTEM",
    reason: "",
    description: "",
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(form);
  };

  const setField = <K extends keyof CreateIpRuleDTO>(
    key: K,
    value: CreateIpRuleDTO[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-green-50 p-2.5 text-green-600 dark:bg-green-900/20 dark:text-green-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Whitelist IP Address
            </h3>
            <p className="text-sm text-gray-500">
              Add a trusted IP to the whitelist
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* IP Address */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              IP Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.ipAddress}
              onChange={(e) => setField("ipAddress", e.target.value)}
              placeholder="192.168.1.100"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <input
              type="text"
              value={form.description || ""}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Who/what is this IP? (e.g., Office VPN, Monitoring server)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Reason
            </label>
            <textarea
              value={form.reason || ""}
              onChange={(e) => setField("reason", e.target.value)}
              rows={2}
              placeholder="Why should this IP be whitelisted?"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Whitelist Scope */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Whitelist Scope
            </label>
            <div className="flex gap-2">
              {(
                [
                  { value: "ENTIRE_SYSTEM" as BlockScope, label: "Entire System", desc: "Full access" },
                  { value: "ADMIN_PANEL_ONLY" as BlockScope, label: "Admin Panel", desc: "Admin only" },
                  { value: "API_ONLY" as BlockScope, label: "API Only", desc: "API only" },
                ]
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setField("scope", opt.value)}
                  className={`flex-1 rounded-lg border-2 px-3 py-2 text-left transition-colors ${
                    form.scope === opt.value
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
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
            disabled={isPending || !form.ipAddress}
            className="flex items-center gap-1.5 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
          >
            {isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            )}
            Add to Whitelist
          </button>
        </div>
      </div>
    </div>
  );
}
