import { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import Button from "../../components/ui/button/Button";
import adminService, {
  SupportTicketItem,
  SupportTicketListParams,
  SupportTicketStats,
  Page,
} from "../../services/adminService";

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  RESOLVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CLOSED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const categoryLabels: Record<string, string> = {
  GENERAL: "General",
  TECHNICAL: "Technical",
  BILLING: "Billing",
  ACCOUNT: "Account",
  APPOINTMENT: "Appointment",
  OTHER: "Other",
};

export default function SupportList() {
  const [tickets, setTickets] = useState<Page<SupportTicketItem> | null>(null);
  const [stats, setStats] = useState<SupportTicketStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast, showToast, dismissToast } = useToast();
  const [filters, setFilters] = useState<SupportTicketListParams>({
    pageNumber: 0,
    pageSize: 10,
  });

  const { isOpen: isDetailOpen, openModal: openDetail, closeModal: closeDetail } = useModal();
  const { isOpen: isRespondOpen, openModal: openRespond, closeModal: closeRespond } = useModal();

  const [viewingTicket, setViewingTicket] = useState<SupportTicketItem | null>(null);
  const [respondingTicket, setRespondingTicket] = useState<SupportTicketItem | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responseStatus, setResponseStatus] = useState("RESOLVED");
  const [respondLoading, setRespondLoading] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getSupportTickets(filters);
      setTickets(data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminService.getSupportTicketStats();
      setStats(data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleFilterChange = (key: keyof SupportTicketListParams, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, pageNumber: 0 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, pageNumber: newPage }));
  };

  const handleViewDetail = async (ticket: SupportTicketItem) => {
    try {
      const detail = await adminService.getSupportTicketDetail(ticket.id);
      setViewingTicket(detail);
      openDetail();
    } catch {
      setViewingTicket(ticket);
      openDetail();
    }
  };

  const handleOpenRespond = (ticket: SupportTicketItem) => {
    setRespondingTicket(ticket);
    setResponseText("");
    setResponseStatus("RESOLVED");
    openRespond();
  };

  const handleRespond = async () => {
    if (!respondingTicket || !responseText.trim()) return;
    setRespondLoading(true);
    try {
      await adminService.respondToTicket(respondingTicket.id, {
        adminResponse: responseText,
        status: responseStatus,
      });
      closeRespond();
      setTickets(prev => prev ? {
        ...prev,
        content: prev.content.map(t => t.id === respondingTicket.id ? { ...t, status: responseStatus, adminResponse: responseText } : t)
      } : prev);
      showToast("Response sent successfully", "success");
      fetchStats();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(e.response?.data?.message || "Failed to respond", "error");
    } finally {
      setRespondLoading(false);
    }
  };

  const handleClose = async (id: number) => {
    try {
      await adminService.closeTicket(id);
      setTickets(prev => prev ? {
        ...prev,
        content: prev.content.map(t => t.id === id ? { ...t, status: "CLOSED" } : t)
      } : prev);
      showToast("Ticket closed", "success");
      fetchStats();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(e.response?.data?.message || "Failed to close ticket", "error");
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleString("vi-VN");

  return (
    <>
      <PageMeta
        title="Support Tickets | MedicalTech Dashboard"
        description="Manage support tickets - MedicalTech Admin"
      />
      <PageBreadcrumb pageTitle="Support Tickets" />

      {/* Stats Cards */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white/90">{stats.totalTickets}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/10">
            <p className="text-xs text-blue-600 dark:text-blue-400">Open</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.openTickets}</p>
          </div>
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/10">
            <p className="text-xs text-yellow-600 dark:text-yellow-400">In Progress</p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.inProgressTickets}</p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/10">
            <p className="text-xs text-green-600 dark:text-green-400">Resolved</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.resolvedTickets}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">Closed</p>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{stats.closedTickets}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          title="Filter by status"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          value={filters.status || ""}
          onChange={(e) => handleFilterChange("status", e.target.value)}
        >
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select
          title="Filter by category"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          value={filters.category || ""}
          onChange={(e) => handleFilterChange("category", e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="GENERAL">General</option>
          <option value="TECHNICAL">Technical</option>
          <option value="BILLING">Billing</option>
          <option value="ACCOUNT">Account</option>
          <option value="APPOINTMENT">Appointment</option>
          <option value="OTHER">Other</option>
        </select>

        <select
          title="Filter by priority"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          value={filters.priority || ""}
          onChange={(e) => handleFilterChange("priority", e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>

        <input
          type="text"
          title="Search tickets"
          placeholder="Search by subject or user..."
          className="flex-1 min-w-[200px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          value={filters.q || ""}
          onChange={(e) => handleFilterChange("q", e.target.value)}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
          <button
            className="ml-2 underline"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : !tickets || tickets.content.length === 0 ? (
          <div className="py-20 text-center text-gray-500 dark:text-gray-400">
            No support tickets found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      ID
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Subject
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      User
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Category
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Priority
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Created
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.content.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                        #{ticket.id}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400 text-left"
                          onClick={() => handleViewDetail(ticket)}
                        >
                          {ticket.subject}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-800 dark:text-white/90">
                          {ticket.userName || "—"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {ticket.userEmail}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {categoryLabels[ticket.category] || ticket.category}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            priorityColors[ticket.priority] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusColors[ticket.status] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {ticket.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(ticket.status === "OPEN" || ticket.status === "IN_PROGRESS") && (
                            <button
                              className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition"
                              onClick={() => handleOpenRespond(ticket)}
                            >
                              Respond
                            </button>
                          )}
                          {ticket.status !== "CLOSED" && (
                            <button
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition"
                              onClick={() => handleClose(ticket.id)}
                            >
                              Close
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {tickets.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Page {tickets.number + 1} of {tickets.totalPages} ({tickets.totalElements} total)
                </p>
                <div className="flex gap-2">
                  <button
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                    disabled={tickets.first}
                    onClick={() => handlePageChange(tickets.number - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                    disabled={tickets.last}
                    onClick={() => handlePageChange(tickets.number + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={closeDetail} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="pr-10">
            <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
              Ticket #{viewingTicket?.id}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              {viewingTicket?.subject}
            </p>
          </div>

          {viewingTicket && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    statusColors[viewingTicket.status] || ""
                  }`}
                >
                  {viewingTicket.status.replace("_", " ")}
                </span>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    priorityColors[viewingTicket.priority] || ""
                  }`}
                >
                  {viewingTicket.priority}
                </span>
                <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                  {categoryLabels[viewingTicket.category] || viewingTicket.category}
                </span>
              </div>

              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">From</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {viewingTicket.userName || "—"} ({viewingTicket.userEmail})
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Message</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {viewingTicket.message}
                </p>
              </div>

              {viewingTicket.adminResponse && (
                <div className="rounded-lg bg-brand-50 p-4 dark:bg-brand-900/10">
                  <p className="text-xs text-brand-600 dark:text-brand-400 mb-1">Admin Response</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {viewingTicket.adminResponse}
                  </p>
                  {viewingTicket.respondedAt && (
                    <p className="mt-2 text-xs text-gray-400">
                      Responded: {formatDate(viewingTicket.respondedAt)}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-between text-xs text-gray-400">
                <span>Created: {formatDate(viewingTicket.createdAt)}</span>
                <span>Updated: {formatDate(viewingTicket.updatedAt)}</span>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button size="sm" variant="outline" onClick={closeDetail}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Respond Modal */}
      <Modal isOpen={isRespondOpen} onClose={closeRespond} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="pr-10">
            <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
              Respond to Ticket #{respondingTicket?.id}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              {respondingTicket?.subject}
            </p>
          </div>

          {respondingTicket && (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Original Message</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {respondingTicket.message}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Your Response
                </label>
                <textarea
                  title="Admin response"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder:text-gray-500"
                  rows={5}
                  placeholder="Type your response..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Set Status
                </label>
                <select
                  title="Ticket status after response"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  value={responseStatus}
                  onChange={(e) => setResponseStatus(e.target.value)}
                >
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeRespond}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRespond}
              disabled={respondLoading || !responseText.trim()}
            >
              {respondLoading ? "Sending..." : "Send Response"}
            </Button>
          </div>
        </div>
      </Modal>
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
