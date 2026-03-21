import { useState, useEffect, useCallback } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";
import adminTimeOffService, {
  AdminTimeOffRequestDTO,
  AdminTimeOffFilter,
  AffectedAppointmentDTO,
} from "../../services/adminTimeOffService";
import type { TimeOffStatus, TimeOffType } from "../../services/doctorScheduleService";

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<TimeOffStatus, string> = {
  PENDING_REVIEW: "Pending Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const TYPE_LABELS: Record<TimeOffType, string> = {
  FULL_DAY: "Full Day",
  PARTIAL_DAY: "Partial Day",
  BREAK: "Break",
  BLOCKED_TIME: "Blocked Time",
};

const STATUS_BADGE_COLOR: Record<TimeOffStatus, "warning" | "success" | "error" | "light"> = {
  PENDING_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "error",
  CANCELLED: "light",
};

function formatDateRange(req: AdminTimeOffRequestDTO): string {
  if (req.type === "FULL_DAY") return req.date ?? "";
  const parts = [req.date];
  if (req.startTime && req.endTime) parts.push(`${req.startTime} – ${req.endTime}`);
  else if (req.startTime) parts.push(req.startTime);
  return parts.join(" • ");
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminTimeOffRequests() {
  const { toast, showToast, dismissToast } = useToast();

  // ── State ──────────────────────────────────────────────────────────────────

  // Filter
  const [filterStatus, setFilterStatus] = useState<TimeOffStatus | "">("");
  const [filterType, setFilterType] = useState<TimeOffType | "">("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Data
  const [requests, setRequests] = useState<AdminTimeOffRequestDTO[]>([]);
  const [loading, setLoading] = useState(false);

  // Detail modal
  const [detailItem, setDetailItem] = useState<AdminTimeOffRequestDTO | null>(null);
  const [detailAffected, setDetailAffected] = useState<AffectedAppointmentDTO[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  // Approve modal
  const [approveItem, setApproveItem] = useState<AdminTimeOffRequestDTO | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);

  // Reject modal
  const [rejectItem, setRejectItem] = useState<AdminTimeOffRequestDTO | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  // Affected appointments modal
  const [affectedItem, setAffectedItem] = useState<AdminTimeOffRequestDTO | null>(null);
  const [affectedList, setAffectedList] = useState<AffectedAppointmentDTO[]>([]);
  const [affectedLoading, setAffectedLoading] = useState(false);
  const [affectedOpen, setAffectedOpen] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const filter: AdminTimeOffFilter = {};
      if (filterStatus) filter.status = filterStatus as TimeOffStatus;
      if (filterType) filter.type = filterType as TimeOffType;
      if (filterDateFrom) filter.dateFrom = filterDateFrom;
      if (filterDateTo) filter.dateTo = filterDateTo;
      const data = await adminTimeOffService.list(filter);
      setRequests(data);
    } catch (e) {
      console.error("Failed to load time-off requests:", e);
      showToast("Failed to load time-off requests", "error");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType, filterDateFrom, filterDateTo, showToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const openDetail = async (item: AdminTimeOffRequestDTO) => {
    setDetailItem(item);
    setDetailAffected([]);
    setDetailOpen(true);
    if (item.id) {
      setDetailLoading(true);
      try {
        const detail = await adminTimeOffService.getById(item.id);
        setDetailItem(detail);
        setDetailAffected(detail.affectedAppointments ?? []);
      } catch (e) {
        console.error("Failed to load detail:", e);
      } finally {
        setDetailLoading(false);
      }
    }
  };

  const openAffected = async (item: AdminTimeOffRequestDTO) => {
    setAffectedItem(item);
    setAffectedList([]);
    setAffectedOpen(true);
    if (item.id) {
      setAffectedLoading(true);
      try {
        const list = await adminTimeOffService.getAffectedAppointments(item.id);
        setAffectedList(list);
      } catch (e) {
        console.error("Failed to load affected appointments:", e);
      } finally {
        setAffectedLoading(false);
      }
    }
  };

  const handleApprove = async () => {
    if (!approveItem?.id) return;
    setApproveLoading(true);
    try {
      await adminTimeOffService.approve(approveItem.id);
      showToast("Request approved successfully", "success");
      setApproveOpen(false);
      setApproveItem(null);
      fetchRequests();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? "Failed to approve request";
      showToast(msg, "error");
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectItem?.id) return;
    if (!rejectNotes.trim()) {
      showToast("Rejection reason is required", "error");
      return;
    }
    setRejectLoading(true);
    try {
      await adminTimeOffService.reject(rejectItem.id, rejectNotes.trim());
      showToast("Request rejected", "success");
      setRejectOpen(false);
      setRejectItem(null);
      setRejectNotes("");
      fetchRequests();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? "Failed to reject request";
      showToast(msg, "error");
    } finally {
      setRejectLoading(false);
    }
  };

  const openApprove = (item: AdminTimeOffRequestDTO) => {
    setApproveItem(item);
    setApproveOpen(true);
  };

  const openReject = (item: AdminTimeOffRequestDTO) => {
    setRejectItem(item);
    setRejectNotes("");
    setRejectOpen(true);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <PageMeta title="Doctor Time Off Requests | MedicalTech" description="Admin - Doctor Time Off Requests" />
      <PageBreadcrumb pageTitle="Doctor Time Off Requests" />

      {toast && <Toast toast={toast} onDismiss={dismissToast} />}

      {/* ── Filter Toolbar ─────────────────────────────────────────────────── */}
      <ComponentCard title="Filters">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Status */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TimeOffStatus | "")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">All Statuses</option>
              {(Object.keys(STATUS_LABELS) as TimeOffStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as TimeOffType | "")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">All Types</option>
              {(Object.keys(TYPE_LABELS) as TimeOffType[]).map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date From
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date To
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Apply Filters"}
          </button>
          <button
            onClick={() => {
              setFilterStatus("");
              setFilterType("");
              setFilterDateFrom("");
              setFilterDateTo("");
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Clear
          </button>
        </div>
      </ComponentCard>

      {/* ── Request List ───────────────────────────────────────────────────── */}
      <ComponentCard title={`Time Off Requests (${requests.length})`} className="mt-5">
        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading requests…</div>
        ) : requests.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No time-off requests found.</div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                onDetail={() => openDetail(req)}
                onAffected={() => openAffected(req)}
                onApprove={() => openApprove(req)}
                onReject={() => openReject(req)}
              />
            ))}
          </div>
        )}
      </ComponentCard>

      {/* ── Detail Modal ───────────────────────────────────────────────────── */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} className="max-w-2xl">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            Request Detail
          </h3>
          {detailLoading ? (
            <div className="py-8 text-center text-gray-500">Loading…</div>
          ) : detailItem ? (
            <DetailView item={detailItem} affected={detailAffected} />
          ) : null}
          <div className="mt-6 flex justify-end gap-2">
            {detailItem?.status === "PENDING_REVIEW" && (
              <>
                <button
                  onClick={() => { setDetailOpen(false); if (detailItem) openApprove(detailItem); }}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => { setDetailOpen(false); if (detailItem) openReject(detailItem); }}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Reject
                </button>
              </>
            )}
            <button
              onClick={() => setDetailOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Affected Appointments Modal ────────────────────────────────────── */}
      <Modal isOpen={affectedOpen} onClose={() => setAffectedOpen(false)} className="max-w-2xl">
        <div className="p-6">
          <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white">
            Affected Appointments
          </h3>
          {affectedItem && (
            <p className="mb-4 text-sm text-gray-500">
              {affectedItem.doctorName} — {formatDateRange(affectedItem)}
            </p>
          )}
          {affectedLoading ? (
            <div className="py-8 text-center text-gray-500">Loading…</div>
          ) : affectedList.length === 0 ? (
            <div className="py-6 text-center text-gray-500">No appointments affected.</div>
          ) : (
            <AffectedTable rows={affectedList} />
          )}
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setAffectedOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Approve Modal ─────────────────────────────────────────────────── */}
      <Modal isOpen={approveOpen} onClose={() => setApproveOpen(false)} className="max-w-md">
        <div className="p-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
            Approve Request
          </h3>
          {approveItem && (
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Approve <strong>{TYPE_LABELS[approveItem.type!]}</strong> request for{" "}
              <strong>{approveItem.doctorName}</strong> on <strong>{formatDateRange(approveItem)}</strong>?
            </p>
          )}
          {approveItem?.hasHeavyConflict && (
            <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              ⚠ This request has high-priority appointment conflicts (checked-in / in-progress). Please review before approving.
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setApproveOpen(false)}
              disabled={approveLoading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={approveLoading}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {approveLoading ? "Approving…" : "Approve"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Reject Modal ──────────────────────────────────────────────────── */}
      <Modal isOpen={rejectOpen} onClose={() => setRejectOpen(false)} className="max-w-md">
        <div className="p-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
            Reject Request
          </h3>
          {rejectItem && (
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              Reject <strong>{TYPE_LABELS[rejectItem.type!]}</strong> request for{" "}
              <strong>{rejectItem.doctorName}</strong> on <strong>{formatDateRange(rejectItem)}</strong>.
            </p>
          )}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={3}
              placeholder="Provide a reason for rejection…"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setRejectOpen(false)}
              disabled={rejectLoading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={rejectLoading || !rejectNotes.trim()}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {rejectLoading ? "Rejecting…" : "Reject"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface RequestCardProps {
  req: AdminTimeOffRequestDTO;
  onDetail: () => void;
  onAffected: () => void;
  onApprove: () => void;
  onReject: () => void;
}

function RequestCard({ req, onDetail, onAffected, onApprove, onReject }: RequestCardProps) {
  const status = (req.status ?? "PENDING_REVIEW") as TimeOffStatus;
  const type = (req.type ?? "FULL_DAY") as TimeOffType;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-start justify-between gap-2">
        {/* Left: Doctor + info */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-800 dark:text-white">
              {req.doctorName || `Doctor #${req.doctorId}`}
            </span>
            <Badge color={STATUS_BADGE_COLOR[status]}>{STATUS_LABELS[status]}</Badge>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {TYPE_LABELS[type]}
            </span>
            {req.hasHeavyConflict && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                ⚠ Heavy Conflict
              </span>
            )}
          </div>

          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Date:</span> {formatDateRange(req)}
          </div>

          {req.reason && (
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Reason:</span> {req.reason}
            </div>
          )}

          {req.reviewNotes && (
            <div className="mt-1 text-sm text-amber-700 dark:text-amber-400">
              <span className="font-medium">Review Note:</span> {req.reviewNotes}
            </div>
          )}

          {(req.affectedAppointmentsCount ?? 0) > 0 && (
            <button
              onClick={onAffected}
              className="mt-1 text-sm text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {req.affectedAppointmentsCount} appointment{req.affectedAppointmentsCount !== 1 ? "s" : ""} affected
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={onDetail}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            View Detail
          </button>
          {status === "PENDING_REVIEW" && (
            <>
              <button
                onClick={onApprove}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={onReject}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                Reject
              </button>
            </>
          )}
          {status === "APPROVED" && (
            <button
              onClick={onReject}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              Reject
            </button>
          )}
        </div>
      </div>

      {/* Footer: created at */}
      {req.createdAt && (
        <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          Submitted: {new Date(req.createdAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// ── Detail View ────────────────────────────────────────────────────────────────

interface DetailViewProps {
  item: AdminTimeOffRequestDTO;
  affected: AffectedAppointmentDTO[];
}

function DetailView({ item, affected }: DetailViewProps) {
  const status = (item.status ?? "PENDING_REVIEW") as TimeOffStatus;
  const type = (item.type ?? "FULL_DAY") as TimeOffType;

  return (
    <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
      <Row label="Doctor" value={item.doctorName ?? `#${item.doctorId}`} />
      <Row label="Status">
        <Badge color={STATUS_BADGE_COLOR[status]}>{STATUS_LABELS[status]}</Badge>
      </Row>
      <Row label="Type" value={TYPE_LABELS[type]} />
      <Row label="Date/Time" value={formatDateRange(item)} />
      {item.reason && <Row label="Reason" value={item.reason} />}
      {item.notes && <Row label="Notes" value={item.notes} />}
      {item.reviewNotes && <Row label="Review Note" value={item.reviewNotes} className="text-amber-700 dark:text-amber-400" />}
      <Row label="Affected Appointments" value={String(item.affectedAppointmentsCount ?? 0)} />
      {item.hasHeavyConflict && (
        <div className="rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          ⚠ This request has heavy conflicts (CHECKED_IN / IN_PROGRESS appointments).
        </div>
      )}
      {affected.length > 0 && (
        <div className="pt-2">
          <p className="mb-2 font-medium text-gray-800 dark:text-white">Affected Appointments:</p>
          <AffectedTable rows={affected} />
        </div>
      )}
      <Row label="Submitted" value={item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"} />
    </div>
  );
}

interface RowProps {
  label: string;
  value?: string;
  children?: React.ReactNode;
  className?: string;
}

function Row({ label, value, children, className }: RowProps) {
  return (
    <div className="flex gap-2">
      <span className="w-40 flex-shrink-0 font-medium text-gray-500 dark:text-gray-400">{label}</span>
      {children ?? <span className={className}>{value}</span>}
    </div>
  );
}

// ── Affected Table ─────────────────────────────────────────────────────────────

function AffectedTable({ rows }: { rows: AffectedAppointmentDTO[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Patient</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Date</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Time</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {rows.map((r) => (
            <tr key={r.appointmentId} className={r.heavyConflict ? "bg-red-50 dark:bg-red-900/10" : ""}>
              <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                {r.patientName || "—"}
                {r.heavyConflict && (
                  <span className="ml-1 text-xs text-red-500">⚠</span>
                )}
              </td>
              <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{r.appointmentDate}</td>
              <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                {r.startTime} – {r.endTime}
              </td>
              <td className="px-4 py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  r.heavyConflict
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                }`}>
                  {r.status.replace(/_/g, " ")}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
