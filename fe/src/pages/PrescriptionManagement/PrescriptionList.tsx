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

interface Prescription {
  id: number;
  patientAvatar: string;
  patientName: string;
  doctorName: string;
  medications: string;
  diagnosis: string;
  prescribedDate: string;
  status: "Active" | "Completed" | "Expired";
}

const prescriptionsData: Prescription[] = [
  {
    id: 1,
    patientAvatar: "/images/user/user-17.jpg",
    patientName: "Nguyen Van A",
    doctorName: "Dr. Tran Thi B",
    medications: "Amoxicillin 500mg, Paracetamol 500mg",
    diagnosis: "Upper Respiratory Infection",
    prescribedDate: "Feb 14, 2026",
    status: "Active",
  },
  {
    id: 2,
    patientAvatar: "/images/user/user-18.jpg",
    patientName: "Le Thi C",
    doctorName: "Dr. Pham Van D",
    medications: "Metformin 850mg, Lisinopril 10mg",
    diagnosis: "Type 2 Diabetes, Hypertension",
    prescribedDate: "Feb 10, 2026",
    status: "Active",
  },
  {
    id: 3,
    patientAvatar: "/images/user/user-19.jpg",
    patientName: "Hoang Van E",
    doctorName: "Dr. Nguyen Thi F",
    medications: "Ibuprofen 400mg",
    diagnosis: "Muscle Pain",
    prescribedDate: "Feb 5, 2026",
    status: "Completed",
  },
  {
    id: 4,
    patientAvatar: "/images/user/user-20.jpg",
    patientName: "Tran Van G",
    doctorName: "Dr. Le Thi H",
    medications: "Cetirizine 10mg",
    diagnosis: "Allergic Rhinitis",
    prescribedDate: "Jan 20, 2026",
    status: "Expired",
  },
  {
    id: 5,
    patientAvatar: "/images/user/user-21.jpg",
    patientName: "Pham Thi I",
    doctorName: "Dr. Hoang Van K",
    medications: "Omeprazole 20mg, Domperidone 10mg",
    diagnosis: "Gastroesophageal Reflux",
    prescribedDate: "Feb 12, 2026",
    status: "Active",
  },
];

export default function PrescriptionList() {
  return (
    <>
      <PageMeta
        title="Prescription Management | MedicalTech Dashboard"
        description="Manage prescriptions in the MedicalTech system"
      />
      <PageBreadcrumb pageTitle="Prescription Management" />
      <div className="space-y-6">
        <ComponentCard title="Prescriptions List">
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
                      Diagnosis
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Medications
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
                  {prescriptionsData.map((prescription) => (
                    <TableRow key={prescription.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden rounded-full">
                            <img
                              width={40}
                              height={40}
                              src={prescription.patientAvatar}
                              alt={prescription.patientName}
                            />
                          </div>
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {prescription.patientName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {prescription.doctorName}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {prescription.diagnosis}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 max-w-[200px] truncate">
                        {prescription.medications}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {prescription.prescribedDate}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge
                          size="sm"
                          color={
                            prescription.status === "Active"
                              ? "success"
                              : prescription.status === "Expired"
                              ? "error"
                              : "info"
                          }
                        >
                          {prescription.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
                            View
                          </button>
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors">
                            Renew
                          </button>
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors">
                            Print
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
