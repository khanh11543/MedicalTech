import { useEffect, useState } from "react";
import userService, {
  SupportTicket,
  CreateSupportTicketRequest,
} from "../../services/userService";

const CATEGORIES = [
  "GENERAL",
  "TECHNICAL",
  "BILLING",
  "APPOINTMENT",
  "ACCOUNT",
  "OTHER",
];

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  RESOLVED:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CLOSED: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

export default function UserSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [form, setForm] = useState<CreateSupportTicketRequest>({
    subject: "",
    message: "",
    category: "GENERAL",
    priority: "MEDIUM",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchTickets = async (p = page) => {
    try {
      setLoading(true);
      const data = await userService.getMySupportTickets(p, 10);
      setTickets(data.content);
      setTotalPages(data.totalPages);
    } catch {
      setError("Failed to load support tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      setError("Subject and message are required.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await userService.createSupportTicket(form);
      setSuccess("Support ticket created successfully!");
      setForm({ subject: "", message: "", category: "GENERAL", priority: "MEDIUM" });
      setShowForm(false);
      setPage(0);
      await fetchTickets(0);
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setError("Failed to create support ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = async (id: number) => {
    try {
      const ticket = await userService.getSupportTicketDetail(id);
      setSelectedTicket(ticket);
    } catch {
      setError("Failed to load ticket details.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Support
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Submit a support ticket or check the status of existing ones.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setSelectedTicket(null);
          }}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition"
        >
          {showForm ? "Cancel" : "+ New Ticket"}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          {success}
        </div>
      )}

      {/* New Ticket Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Create Support Ticket
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                title="Category"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value })
                }
                title="Priority"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              >
                {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Subject
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) =>
                setForm({ ...form, subject: e.target.value })
              }
              placeholder="Brief summary of your issue"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              maxLength={200}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Message
            </label>
            <textarea
              value={form.message}
              onChange={(e) =>
                setForm({ ...form, message: e.target.value })
              }
              placeholder="Describe your issue in detail..."
              rows={5}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              maxLength={2000}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition"
            >
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {selectedTicket.subject}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    STATUS_STYLES[selectedTicket.status] || STATUS_STYLES.OPEN
                  }`}
                >
                  {selectedTicket.status.replace("_", " ")}
                </span>
                <span>
                  {selectedTicket.category.charAt(0) +
                    selectedTicket.category.slice(1).toLowerCase()}
                </span>
                <span>
                  {PRIORITY_LABELS[selectedTicket.priority] ||
                    selectedTicket.priority}
                </span>
                <span>
                  {new Date(selectedTicket.createdAt).toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "short", day: "numeric" }
                  )}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedTicket(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
              title="Close"
            >
              &times;
            </button>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200 whitespace-pre-wrap">
            {selectedTicket.message}
          </div>

          {selectedTicket.adminResponse && (
            <div>
              <h4 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Admin Response
              </h4>
              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 whitespace-pre-wrap">
                {selectedTicket.adminResponse}
              </div>
              {selectedTicket.respondedAt && (
                <p className="mt-1 text-xs text-gray-400">
                  Responded on{" "}
                  {new Date(selectedTicket.respondedAt).toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "short", day: "numeric" }
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tickets List */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">
            My Tickets
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            No support tickets yet. Click "+ New Ticket" to create one.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {tickets.map((ticket) => (
              <li
                key={ticket.id}
                onClick={() => openDetail(ticket.id)}
                className="flex cursor-pointer items-center justify-between px-6 py-4 transition hover:bg-gray-50 dark:hover:bg-gray-750"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                    {ticket.subject}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        STATUS_STYLES[ticket.status] || STATUS_STYLES.OPEN
                      }`}
                    >
                      {ticket.status.replace("_", " ")}
                    </span>
                    <span>
                      {ticket.category.charAt(0) +
                        ticket.category.slice(1).toLowerCase()}
                    </span>
                    <span>
                      {new Date(ticket.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <svg
                  className="ml-4 h-5 w-5 flex-shrink-0 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 dark:border-gray-700">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Page {page + 1} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
