import Badge from "../../../components/ui/badge/Badge";

interface Props {
  selectedCount: number;
  onReviewSelected: () => void;
  onClearSelection: () => void;
  onExportSelected: () => void;
  isReviewing: boolean;
}

export default function SecurityBulkActions({
  selectedCount,
  onReviewSelected,
  onClearSelection,
  onExportSelected,
  isReviewing,
}: Props) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-5 py-3 dark:border-brand-800 dark:bg-brand-900/20">
      <div className="flex items-center gap-3">
        <Badge variant="solid" size="sm" color="primary">
          {selectedCount} selected
        </Badge>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          events selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onReviewSelected}
          disabled={isReviewing}
          className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {isReviewing ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )}
          Mark as Reviewed
        </button>

        <button
          onClick={onExportSelected}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Selected
        </button>

        <button
          onClick={onClearSelection}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700"
          title="Clear selection"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
