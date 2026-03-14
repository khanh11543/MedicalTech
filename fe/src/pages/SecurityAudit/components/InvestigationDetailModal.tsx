import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  InvestigationDTO,
  InvestigationTimelineDTO,
  InvestigationNoteDTO,
  InvestigationEvidenceDTO,
  EvidenceType,
  UpdateInvestigationDTO,
  AddInvestigationNoteDTO,
  AddInvestigationEvidenceDTO,
  getInvestigationTimeline,
  addInvestigationNote,
  addInvestigationEvidence,
  updateInvestigation,
  INVESTIGATION_STATUS_LABELS,
  INVESTIGATION_STATUS_COLORS,
  INVESTIGATION_TYPE_LABELS,
  INVESTIGATION_TYPE_ICONS,
  INVESTIGATION_TYPE_COLORS,
  EVIDENCE_TYPE_LABELS,
  EVIDENCE_TYPE_ICONS,
  ALL_EVIDENCE_TYPES,
  ALL_INVESTIGATION_STATUSES,
} from "../../../services/securityService";

type Tab = "info" | "evidence" | "notes" | "actions" | "resolution";

interface Props {
  open: boolean;
  onClose: () => void;
  investigation: InvestigationDTO | null;
  onUpdated: () => void;
}

const severityBadge: Record<string, string> = {
  HIGH: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  MEDIUM: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  LOW: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
};

export default function InvestigationDetailModal({
  open,
  onClose,
  investigation: inv,
  onUpdated,
}: Props) {
  const [tab, setTab] = useState<Tab>("info");
  const qc = useQueryClient();

  if (!open || !inv) return null;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "info", label: "Info & Timeline", icon: "" },
    { key: "evidence", label: "Evidence", icon: "" },
    { key: "notes", label: "Notes", icon: "" },
    { key: "actions", label: "Actions", icon: "" },
    { key: "resolution", label: "Resolution", icon: "" },
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-gray-400">#{inv.id}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${INVESTIGATION_TYPE_COLORS[inv.type].bg} ${INVESTIGATION_TYPE_COLORS[inv.type].text}`}>
                {INVESTIGATION_TYPE_ICONS[inv.type]} {INVESTIGATION_TYPE_LABELS[inv.type]}
              </span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded ${severityBadge[inv.severity]}`}>
                {inv.severity}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${INVESTIGATION_STATUS_COLORS[inv.status].bg} ${INVESTIGATION_STATUS_COLORS[inv.status].text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${INVESTIGATION_STATUS_COLORS[inv.status].dot}`} />
                {INVESTIGATION_STATUS_LABELS[inv.status]}
              </span>
            </div>
            <h3 className="mt-1 text-lg font-semibold text-gray-800 dark:text-white truncate">
              {inv.title}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0 mt-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 shrink-0 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                tab === t.key
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === "info" && <InfoTab inv={inv} />}
          {tab === "evidence" && <EvidenceTab inv={inv} onUpdated={onUpdated} />}
          {tab === "notes" && <NotesTab inv={inv} onUpdated={onUpdated} />}
          {tab === "actions" && <ActionsTab inv={inv} onUpdated={onUpdated} />}
          {tab === "resolution" && <ResolutionTab inv={inv} onUpdated={onUpdated} />}
        </div>
      </div>
    </div>
  );
}

/* ─── INFO TAB ─── */
function InfoTab({ inv }: { inv: InvestigationDTO }) {
  const { data: timeline, isLoading } = useQuery({
    queryKey: ["investigation-timeline", inv.id],
    queryFn: () => getInvestigationTimeline(inv.id),
  });

  return (
    <div className="space-y-6">
      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoField label="Description" value={inv.description || "—"} full />
        <InfoField label="Created By" value={inv.createdBy.fullName} />
        <InfoField label="Assigned To" value={inv.assignedTo?.fullName || "Unassigned"} />
        <InfoField label="Created At" value={dayjs(inv.createdAt).format("DD/MM/YYYY HH:mm")} />
        <InfoField label="Updated At" value={dayjs(inv.updatedAt).format("DD/MM/YYYY HH:mm")} />
        <InfoField label="Due Date" value={inv.dueDate ? dayjs(inv.dueDate).format("DD/MM/YYYY HH:mm") : "—"} />
        {inv.resolvedAt && (
          <InfoField label="Resolved At" value={dayjs(inv.resolvedAt).format("DD/MM/YYYY HH:mm")} />
        )}
      </div>

      {/* Related info */}
      {(inv.relatedIps.length > 0 || inv.relatedEventIds.length > 0 || inv.relatedUsers.length > 0) && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Related Information</h4>
          {inv.relatedIps.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 w-20 shrink-0 mt-1">IPs:</span>
              {inv.relatedIps.map((ip) => (
                <span key={ip} className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 rounded">
                  {ip}
                </span>
              ))}
            </div>
          )}
          {inv.relatedEventIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 w-20 shrink-0 mt-1">Events:</span>
              {inv.relatedEventIds.map((id) => (
                <span key={id} className="px-2 py-1 text-xs font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                  #{id}
                </span>
              ))}
            </div>
          )}
          {inv.relatedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 w-20 shrink-0 mt-1">Users:</span>
              {inv.relatedUsers.map((u) => (
                <span key={u.id} className="px-2 py-1 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded">
                  {u.fullName}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Timeline
        </h4>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-2 h-2 mt-2 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : timeline && timeline.length > 0 ? (
          <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
            {timeline.map((entry, i) => (
              <TimelineEntry key={i} entry={entry} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No timeline entries yet.</p>
        )}
      </div>
    </div>
  );
}

function InfoField({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <dt className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</dt>
      <dd className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function TimelineEntry({ entry }: { entry: InvestigationTimelineDTO }) {
  const typeColors: Record<string, string> = {
    CREATED: "bg-blue-500",
    STATUS_CHANGE: "bg-yellow-500",
    NOTE_ADDED: "bg-green-500",
    EVIDENCE_ADDED: "bg-purple-500",
    UPDATED: "bg-gray-500",
  };

  return (
    <div className="relative">
      <div className={`absolute -left-[25px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${typeColors[entry.type] || "bg-gray-400"}`} />
      <div className="pb-1">
        <p className="text-sm text-gray-700 dark:text-gray-300">{entry.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400">{entry.actor.fullName}</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400">
            {dayjs(entry.timestamp).format("DD/MM/YYYY HH:mm")}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── EVIDENCE TAB ─── */
function EvidenceTab({ inv, onUpdated }: { inv: InvestigationDTO; onUpdated: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [evidenceType, setEvidenceType] = useState<EvidenceType>("SECURITY_EVENT");
  const [referenceId, setReferenceId] = useState("");
  const [referenceType, setReferenceType] = useState("");
  const [description, setDescription] = useState("");
  const [filePath, setFilePath] = useState("");

  const addMut = useMutation({
    mutationFn: (dto: AddInvestigationEvidenceDTO) => addInvestigationEvidence(inv.id, dto),
    onSuccess: () => {
      onUpdated();
      setShowForm(false);
      setReferenceId("");
      setReferenceType("");
      setDescription("");
      setFilePath("");
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addMut.mutate({
      evidenceType,
      referenceId: referenceId ? Number(referenceId) : undefined,
      referenceType: referenceType || undefined,
      description: description || undefined,
      filePath: filePath || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Evidence ({inv.evidence.length})
        </h4>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          + Add Evidence
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.02] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300"
              >
                {ALL_EVIDENCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {EVIDENCE_TYPE_ICONS[t]} {EVIDENCE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Reference ID</label>
              <input
                type="number"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the evidence..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Reference Type</label>
              <input
                type="text"
                value={referenceType}
                onChange={(e) => setReferenceType(e.target.value)}
                placeholder="e.g. SecurityEvent, AuditLog"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">File Path</label>
              <input
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="Optional file path"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              Cancel
            </button>
            <button
              type="submit"
              disabled={addMut.isPending}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {addMut.isPending ? "Adding..." : "Add Evidence"}
            </button>
          </div>
        </form>
      )}

      {inv.evidence.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
          No evidence collected yet.
        </p>
      ) : (
        <div className="space-y-2">
          {inv.evidence.map((ev) => (
            <EvidenceCard key={ev.id} evidence={ev} />
          ))}
        </div>
      )}
    </div>
  );
}

function EvidenceCard({ evidence: ev }: { evidence: InvestigationEvidenceDTO }) {
  return (
    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.02]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{EVIDENCE_TYPE_ICONS[ev.evidenceType]}</span>
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {EVIDENCE_TYPE_LABELS[ev.evidenceType]}
            </span>
            {ev.referenceId && (
              <span className="ml-2 text-xs font-mono text-blue-500">
                #{ev.referenceId}
                {ev.referenceType && ` (${ev.referenceType})`}
              </span>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-400">
          {dayjs(ev.createdAt).format("DD/MM HH:mm")}
        </span>
      </div>
      {ev.description && (
        <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">{ev.description}</p>
      )}
      {ev.filePath && (
        <p className="mt-1 text-xs font-mono text-gray-400">{ev.filePath}</p>
      )}
      <p className="mt-1 text-xs text-gray-400">Added by {ev.addedBy.fullName}</p>
    </div>
  );
}

/* ─── NOTES TAB ─── */
function NotesTab({ inv, onUpdated }: { inv: InvestigationDTO; onUpdated: () => void }) {
  const [content, setContent] = useState("");

  const addMut = useMutation({
    mutationFn: (dto: AddInvestigationNoteDTO) => addInvestigationNote(inv.id, dto),
    onSuccess: () => {
      onUpdated();
      setContent("");
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addMut.mutate({ content: content.trim() });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Notes ({inv.notes.length})
      </h4>

      {/* Add note form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a note..."
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={addMut.isPending || !content.trim()}
          className="px-4 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {addMut.isPending ? "..." : "Add"}
        </button>
      </form>

      {/* Notes list */}
      {inv.notes.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
          No notes yet.
        </p>
      ) : (
        <div className="space-y-3">
          {inv.notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteCard({ note }: { note: InvestigationNoteDTO }) {
  return (
    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.02]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {note.author.fullName}
        </span>
        <span className="text-xs text-gray-400">
          {dayjs(note.createdAt).format("DD/MM/YYYY HH:mm")}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
        {note.content}
      </p>
    </div>
  );
}

/* ─── ACTIONS TAB (status changes & updates from timeline) ─── */
function ActionsTab({ inv, onUpdated }: { inv: InvestigationDTO; onUpdated: () => void }) {
  const { data: timeline, isLoading } = useQuery({
    queryKey: ["investigation-timeline", inv.id],
    queryFn: () => getInvestigationTimeline(inv.id),
  });

  // Quick status change
  const updateMut = useMutation({
    mutationFn: (dto: UpdateInvestigationDTO) => updateInvestigation(inv.id, dto),
    onSuccess: () => onUpdated(),
  });

  const actionTimeline = timeline?.filter(
    (e) => e.type === "STATUS_CHANGE" || e.type === "UPDATED"
  );

  return (
    <div className="space-y-6">
      {/* Quick status change */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Quick Status Change
        </h4>
        <div className="flex flex-wrap gap-2">
          {ALL_INVESTIGATION_STATUSES.map((s) => {
            const c = INVESTIGATION_STATUS_COLORS[s];
            const active = inv.status === s;
            return (
              <button
                key={s}
                onClick={() => !active && updateMut.mutate({ status: s })}
                disabled={active || updateMut.isPending}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
                  active
                    ? `${c.bg} ${c.text} ring-2 ring-current/30 cursor-default`
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                } disabled:opacity-50`}
              >
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                {INVESTIGATION_STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions history */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Action History
        </h4>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : actionTimeline && actionTimeline.length > 0 ? (
          <div className="space-y-2">
            {actionTimeline.map((entry, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.02]"
              >
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                  entry.type === "STATUS_CHANGE" ? "bg-yellow-500" : "bg-gray-400"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{entry.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{entry.actor.fullName}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">
                      {dayjs(entry.timestamp).format("DD/MM/YYYY HH:mm")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-4 text-center">No actions recorded yet.</p>
        )}
      </div>
    </div>
  );
}

/* ─── RESOLUTION TAB ─── */
function ResolutionTab({ inv, onUpdated }: { inv: InvestigationDTO; onUpdated: () => void }) {
  const [resolutionSummary, setResolutionSummary] = useState(inv.resolutionSummary || "");
  const [preventiveMeasures, setPreventiveMeasures] = useState(inv.preventiveMeasures || "");

  const updateMut = useMutation({
    mutationFn: (dto: UpdateInvestigationDTO) => updateInvestigation(inv.id, dto),
    onSuccess: () => onUpdated(),
  });

  const handleResolve = () => {
    updateMut.mutate({
      status: "RESOLVED",
      resolutionSummary: resolutionSummary.trim() || undefined,
      preventiveMeasures: preventiveMeasures.trim() || undefined,
    });
  };

  const handleSave = () => {
    updateMut.mutate({
      resolutionSummary: resolutionSummary.trim() || undefined,
      preventiveMeasures: preventiveMeasures.trim() || undefined,
    });
  };

  const isResolved = inv.status === "RESOLVED" || inv.status === "CLOSED";

  return (
    <div className="space-y-6">
      {isResolved && inv.resolvedAt && (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-sm font-semibold text-green-700 dark:text-green-400">
              Resolved on {dayjs(inv.resolvedAt).format("DD/MM/YYYY HH:mm")}
            </span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Resolution Summary
        </label>
        <textarea
          rows={4}
          value={resolutionSummary}
          onChange={(e) => setResolutionSummary(e.target.value)}
          placeholder="Describe the investigation findings and resolution..."
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Preventive Measures
        </label>
        <textarea
          rows={4}
          value={preventiveMeasures}
          onChange={(e) => setPreventiveMeasures(e.target.value)}
          placeholder="Steps taken to prevent recurrence..."
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={updateMut.isPending}
          className="px-5 py-2.5 text-sm font-medium rounded-lg bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 transition"
        >
          Save Draft
        </button>
        {!isResolved && (
          <button
            onClick={handleResolve}
            disabled={updateMut.isPending}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2"
          >
            {updateMut.isPending && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Mark as Resolved
          </button>
        )}
      </div>
    </div>
  );
}
