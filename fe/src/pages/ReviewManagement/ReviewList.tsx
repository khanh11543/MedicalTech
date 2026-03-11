import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

export default function ReviewList() {
  return (
    <>
      <PageMeta
        title="Review Management | MediTech Admin"
        description="Manage patient reviews and ratings in the MediTech system"
      />
      <PageBreadcrumb pageTitle="Review Management" />

      <div className="rounded-lg border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] px-6 pt-6 pb-2.5 shadow-sm">
        <div className="px-4 py-5 text-center text-gray-500 dark:text-gray-400">
          Review Management Component - Coming Soon
        </div>
      </div>
    </>
  );
}
