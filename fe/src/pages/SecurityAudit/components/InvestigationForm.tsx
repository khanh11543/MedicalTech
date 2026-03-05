import { useState, useEffect } from "react";
import {
  InvestigationDTO,
  CreateInvestigationDTO,
  UpdateInvestigationDTO,
  InvestigationType,
  InvestigationStatus,
  SecuritySeverity,
  INVESTIGATION_TYPE_LABELS,
  INVESTIGATION_TYPE_ICONS,
  INVESTIGATION_STATUS_LABELS,
  ALL_INVESTIGATION_TYPES,
  ALL_INVESTIGATION_STATUSES,
} from "../../../services/securityService";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateInvestigationDTO | UpdateInvestigationDTO) => void;
  existing?: InvestigationDTO | null;
  submitting?: boolean;
}

export default function InvestigationForm({
  open,
  onClose,
  onSubmit,
  existing,
  submitting,
}: Props) {
  const isEdit = !!existing;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<SecuritySeverity>("MEDIUM");
  const [type, setType] = useState<InvestigationType>("OTHER");
  const [status, setStatus] = useState<InvestigationStatus>("OPEN");
  const [assignedToId, setAssignedToId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [relatedIps, setRelatedIps] = useState("");
  const [relatedEventIds, setRelatedEventIds] = useState("");
  const [relatedUserIds, setRelatedUserIds] = useState("");
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [preventiveMeasures, setPreventiveMeasures] = useState("");

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description || "");
      setSeverity(existing.severity);
      setType(existing.type);
      setStatus(existing.status);
      setAssignedToId(existing.assignedTo?.id?.toString() || "");
      setDueDate(existing.dueDate ? existing.dueDate.slice(0, 16) : "");
      setRelatedIps(existing.relatedIps?.join(", ") || "");
      setRelatedEventIds(existing.relatedEventIds?.join(", ") || "");
      setRelatedUserIds(existing.relatedUsers?.map((u) => u.id).join(", ") || "");
      setResolutionSummary(existing.resolutionSummary || "");
      setPreventiveMeasures(existing.preventiveMeasures || "");
    } else {
      setTitle("");
      setDescription("");
      setSeverity("MEDIUM");
      setType("OTHER");
      setStatus("OPEN");
      setAssignedToId("");
      setDueDate("");
      setRelatedIps("");
      setRelatedEventIds("");
      setRelatedUserIds("");
      setResolutionSummary("");
      setPreventiveMeasures("");
    }
  }, [existing, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parseIds = (s: string) =>
      s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .map(Number)
        .filter((n) => !isNaN(n));

    const parseStrings = (s: string) =>
      s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

    if (isEdit) {
      const dto: UpdateInvestigationDTO = {
        title: title.trim(),
        description: description.trim() || undefined,
        severity,
        type,
        status,
        assignedToId: assignedToId ? Number(assignedToId) : undefined,
        dueDate: dueDate || undefined,
        resolutionSummary: resolutionSummary.trim() || undefined,
        preventiveMeasures: preventiveMeasures.trim() || undefined,
        relatedUserIds: relatedUserIds ? parseIds(relatedUserIds) : undefined,
        relatedIps: relatedIps ? parseStrings(relatedIps) : undefined,
        relatedEventIds: relatedEventIds ? parseIds(relatedEventIds) : undefined,
      };
      onSubmit(dto);
    } else {
      const dto: CreateInvestigationDTO = {
        title: title.trim(),
        description: description.trim() || undefined,
        severity,
        type,
        assignedToId: assignedToId ? Number(assignedToId) : undefined,
        dueDate: dueDate || undefined,
        relatedUserIds: relatedUserIds ? parseIds(relatedUserIds) : undefined,
        relatedIps: relatedIps ? parseStrings(relatedIps) : undefined,
        relatedEventIds: relatedEventIds ? parseIds(relatedEventIds) : undefined,
      };
      onSubmit(dto);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {isEdit ? "Edit Investigation" : "Create Investigation"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief investigation title"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the investigation..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Row: Severity + Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Severity <span className="text-red-500">*</span>
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SecuritySeverity)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-sm text-gray-700 dark:text-gray-300"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as InvestigationType)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-sm text-gray-700 dark:text-gray-300"
              >
                {ALL_INVESTIGATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {INVESTIGATION_TYPE_ICONS[t]} {INVESTIGATION_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: Status (edit only) + Assigned To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as InvestigationStatus)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-sm text-gray-700 dark:text-gray-300"
                >
                  {ALL_INVESTIGATION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {INVESTIGATION_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assigned To (User ID)
              </label>
              <input
                type="number"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                placeholder="Enter user ID"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-sm text-gray-700 dark:text-gray-300"
              />
            </div>
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-sm text-gray-700 dark:text-gray-300"
                />
              </div>
            )}
          </div>

          {/* Due Date (edit) */}
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-sm text-gray-700 dark:text-gray-300"
              />
            </div>
          )}

          {/* Related IPs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Related IPs <span className="text-xs text-gray-400">(comma separated)</span>
            </label>
            <input
              type="text"
              value={relatedIps}
              onChange={(e) => setRelatedIps(e.target.value)}
              placeholder="192.168.1.1, 10.0.0.1"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-sm text-gray-700 dark:text-gray-300"
            />
          </div>

          {/* Related Event IDs & User IDs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Related Event IDs <span className="text-xs text-gray-400">(comma separated)</span>
              </label>
              <input
                type="text"
                value={relatedEventIds}
                onChange={(e) => setRelatedEventIds(e.target.value)}
                placeholder="1, 2, 3"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-sm text-gray-700 dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Related User IDs <span className="text-xs text-gray-400">(comma separated)</span>
              </label>
              <input
                type="text"
                value={relatedUserIds}
                onChange={(e) => setRelatedUserIds(e.target.value)}
                placeholder="1, 2, 3"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-sm text-gray-700 dark:text-gray-300"
              />
            </div>
          </div>

          {/* Resolution fields (edit only) */}
          {isEdit && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Resolution Summary
                </label>
                <textarea
                  rows={3}
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  placeholder="Summary of investigation findings and resolution..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-sm text-gray-700 dark:text-gray-300 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preventive Measures
                </label>
                <textarea
                  rows={3}
                  value={preventiveMeasures}
                  onChange={(e) => setPreventiveMeasures(e.target.value)}
                  placeholder="Steps to prevent recurrence..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-sm text-gray-700 dark:text-gray-300 resize-none"
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-5 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {submitting && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isEdit ? "Update" : "Create"} Investigation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
