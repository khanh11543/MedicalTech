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

interface Doctor {
  id: number;
  avatar: string;
  name: string;
  email: string;
  specialty: string;
  licenseNumber: string;
  status: "Pending" | "Approved" | "Rejected";
  submittedDate: string;
}

const doctorsData: Doctor[] = [
  {
    id: 1,
    avatar: "/images/user/user-17.jpg",
    name: "Dr. Nguyen Van A",
    email: "nguyenvana@example.com",
    specialty: "Cardiology",
    licenseNumber: "MD-2024-001",
    status: "Pending",
    submittedDate: "Feb 10, 2026",
  },
  {
    id: 2,
    avatar: "/images/user/user-18.jpg",
    name: "Dr. Tran Thi B",
    email: "tranthib@example.com",
    specialty: "Dermatology",
    licenseNumber: "MD-2024-002",
    status: "Approved",
    submittedDate: "Feb 8, 2026",
  },
  {
    id: 3,
    avatar: "/images/user/user-19.jpg",
    name: "Dr. Le Van C",
    email: "levanc@example.com",
    specialty: "Neurology",
    licenseNumber: "MD-2024-003",
    status: "Pending",
    submittedDate: "Feb 12, 2026",
  },
  {
    id: 4,
    avatar: "/images/user/user-20.jpg",
    name: "Dr. Pham Thi D",
    email: "phamthid@example.com",
    specialty: "Pediatrics",
    licenseNumber: "MD-2024-004",
    status: "Rejected",
    submittedDate: "Feb 5, 2026",
  },
  {
    id: 5,
    avatar: "/images/user/user-21.jpg",
    name: "Dr. Hoang Van E",
    email: "hoangvane@example.com",
    specialty: "Orthopedics",
    licenseNumber: "MD-2024-005",
    status: "Pending",
    submittedDate: "Feb 13, 2026",
  },
];

export default function DoctorVerification() {
  return (
    <>
      <PageMeta
        title="Doctor Verification | MedicalTech Dashboard"
        description="Verify and manage doctor registrations in the MedicalTech system"
      />
      <PageBreadcrumb pageTitle="Doctor Verification" />
      <div className="space-y-6">
        <ComponentCard title="Pending Verifications">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
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
                      Email
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Specialty
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      License No.
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
                      Submitted
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
                  {doctorsData.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden rounded-full">
                            <img
                              width={40}
                              height={40}
                              src={doctor.avatar}
                              alt={doctor.name}
                            />
                          </div>
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {doctor.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {doctor.email}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {doctor.specialty}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {doctor.licenseNumber}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge
                          size="sm"
                          color={
                            doctor.status === "Approved"
                              ? "success"
                              : doctor.status === "Rejected"
                              ? "error"
                              : "warning"
                          }
                        >
                          {doctor.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {doctor.submittedDate}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors">
                            Approve
                          </button>
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                            Reject
                          </button>
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
                            View
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
