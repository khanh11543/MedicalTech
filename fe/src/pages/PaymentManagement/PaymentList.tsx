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

interface Payment {
  id: number;
  patientAvatar: string;
  patientName: string;
  invoiceNo: string;
  service: string;
  amount: string;
  paymentMethod: string;
  paymentDate: string;
  status: "Paid" | "Pending" | "Failed" | "Refunded";
}

const paymentsData: Payment[] = [
  {
    id: 1,
    patientAvatar: "/images/user/user-17.jpg",
    patientName: "Nguyen Van A",
    invoiceNo: "INV-2026-001",
    service: "General Consultation",
    amount: "500,000 VND",
    paymentMethod: "Credit Card",
    paymentDate: "Feb 14, 2026",
    status: "Paid",
  },
  {
    id: 2,
    patientAvatar: "/images/user/user-18.jpg",
    patientName: "Le Thi C",
    invoiceNo: "INV-2026-002",
    service: "Blood Test",
    amount: "350,000 VND",
    paymentMethod: "Cash",
    paymentDate: "Feb 14, 2026",
    status: "Paid",
  },
  {
    id: 3,
    patientAvatar: "/images/user/user-19.jpg",
    patientName: "Hoang Van E",
    invoiceNo: "INV-2026-003",
    service: "X-Ray Scan",
    amount: "800,000 VND",
    paymentMethod: "Bank Transfer",
    paymentDate: "Feb 13, 2026",
    status: "Pending",
  },
  {
    id: 4,
    patientAvatar: "/images/user/user-20.jpg",
    patientName: "Tran Van G",
    invoiceNo: "INV-2026-004",
    service: "Surgery",
    amount: "15,000,000 VND",
    paymentMethod: "Insurance",
    paymentDate: "Feb 12, 2026",
    status: "Pending",
  },
  {
    id: 5,
    patientAvatar: "/images/user/user-21.jpg",
    patientName: "Pham Thi I",
    invoiceNo: "INV-2026-005",
    service: "Dental Cleaning",
    amount: "200,000 VND",
    paymentMethod: "Credit Card",
    paymentDate: "Feb 10, 2026",
    status: "Refunded",
  },
];

export default function PaymentList() {
  return (
    <>
      <PageMeta
        title="Payment Management | MedicalTech Dashboard"
        description="Manage payments in the MedicalTech system"
      />
      <PageBreadcrumb pageTitle="Payment Management" />
      <div className="space-y-6">
        <ComponentCard title="Payments List">
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
                      Invoice No.
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Service
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Amount
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Method
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
                  {paymentsData.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden rounded-full">
                            <img
                              width={40}
                              height={40}
                              src={payment.patientAvatar}
                              alt={payment.patientName}
                            />
                          </div>
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {payment.patientName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {payment.invoiceNo}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {payment.service}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-800 text-start text-theme-sm font-medium dark:text-white/90">
                        {payment.amount}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {payment.paymentMethod}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {payment.paymentDate}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge
                          size="sm"
                          color={
                            payment.status === "Paid"
                              ? "success"
                              : payment.status === "Failed"
                              ? "error"
                              : payment.status === "Refunded"
                              ? "info"
                              : "warning"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
                            View
                          </button>
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors">
                            Receipt
                          </button>
                          <button className="px-3 py-1.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors">
                            Refund
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
