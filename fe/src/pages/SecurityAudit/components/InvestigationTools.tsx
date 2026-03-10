import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ComponentCard from "../../../components/common/ComponentCard";
import InvestigationStats from "./InvestigationStats";
import InvestigationFilters from "./InvestigationFilters";
import InvestigationTable from "./InvestigationTable";
import InvestigationForm from "./InvestigationForm";
import InvestigationDetailModal from "./InvestigationDetailModal";
import {
  InvestigationFilter,
  InvestigationSummaryDTO,
  InvestigationDTO,
  CreateInvestigationDTO,
  UpdateInvestigationDTO,
  getInvestigations,
  getInvestigationById,
  getInvestigationStats,
  createInvestigation,
  updateInvestigation,
  deleteInvestigation,
} from "../../../services/securityService";

export default function InvestigationTools() {
  const qc = useQueryClient();

  // Filter state
  const [filter, setFilter] = useState<InvestigationFilter>({
    sortBy: "createdAt",
    sortDir: "DESC",
    pageNumber: 0,
    pageSize: 20,
  });

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InvestigationDTO | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  // -------- Queries --------
  const statsQ = useQuery({
    queryKey: ["investigation-stats"],
    queryFn: getInvestigationStats,
  });

  const listQ = useQuery({
    queryKey: ["investigations", filter],
    queryFn: () => getInvestigations(filter),
  });

  const detailQ = useQuery({
    queryKey: ["investigation-detail", detailId],
    queryFn: () => getInvestigationById(detailId!),
    enabled: detailId !== null,
  });

  // -------- Mutations --------
  const invalidateAll = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["investigations"] });
    qc.invalidateQueries({ queryKey: ["investigation-stats"] });
    if (detailId) {
      qc.invalidateQueries({ queryKey: ["investigation-detail", detailId] });
      qc.invalidateQueries({ queryKey: ["investigation-timeline", detailId] });
    }
  }, [qc, detailId]);

  const createMut = useMutation({
    mutationFn: (dto: CreateInvestigationDTO) => createInvestigation(dto),
    onSuccess: () => {
      invalidateAll();
      setFormOpen(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateInvestigationDTO }) =>
      updateInvestigation(id, dto),
    onSuccess: () => {
      invalidateAll();
      setFormOpen(false);
      setEditTarget(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteInvestigation(id),
    onSuccess: () => {
      invalidateAll();
      setDetailId(null);
    },
  });

  // -------- Handlers --------
  const handleFormSubmit = (dto: CreateInvestigationDTO | UpdateInvestigationDTO) => {
    if (editTarget) {
      updateMut.mutate({ id: editTarget.id, dto: dto as UpdateInvestigationDTO });
    } else {
      createMut.mutate(dto as CreateInvestigationDTO);
    }
  };

  const handleView = (item: InvestigationSummaryDTO) => {
    setDetailId(item.id);
  };

  const handleEdit = () => {
    if (detailQ.data) {
      setEditTarget(detailQ.data);
      setDetailId(null);
      setFormOpen(true);
    }
  };

  const openCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <ComponentCard title="Investigation Statistics">
        <InvestigationStats stats={statsQ.data ?? null} loading={statsQ.isLoading} />
      </ComponentCard>

      {/* Dashboard */}
      <ComponentCard
        title="Investigation Dashboard"
        desc="Create and manage security investigations"
      >
        <div className="space-y-4">
          {/* Actions bar */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {listQ.data ? `${listQ.data.totalElements} investigation(s)` : "Loading..."}
            </div>
            <button
              onClick={openCreate}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Investigation
            </button>
          </div>

          {/* Filters */}
          <InvestigationFilters filter={filter} onChange={setFilter} />

          {/* Table */}
          <InvestigationTable
            data={listQ.data?.content || []}
            total={listQ.data?.totalElements || 0}
            filter={filter}
            onFilterChange={setFilter}
            onView={handleView}
            loading={listQ.isLoading}
          />
        </div>
      </ComponentCard>

      {/* Create / Edit form */}
      <InvestigationForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
        }}
        onSubmit={handleFormSubmit}
        existing={editTarget}
        submitting={createMut.isPending || updateMut.isPending}
      />

      {/* Detail modal */}
      <InvestigationDetailModal
        open={detailId !== null && !!detailQ.data}
        onClose={() => setDetailId(null)}
        investigation={detailQ.data ?? null}
        onUpdated={invalidateAll}
      />
    </div>
  );
}
