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

interface User {
  id: number;
  avatar: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive" | "Pending";
  joinDate: string;
}

const usersData: User[] = [
  {
    id: 1,
    avatar: "/images/user/user-17.jpg",
    name: "Lindsey Curtis",
    email: "lindsey.curtis@example.com",
    role: "Admin",
    status: "Active",
    joinDate: "Jan 12, 2024",
  },
  {
    id: 2,
    avatar: "/images/user/user-18.jpg",
    name: "Kaiya George",
    email: "kaiya.george@example.com",
    role: "Doctor",
    status: "Active",
    joinDate: "Feb 5, 2024",
  },
  {
    id: 3,
    avatar: "/images/user/user-19.jpg",
    name: "Zain Geidt",
    email: "zain.geidt@example.com",
    role: "Patient",
    status: "Pending",
    joinDate: "Mar 18, 2024",
  },
  {
    id: 4,
    avatar: "/images/user/user-20.jpg",
    name: "Abram Schleifer",
    email: "abram.schleifer@example.com",
    role: "Receptionist",
    status: "Active",
    joinDate: "Apr 3, 2024",
  },
  {
    id: 5,
    avatar: "/images/user/user-21.jpg",
    name: "Carla George",
    email: "carla.george@example.com",
    role: "Nurse",
    status: "Inactive",
    joinDate: "May 22, 2024",
  },
];

export default function UserList() {
  return (
    <>
      <PageMeta
        title="User Management | MedicalTech Dashboard"
        description="Manage users in the MedicalTech system"
      />
      <PageBreadcrumb pageTitle="User Management" />
      <div className="space-y-6">
        <ComponentCard title="Users List">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      User
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
                      Role
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
                      Join Date
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
                  {usersData.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden rounded-full">
                            <img
                              width={40}
                              height={40}
                              src={user.avatar}
                              alt={user.name}
                            />
                          </div>
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {user.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {user.email}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge
                          size="sm"
                          color={
                            user.role === "Admin"
                              ? "primary"
                              : user.role === "Doctor"
                              ? "success"
                              : user.role === "Patient"
                              ? "info"
                              : "warning"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge
                          size="sm"
                          color={
                            user.status === "Active"
                              ? "success"
                              : user.status === "Inactive"
                              ? "error"
                              : "warning"
                          }
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {user.joinDate}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
                            Edit
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
