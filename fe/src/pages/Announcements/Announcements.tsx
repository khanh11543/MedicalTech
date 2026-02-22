import { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import adminService, {
  ContentItem,
  ContentCreateRequest,
  ContentListParams,
  Page,
} from "../../services/adminService";

const typeColors: Record<string, string> = {
  NEWS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ARTICLE: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  POLICY: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  GUIDE: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  FAQ: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  ARCHIVED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const EMPTY_FORM: ContentCreateRequest = {
  title: "",
  body: "",
  summary: "",
  type: "NEWS",
  status: "DRAFT",
  author: "",
  isPinned: false,
};

export default function Announcements() {
  const [contents, setContents] = useState<Page<ContentItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ContentListParams>({
    pageNumber: 0,
    pageSize: 10,
  });

  const { isOpen: isFormOpen, openModal: openForm, closeModal: closeForm } = useModal();
  const { isOpen: isDetailOpen, openModal: openDetail, closeModal: closeDetail } = useModal();
  const { isOpen: isDeleteOpen, openModal: openDelete, closeModal: closeDelete } = useModal();

  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [viewingItem, setViewingItem] = useState<ContentItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<ContentCreateRequest>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchContents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getContents(filters);
      setContents(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const handleFilterChange = (key: keyof ContentListParams, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value, pageNumber: 0 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, pageNumber: newPage }));
  };

  const handleCreate = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    openForm();
  };

  const handleEdit = (item: ContentItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      body: item.body,
      summary: item.summary || "",
      type: item.type,
      status: item.status,
      author: item.author || "",
      isPinned: item.isPinned,
    });
    openForm();
  };

  const handleView = async (id: number) => {
    try {
      const detail = await adminService.getContentDetail(id);
      setViewingItem(detail);
      openDetail();
    } catch {
      setError("Failed to load announcement details");
    }
  };

  const handleSave = async () => {
    if (!form.title?.trim()) return;
    setSaving(true);
    try {
      if (editingItem) {
        await adminService.updateContent(editingItem.id, form);
      } else {
        await adminService.createContent(form);
      }
      closeForm();
      fetchContents();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await adminService.updateContentStatus(id, status);
      fetchContents();
    } catch {
      setError("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await adminService.deleteContent(deletingId);
      closeDelete();
      setDeletingId(null);
      fetchContents();
    } catch {
      setError("Failed to delete announcement");
    }
  };

  const confirmDelete = (id: number) => {
    setDeletingId(id);
    openDelete();
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <PageMeta title="Announcements | MediTech Admin" description="Manage system announcements" />
      <PageBreadcrumb pageTitle="Announcements" />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-6 pt-6 pb-2.5 shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Announcements
          </h3>
          <button onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Announcement
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <input
              placeholder="Search announcements..."
              value={filters.keyword || ""}
              onChange={(e) => handleFilterChange("keyword", e.target.value || undefined)}
              className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
            />
          </div>
          <div>
            <select value={filters.type || ""} onChange={(e) => handleFilterChange("type", e.target.value || undefined)}
              title="Filter by type"
              className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none">
              <option value="">All Types</option>
              <option value="NEWS">News</option>
              <option value="ARTICLE">Article</option>
              <option value="POLICY">Policy</option>
              <option value="GUIDE">Guide</option>
              <option value="FAQ">FAQ</option>
            </select>
          </div>
          <div>
            <select value={filters.status || ""} onChange={(e) => handleFilterChange("status", e.target.value || undefined)}
              title="Filter by status"
              className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none">
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div>
            <button onClick={() => setFilters({ pageNumber: 0, pageSize: 10 })}
              className="w-full rounded bg-gray-100 dark:bg-gray-800 px-4 py-2.5 font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Reset
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 p-4 text-red-700 dark:text-red-400">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-teal-500 border-t-transparent" />
          </div>
        )}

        {/* Table */}
        {!loading && contents && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-left border-b border-gray-200 dark:border-white/[0.05]">
                    <th className="min-w-[40px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Pin</th>
                    <th className="min-w-[250px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Title</th>
                    <th className="min-w-[80px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Type</th>
                    <th className="min-w-[100px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                    <th className="min-w-[100px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Author</th>
                    <th className="min-w-[60px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Views</th>
                    <th className="min-w-[120px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Created</th>
                    <th className="min-w-[180px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contents.content.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        No announcements found. Create your first announcement!
                      </td>
                    </tr>
                  ) : (
                    contents.content.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-gray-900/30">
                        <td className="px-4 py-4">
                          {item.isPinned && (
                            <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <button onClick={() => handleView(item.id)} className="text-left">
                            <p className="text-sm font-medium text-gray-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400">
                              {item.title}
                            </p>
                            {item.summary && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{item.summary}</p>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[item.type]}`}>{item.type}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[item.status]}`}>{item.status}</span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">{item.author || "-"}</td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">{item.viewCount}</td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">{formatDate(item.createdAt)}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {item.status === "DRAFT" && (
                              <button onClick={() => handleStatusChange(item.id, "PUBLISHED")}
                                className="text-green-600 hover:text-green-800 dark:text-green-400 text-xs font-medium">
                                Publish
                              </button>
                            )}
                            {item.status === "PUBLISHED" && (
                              <button onClick={() => handleStatusChange(item.id, "ARCHIVED")}
                                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 text-xs font-medium">
                                Archive
                              </button>
                            )}
                            {item.status === "ARCHIVED" && (
                              <button onClick={() => handleStatusChange(item.id, "PUBLISHED")}
                                className="text-green-600 hover:text-green-800 dark:text-green-400 text-xs font-medium">
                                Republish
                              </button>
                            )}
                            <button onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs font-medium">
                              Edit
                            </button>
                            <button onClick={() => confirmDelete(item.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 text-xs font-medium">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {contents.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-white/[0.05] px-4 py-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {contents.numberOfElements} of {contents.totalElements} results
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handlePageChange(contents.number - 1)} disabled={contents.first}
                    className="rounded bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
                    Previous
                  </button>
                  <span className="flex items-center px-4 text-sm text-gray-700 dark:text-gray-300">
                    Page {contents.number + 1} / {contents.totalPages}
                  </span>
                  <button onClick={() => handlePageChange(contents.number + 1)} disabled={contents.last}
                    className="rounded bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ====== CREATE/EDIT MODAL ====== */}
      <Modal isOpen={isFormOpen} onClose={closeForm} className="max-w-2xl m-4">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {editingItem ? "Edit Announcement" : "New Announcement"}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Title *</label>
              <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
                placeholder="Announcement title" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Summary</label>
              <input value={form.summary || ""} onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
                className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
                placeholder="Brief summary" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
              <textarea value={form.body || ""} onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))} rows={6}
                className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none resize-none"
                placeholder="Announcement content..." />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                <select value={form.type || "NEWS"} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                  title="Select type"
                  className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none">
                  <option value="NEWS">News</option>
                  <option value="ARTICLE">Article</option>
                  <option value="POLICY">Policy</option>
                  <option value="GUIDE">Guide</option>
                  <option value="FAQ">FAQ</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select value={form.status || "DRAFT"} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  title="Select status"
                  className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none">
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Author</label>
                <input value={form.author || ""} onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
                  className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
                  placeholder="Author name" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPinned" checked={form.isPinned || false}
                onChange={(e) => setForm((prev) => ({ ...prev, isPinned: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
              <label htmlFor="isPinned" className="text-sm text-gray-700 dark:text-gray-300">Pin this announcement</label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={closeForm}
              className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !form.title?.trim()}
              className="rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50 transition-colors">
              {saving ? "Saving..." : editingItem ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ====== VIEW DETAIL MODAL ====== */}
      <Modal isOpen={isDetailOpen} onClose={closeDetail} className="max-w-2xl m-4">
        {viewingItem && (
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[viewingItem.type]}`}>{viewingItem.type}</span>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[viewingItem.status]}`}>{viewingItem.status}</span>
                  {viewingItem.isPinned && (
                    <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{viewingItem.title}</h3>
              </div>
            </div>

            {viewingItem.summary && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">{viewingItem.summary}</p>
            )}

            <div className="prose dark:prose-invert max-w-none mb-6">
              <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{viewingItem.body}</div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-sm text-gray-500 dark:text-gray-400 grid grid-cols-2 gap-2">
              <div>Author: <span className="text-gray-900 dark:text-white">{viewingItem.author || "N/A"}</span></div>
              <div>Views: <span className="text-gray-900 dark:text-white">{viewingItem.viewCount}</span></div>
              <div>Created: <span className="text-gray-900 dark:text-white">{formatDate(viewingItem.createdAt)}</span></div>
              <div>Updated: <span className="text-gray-900 dark:text-white">{formatDate(viewingItem.updatedAt)}</span></div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { closeDetail(); handleEdit(viewingItem); }}
                className="rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors">
                Edit
              </button>
              <button onClick={closeDetail}
                className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ====== DELETE CONFIRMATION MODAL ====== */}
      <Modal isOpen={isDeleteOpen} onClose={closeDelete} className="max-w-md m-4">
        <div className="p-6 text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Announcement</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to delete this announcement? This action cannot be undone.</p>
          <div className="flex justify-center gap-3">
            <button onClick={closeDelete}
              className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button onClick={handleDelete}
              className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors">
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
