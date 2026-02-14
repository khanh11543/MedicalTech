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

interface Appointment {
  id: number;
  patientAvatar: string;
  patientName: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: "Scheduled" | "Completed" | "Cancelled" | "In Progress";
}

const appointmentsData: Appointment[] = [
  {
    id: 1,
    patientAvatar: "/images/user/user-17.jpg",
    patientName: "Nguyen Van A",
    doctorName: "Dr. Tran Thi B",
    specialty: "Cardiology",
    date: "Feb 14, 2026",
    time: "09:00 AM",
    status: "Scheduled",
  },
  {
    id: 2,
    patientAvatar: "/images/user/user-18.jpg",
    patientName: "Le Thi C",
    doctorName: "Dr. Pham Van D",
    specialty: "Dermatology",
    date: "Feb 14, 2026",
    time: "10:30 AM",
    status: "In Progress",
  },
  {
    id: 3,
    patientAvatar: "/images/user/user-19.jpg",
    patientName: "Hoang Van E",
    doctorName: "Dr. Nguyen Thi F",
    specialty: "Neurology",
    date: "Feb 13, 2026",
    time: "02:00 PM",
    status: "Completed",
  },
  {
    id: 4,
    patientAvatar: "/images/user/user-20.jpg",
    patientName: "Tran Van G",
    doctorName: "Dr. Le Thi H",
    specialty: "Pediatrics",
    date: "Feb 12, 2026",
    time: "11:00 AM",
    status: "Cancelled",
  },
  {
    id: 5,
    patientAvatar: "/images/user/user-21.jpg",
    patientName: "Pham Thi I",
    doctorName: "Dr. Hoang Van K",
    specialty: "Orthopedics",
    date: "Feb 15, 2026",
    time: "03:30 PM",
    status: "Scheduled",
  },
];

export default function AppointmentList() {
  return (
    <>
      <PageMeta
        title="Appointment Management | MedicalTech Dashboard"
        description="Manage appointments in the MedicalTech system"
      />
      <PageBreadcrumb pageTitle="Appointment Management" />
      <div className="space-y-6">
        <ComponentCard title="Appointments List">
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
                      Specialty
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
                      Time
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
                  {appointmentsData.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden rounded-full">
                            <img
                              width={40}
                              height={40}
                              src={appointment.patientAvatar}
                              alt={appointment.patientName}
                            />
                          </div>
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {appointment.patientName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {appointment.doctorName}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {appointment.specialty}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {appointment.date}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {appointment.time}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge
                          size="sm"
                          color={
                            appointment.status === "Completed"
                              ? "success"
                              : appointment.status === "Cancelled"
                              ? "error"
                              : appointment.status === "In Progress"
                              ? "info"
                              : "warning"
                          }
                        >
                          {appointment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
                            View
                          </button>
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 transition-colors">
                            Reschedule
                          </button>
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                            Cancel
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
