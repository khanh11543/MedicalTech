import { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import adminService, {
  ContentItem,
  ContentCreateRequest,
  Page,
} from "../../services/adminService";

export default function ContentList() {
  // Data & pagination
  const [page, setPage] = useState<Page<ContentItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Filters
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal
  const [editModal, setEditModal] = useState<{
    open: boolean;
    item: ContentItem | null;
    isNew: boolean;
  }>({ open: false, item: null, isNew: false });
  const [formData, setFormData] = useState<ContentCreateRequest>({
    title: "",
    body: "",
    summary: "",
    type: "ARTICLE",
    status: "DRAFT",
    author: "",
    isPinned: false,
  });
  const [saving, setSaving] = useState(false);

  const typeColors: Record<string, string> = {
    ARTICLE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    FAQ: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    POLICY: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    NEWS: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    GUIDE: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  };

  const statusColors: Record<string, string> = {
    DRAFT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    ARCHIVED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };

  // ---------- FETCH ----------
  const fetchContents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getContents({
        keyword: searchQuery || undefined,
        type: filterType || undefined,
        status: filterStatus || undefined,
        pageNumber: currentPage,
        pageSize,
      });
      setPage(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load content list";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterType, filterStatus, currentPage]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  // Reset to page 0 when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, filterType, filterStatus]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-US");

  // ---------- CREATE / EDIT ----------
  const openCreateModal = () => {
    setFormData({
      title: "",
      body: "",
      summary: "",
      type: "ARTICLE",
      status: "DRAFT",
      author: "",
      isPinned: false,
    });
    setEditModal({ open: true, item: null, isNew: true });
  };

  const openEditModal = (item: ContentItem) => {
    setFormData({
      title: item.title,
      body: item.body || "",
      summary: item.summary || "",
      type: item.type,
      status: item.status,
      author: item.author || "",
      isPinned: item.isPinned,
    });
    setEditModal({ open: true, item, isNew: false });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editModal.isNew) {
        await adminService.createContent(formData);
      } else if (editModal.item) {
        await adminService.updateContent(editModal.item.id, formData);
      }
      setEditModal({ open: false, item: null, isNew: false });
      fetchContents();
    } catch {
      alert("Failed to save content. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- DELETE ----------
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this content?")) return;
    try {
      await adminService.deleteContent(id);
      fetchContents();
    } catch {
      alert("Failed to delete content.");
    }
  };

  // ---------- TOGGLE STATUS ----------
  const handleToggleStatus = async (item: ContentItem) => {
    const newStatus =
      item.status === "PUBLISHED"
        ? "ARCHIVED"
        : item.status === "DRAFT"
          ? "PUBLISHED"
          : "PUBLISHED";
    try {
      await adminService.updateContentStatus(item.id, newStatus);
      fetchContents();
    } catch {
      alert("Failed to update status.");
    }
  };

  // ---------- RENDER ----------
  const contents = page?.content ?? [];

  return (
    <>
      <PageMeta
        title="Content Management | MediTech Admin"
        description="Manage content, articles, and resources in the MediTech system"
      />
      <PageBreadcrumb pageTitle="Content Management" />

      <div className="rounded-lg border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] px-6 pt-6 pb-2.5 shadow-sm">
        {/* Header with Create button */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
              />
            </div>
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                title="Filter by type"
                className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
              >
                <option value="">All Types</option>
                <option value="ARTICLE">Article</option>
                <option value="FAQ">FAQ</option>
                <option value="POLICY">Policy</option>
                <option value="NEWS">News</option>
                <option value="GUIDE">Guide</option>
              </select>
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                title="Filter by status"
                className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterType("");
                  setFilterStatus("");
                }}
                className="w-full rounded bg-gray-200 dark:bg-gray-700 px-4 py-2.5 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="rounded bg-teal-500 px-5 py-2.5 font-medium text-white hover:bg-teal-600 transition-colors whitespace-nowrap"
          >
            + New Content
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
            {error}
            <button onClick={fetchContents} className="ml-2 underline">
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="max-w-full overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-left border-b border-gray-200 dark:border-white/[0.05]">
                    <th className="min-w-[50px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">ID</th>
                    <th className="min-w-[250px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Title</th>
                    <th className="min-w-[80px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Type</th>
                    <th className="min-w-[100px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                    <th className="min-w-[100px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Author</th>
                    <th className="min-w-[100px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Views</th>
                    <th className="min-w-[130px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Updated</th>
                    <th className="min-w-[180px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-5 text-center text-gray-500 dark:text-gray-400">
                        No content found
                      </td>
                    </tr>
                  ) : (
                    contents.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-200 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-gray-900/30"
                      >
                        <td className="px-4 py-5 text-sm text-gray-900 dark:text-white">#{item.id}</td>
                        <td className="px-4 py-5">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.isPinned && <span className="mr-1" title="Pinned">📌</span>}
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                            {item.summary || item.body?.substring(0, 100)}
                          </p>
                        </td>
                        <td className="px-4 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              typeColors[item.type] || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="px-4 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              statusColors[item.status] || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-5 text-sm text-gray-900 dark:text-white">
                          {item.author || "—"}
                        </td>
                        <td className="px-4 py-5 text-sm text-gray-900 dark:text-white">
                          {item.viewCount}
                        </td>
                        <td className="px-4 py-5 text-sm text-gray-900 dark:text-white">
                          {formatDate(item.updatedAt)}
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleStatus(item)}
                              className={`rounded px-3 py-1.5 text-xs font-medium text-white transition-colors ${
                                item.status === "PUBLISHED"
                                  ? "bg-yellow-500 hover:bg-yellow-600"
                                  : "bg-green-500 hover:bg-green-600"
                              }`}
                            >
                              {item.status === "PUBLISHED" ? "Archive" : "Publish"}
                            </button>
                            <button
                              onClick={() => openEditModal(item)}
                              className="rounded bg-teal-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-600 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="rounded bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors"
                            >
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
            {page && page.totalPages > 1 && (
              <div className="border-t border-gray-200 dark:border-white/[0.05] px-4 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {page.numberOfElements} of {page.totalElements} items
                  &nbsp;—&nbsp;Page {page.number + 1} of {page.totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={page.first}
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    className="rounded border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    ← Previous
                  </button>
                  <button
                    disabled={page.last}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="rounded border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Summary (single page) */}
            {page && page.totalPages <= 1 && (
              <div className="border-t border-gray-200 dark:border-white/[0.05] px-4 py-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Total {page.totalElements} content items
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {editModal.open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editModal.isNew ? "Create New Content" : "Edit Content"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter content title..."
                  className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="content-type-select" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </label>
                  <select
                    id="content-type-select"
                    title="Content type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
                  >
                    <option value="ARTICLE">Article</option>
                    <option value="FAQ">FAQ</option>
                    <option value="POLICY">Policy</option>
                    <option value="NEWS">News</option>
                    <option value="GUIDE">Guide</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="content-status-select" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    id="content-status-select"
                    title="Content status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                    placeholder="Author name..."
                    className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPinned || false}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isPinned: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      📌 Pin content
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Summary
                </label>
                <input
                  type="text"
                  value={formData.summary || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                  placeholder="Short description..."
                  className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Body Content
                </label>
                <textarea
                  value={formData.body || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
                  rows={6}
                  placeholder="Enter body content..."
                  className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditModal({ open: false, item: null, isNew: false })}
                className="rounded bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.title.trim() || saving}
                className="rounded bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving
                  ? "Saving..."
                  : editModal.isNew
                    ? "Create"
                    : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
