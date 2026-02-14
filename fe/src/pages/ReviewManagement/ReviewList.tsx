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

interface Review {
  id: number;
  patientAvatar: string;
  patientName: string;
  doctorName: string;
  rating: number;
  comment: string;
  reviewDate: string;
  status: "Published" | "Pending" | "Hidden";
}

const reviewsData: Review[] = [
  {
    id: 1,
    patientAvatar: "/images/user/user-17.jpg",
    patientName: "Nguyen Van A",
    doctorName: "Dr. Tran Thi B",
    rating: 5,
    comment: "Excellent service and very professional doctor!",
    reviewDate: "Feb 14, 2026",
    status: "Published",
  },
  {
    id: 2,
    patientAvatar: "/images/user/user-18.jpg",
    patientName: "Le Thi C",
    doctorName: "Dr. Pham Van D",
    rating: 4,
    comment: "Good experience, but waiting time was a bit long.",
    reviewDate: "Feb 13, 2026",
    status: "Published",
  },
  {
    id: 3,
    patientAvatar: "/images/user/user-19.jpg",
    patientName: "Hoang Van E",
    doctorName: "Dr. Nguyen Thi F",
    rating: 3,
    comment: "Average service, room for improvement.",
    reviewDate: "Feb 12, 2026",
    status: "Pending",
  },
  {
    id: 4,
    patientAvatar: "/images/user/user-20.jpg",
    patientName: "Tran Van G",
    doctorName: "Dr. Le Thi H",
    rating: 5,
    comment: "Best doctor I've ever visited. Highly recommended!",
    reviewDate: "Feb 11, 2026",
    status: "Published",
  },
  {
    id: 5,
    patientAvatar: "/images/user/user-21.jpg",
    patientName: "Pham Thi I",
    doctorName: "Dr. Hoang Van K",
    rating: 2,
    comment: "Not satisfied with the consultation.",
    reviewDate: "Feb 10, 2026",
    status: "Hidden",
  },
];

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

export default function ReviewList() {
  return (
    <>
      <PageMeta
        title="Review Management | MedicalTech Dashboard"
        description="Manage reviews in the MedicalTech system"
      />
      <PageBreadcrumb pageTitle="Review Management" />
      <div className="space-y-6">
        <ComponentCard title="Reviews List">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Patient
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Doctor
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Rating
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Comment
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Date
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
                  {reviewsData.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden rounded-full">
                            <img
                              width={40}
                              height={40}
                              src={review.patientAvatar}
                              alt={review.patientName}
                            />
                          </div>
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {review.patientName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {review.doctorName}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <StarRating rating={review.rating} />
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 max-w-[250px] truncate">
                        {review.comment}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {review.reviewDate}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge
                          size="sm"
                          color={
                            review.status === "Published"
                              ? "success"
                              : review.status === "Hidden"
                              ? "error"
                              : "warning"
                          }
                        >
                          {review.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
                            View
                          </button>
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors">
                            Approve
                          </button>
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                            Hide
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
