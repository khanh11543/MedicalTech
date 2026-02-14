import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";

interface Content {
  id: number;
  title: string;
  type: "Article" | "News" | "FAQ" | "Policy";
  author: string;
  category: string;
  publishedDate: string;
  status: "Published" | "Draft" | "Archived";
}

const contentsData: Content[] = [
  {
    id: 1,
    title: "How to Prepare for Your First Doctor Visit",
    type: "Article",
    author: "Admin",
    category: "Patient Guide",
    publishedDate: "Feb 14, 2026",
    status: "Published",
  },
  {
    id: 2,
    title: "New COVID-19 Vaccination Schedule Update",
    type: "News",
    author: "Dr. Nguyen Van A",
    category: "Health News",
    publishedDate: "Feb 13, 2026",
    status: "Published",
  },
  {
    id: 3,
    title: "How do I book an appointment online?",
    type: "FAQ",
    author: "Support Team",
    category: "General",
    publishedDate: "Feb 10, 2026",
    status: "Published",
  },
  {
    id: 4,
    title: "Privacy Policy Update 2026",
    type: "Policy",
    author: "Legal Team",
    category: "Legal",
    publishedDate: "Feb 1, 2026",
    status: "Draft",
  },
  {
    id: 5,
    title: "Tips for Managing Diabetes at Home",
    type: "Article",
    author: "Dr. Tran Thi B",
    category: "Health Tips",
    publishedDate: "Jan 25, 2026",
    status: "Archived",
  },
];

export default function ContentList() {
  return (
    <>
      <PageMeta
        title="Content Management | MedicalTech Dashboard"
        description="Manage content in the MedicalTech system"
      />
      <PageBreadcrumb pageTitle="Content Management" />
      <div className="space-y-6">
        <ComponentCard title="Content List">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Title
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Type
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Author
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Category
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Published
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {contentsData.map((content) => (
                    <TableRow key={content.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90 max-w-[250px] truncate block">
                          {content.title}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge
                          size="sm"
                          color={
                            content.type === "Article"
                              ? "primary"
                              : content.type === "News"
                              ? "info"
                              : content.type === "FAQ"
                              ? "warning"
                              : "success"
                          }
                        >
                          {content.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {content.author}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {content.category}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {content.publishedDate}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge
                          size="sm"
                          color={
                            content.status === "Published"
                              ? "success"
                              : content.status === "Archived"
                              ? "error"
                              : "warning"
                          }
                        >
                          {content.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
                            Edit
                          </button>
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors">
                            Publish
                          </button>
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                            Delete
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
