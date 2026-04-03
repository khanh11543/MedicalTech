import dayjs from "dayjs";
import {
  ServiceOrderAuditLogDetailDTO,
} from "../../../services/securityService";

interface Props {
  detail: ServiceOrderAuditLogDetailDTO | null;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function SOAuditDetailModal({ detail, isLoading, isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Audit Log Detail
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading || !detail ? (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-5 rounded bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Basic info grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Event Type" value={detail.eventType?.replace(/_/g, " ")} />
              <Field label="Actor" value={detail.actorName} />
              <Field label="Role" value={detail.actorRole} />
              <Field label="Timestamp" value={dayjs(detail.createdAt).format("YYYY-MM-DD HH:mm:ss")} />
              <Field label="Appointment ID" value={detail.appointmentId != null ? `#${detail.appointmentId}` : "—"} />
              <Field label="Consultation ID" value={detail.consultationId != null ? `#${detail.consultationId}` : "—"} />
              <Field label="Patient ID" value={detail.patientId != null ? `#${detail.patientId}` : "—"} />
              <Field label="Patient Name" value={detail.patientName} />
              <Field label="Service Order ID" value={detail.serviceOrderId != null ? `#${detail.serviceOrderId}` : "—"} />
              <Field label="Service Result ID" value={detail.serviceResultId != null ? `#${detail.serviceResultId}` : "—"} />
            </div>

            {/* Summary */}
            <div>
              <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Summary</p>
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {detail.summary || "—"}
              </p>
            </div>

            {/* Before / After data */}
            {detail.beforeData != null && (
              <JsonBlock label="Before Data" data={detail.beforeData} />
            )}
            {detail.afterData != null && (
              <JsonBlock label="After Data" data={detail.afterData} />
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3 border-t border-gray-200 pt-3 text-sm dark:border-gray-700">
              <Field label="IP Address" value={detail.ipAddress} />
              <div>
                <p className="mb-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400">User Agent</p>
                <p className="break-all text-xs text-gray-600 dark:text-gray-400">
                  {detail.userAgent || "—"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm text-gray-800 dark:text-gray-200">{value || "—"}</p>
    </div>
  );
}

function JsonBlock({ label, data }: { label: string; data: unknown }) {
  let content: string;
  if (typeof data === "string") {
    try {
      content = JSON.stringify(JSON.parse(data), null, 2);
    } catch {
      content = data;
    }
  } else {
    content = JSON.stringify(data, null, 2);
  }

  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p>
      <pre className="max-h-48 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
        {content}
      </pre>
    </div>
  );
}
