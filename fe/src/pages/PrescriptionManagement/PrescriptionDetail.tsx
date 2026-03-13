import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
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
import prescriptionService, {
  SendPrescriptionEmailDTO,
} from "../../services/prescriptionService";

// ==================== ICONS ====================
const ArrowLeftIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);
const PrintIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);
const DownloadIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);
const MailIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const CalendarIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const UserIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const StethoscopeIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);
const CopyIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
const ChevronDownIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
const ChevronUpIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

// ==================== HELPERS ====================
const maskPhone = (phone?: string | null): string => {
  if (!phone) return '-';
  if (phone.length <= 4) return phone;
  return phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4);
};

const maskEmail = (email?: string | null): string => {
  if (!email) return '-';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visibleChars = Math.min(2, local.length);
  return local.slice(0, visibleChars) + '***@' + domain;
};

const getStatusBadgeColor = (status: string): "success" | "error" | "warn" | "light" => {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'EXPIRED': return 'error';
    case 'CANCELLED':
    case 'VOID': return 'warn';
    default: return 'light';
  }
};

// ==================== INFO ROW COMPONENT ====================
const InfoRow = ({ label, value, masked }: { label: string; value?: string | number | null; masked?: boolean }) => (
  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
    <span className={`text-sm text-right max-w-[60%] ${masked ? 'font-mono text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-white/90'}`}>
      {value || '-'}
    </span>
  </div>
);

// ==================== MAIN COMPONENT ====================
export default function PrescriptionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const prescriptionId = Number(id);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [emailForm, setEmailForm] = useState<SendPrescriptionEmailDTO>({
    email: '',
    includePDF: true,
    customMessage: '',
    sendCopy: false,
    patientRequested: false,
  });

  // Fetch prescription detail
  const { data: prescription, isLoading, error } = useQuery({
    queryKey: ['prescription-detail', prescriptionId],
    queryFn: () => prescriptionService.getPrescriptionDetail(prescriptionId),
    enabled: !!prescriptionId,
  });

  // Send email mutation
  const emailMutation = useMutation({
    mutationFn: (dto: SendPrescriptionEmailDTO) =>
      prescriptionService.sendPrescriptionEmail(prescriptionId, dto),
    onSuccess: () => {
      alert('Prescription sent successfully!');
      setShowEmailModal(false);
      setEmailForm({ email: '', includePDF: true, customMessage: '', sendCopy: false, patientRequested: false });
    },
    onError: () => {
      alert('Failed to send prescription email');
    },
  });

  // Download PDF (COPY - not original, rule 7.1)
  const handleDownloadPdf = async () => {
    try {
      const blob = await prescriptionService.downloadPrescriptionPdf(prescriptionId);
      prescriptionService.downloadFile(blob, `prescription_COPY_${prescription?.prescriptionCode || prescriptionId}.pdf`);
    } catch {
      alert('Failed to download PDF');
    }
  };

  // Print (COPY)
  const handlePrint = async () => {
    try {
      const result = await prescriptionService.printPrescription(prescriptionId, 'HTML');
      if (result.content) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(result.content);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch {
      alert('Failed to print prescription');
    }
  };

  // Copy prescription code to clipboard
  const handleCopyCode = async () => {
    if (prescription?.prescriptionCode) {
      try {
        await navigator.clipboard.writeText(prescription.prescriptionCode);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      } catch {
        // Fallback
        const el = document.createElement('textarea');
        el.value = prescription.prescriptionCode;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      }
    }
  };

  // Handle email submit
  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.email.trim()) {
      alert('Please enter an email address');
      return;
    }
    if (!emailForm.patientRequested) {
      alert('Please confirm that the patient has requested this email.');
      return;
    }
    emailMutation.mutate(emailForm);
  };

  if (isLoading) {
    return (
      <>
        <PageMeta title="Prescription Detail | MedicalTech Dashboard" description="Prescription detail" />
        <PageBreadcrumb pageTitle="Prescription Detail" />
        <div className="flex justify-center items-center py-20">
          <div className="animate-pulse text-gray-500">Loading prescription details...</div>
        </div>
      </>
    );
  }

  if (error || !prescription) {
    return (
      <>
        <PageMeta title="Prescription Detail | MedicalTech Dashboard" description="Prescription detail" />
        <PageBreadcrumb pageTitle="Prescription Detail" />
        <div className="py-10">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            <p className="font-bold mb-1">Error Loading Prescription</p>
            <p className="text-sm">{(error as any)?.response?.data?.message || (error as any)?.message || 'Prescription not found'}</p>
            <button
              onClick={() => navigate('/prescription-list')}
              className="mt-3 text-sm text-red-600 hover:underline dark:text-red-400"
            >
              &larr; Back to Prescription List
            </button>
          </div>
        </div>
      </>
    );
  }

  const expiryInfo = (() => {
    if (prescription.expiryDate) {
      const isExpired = dayjs().isAfter(dayjs(prescription.expiryDate));
      return {
        label: dayjs(prescription.expiryDate).format('MMM DD, YYYY'),
        warning: isExpired,
        warningText: isExpired ? 'This prescription has expired' : undefined,
      };
    }
    return { label: 'Not defined', warning: true, warningText: 'Expiry date not defined for this prescription' };
  })();

  return (
    <>
      <PageMeta
        title={`Prescription ${prescription.prescriptionCode} | MedicalTech Dashboard`}
        description="Prescription detail view (read-only)"
      />
      <PageBreadcrumb pageTitle="Prescription Detail" />

      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/prescription-list')}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeftIcon /> Back
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 font-mono">
                  {prescription.prescriptionCode}
                </h2>
                {/* Copy prescription code */}
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                  title="Copy prescription code"
                >
                  <CopyIcon />
                  {codeCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge size="sm" color={getStatusBadgeColor(prescription.status)}>
                  {prescription.status}
                </Badge>
                {/* Expiry warning */}
                {expiryInfo.warning && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {expiryInfo.warningText}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Admin: No Edit button. Print/Download only as COPY */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              <PrintIcon /> Print Copy
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              <DownloadIcon /> Export PDF (Copy)
            </button>
            <button
              onClick={() => {
                setEmailForm(prev => ({ ...prev, email: prescription.patientEmail || '' }));
                setShowEmailModal(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <MailIcon /> Send Email
            </button>
            {prescription.appointmentId && (
              <button
                onClick={() => navigate(`/admin/appointment-detail/${prescription.appointmentId}`)}
                className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
              >
                <CalendarIcon /> View Appointment
              </button>
            )}
          </div>
        </div>

        {/* Read-Only Banner */}
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
          <svg className="h-5 w-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Read-Only:</strong> Admin cannot edit prescriptions. If an error is found, use &quot;Request Doctor Review&quot; to notify the prescribing doctor.
          </div>
        </div>

        {/* Prescription Info Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Patient Info (privacy-compliant) */}
          <ComponentCard title="Patient Information">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <UserIcon />
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-white/90">{prescription.patientName}</p>
                {prescription.medicalRecordNumber && (
                  <p className="text-xs text-gray-400">MRN: {prescription.medicalRecordNumber}</p>
                )}
              </div>
            </div>
            <div className="space-y-0">
              <InfoRow label="Age" value={prescription.patientAge ? `${prescription.patientAge} years` : undefined} />
              <InfoRow label="Gender" value={prescription.patientGender} />
              {/* Phone & Email masked for privacy */}
              <InfoRow label="Phone" value={maskPhone(prescription.patientPhone)} masked />
              <InfoRow label="Email" value={maskEmail(prescription.patientEmail)} masked />
              {/* Address collapsed by default */}
              <div className="py-2 border-b border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setShowAddress(!showAddress)}
                  className="flex w-full items-center justify-between text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <span>Address</span>
                  <span className="flex items-center gap-1 text-xs text-blue-500">
                    {showAddress ? (
                      <>Hide <ChevronUpIcon /></>
                    ) : (
                      <>Show <ChevronDownIcon /></>
                    )}
                  </span>
                </button>
                {showAddress && (
                  <p className="mt-2 text-sm text-gray-800 dark:text-white/90 text-right">
                    {prescription.patientAddress || '-'}
                  </p>
                )}
              </div>
            </div>
          </ComponentCard>

          {/* Doctor Info */}
          <ComponentCard title="Doctor Information">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <StethoscopeIcon />
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-white/90">{prescription.doctorName}</p>
                {prescription.doctorSpecialization && (
                  <p className="text-xs text-gray-400">{prescription.doctorSpecialization}</p>
                )}
              </div>
            </div>
            <div className="space-y-0">
              <InfoRow label="Email" value={prescription.doctorEmail} />
              <InfoRow label="License No." value={prescription.doctorLicenseNumber} />
              <InfoRow label="Specialization" value={prescription.doctorSpecialization} />
              {/* Doctor signature display */}
              {prescription.doctorSignature && (
                <div className="py-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Signature</p>
                  <div className="flex justify-end">
                    <img
                      src={prescription.doctorSignature}
                      alt="Doctor Signature"
                      className="max-h-16 border border-gray-200 rounded p-1 dark:border-gray-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </ComponentCard>
        </div>

        {/* Prescription Details */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ComponentCard title="Prescription Details">
            <div className="space-y-0">
              <InfoRow label="Prescription Code" value={prescription.prescriptionCode} />
              <InfoRow label="Prescribed Date" value={prescription.prescribedDate ? dayjs(prescription.prescribedDate).format('MMM DD, YYYY') : undefined} />
              {/* Expiry with warning */}
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Expiry Date</span>
                <span className={`text-sm text-right ${expiryInfo.warning ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-gray-800 dark:text-white/90'}`}>
                  {expiryInfo.label}
                </span>
              </div>
              <InfoRow label="Status" value={prescription.status} />
              <InfoRow label="Created At" value={prescription.createdAt ? dayjs(prescription.createdAt).format('MMM DD, YYYY HH:mm') : undefined} />
              <InfoRow label="Updated At" value={prescription.updatedAt ? dayjs(prescription.updatedAt).format('MMM DD, YYYY HH:mm') : undefined} />
            </div>
          </ComponentCard>

          <ComponentCard title="Appointment Information">
            <div className="space-y-0">
              <InfoRow label="Appointment Code" value={prescription.appointmentCode} />
              <InfoRow label="Appointment Date" value={prescription.appointmentDate ? dayjs(prescription.appointmentDate).format('MMM DD, YYYY HH:mm') : undefined} />
              {prescription.appointmentId && (
                <div className="py-3">
                  <button
                    onClick={() => navigate(`/admin/appointment-detail/${prescription.appointmentId}`)}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    View Appointment Details &rarr;
                  </button>
                </div>
              )}
            </div>
          </ComponentCard>
        </div>

        {/* Diagnosis with Clinical Information Warning */}
        {prescription.diagnosis && (
          <ComponentCard title="Diagnosis &amp; ICD-10">
            <div className="space-y-3">
              {/* Clinical information warning */}
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 dark:bg-amber-900/10 dark:border-amber-800">
                <svg className="h-4 w-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>Clinical Information:</strong> This section contains sensitive medical data. Handle per clinic privacy policy.
                </span>
              </div>
              <div
                className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 dark:bg-yellow-900/10 dark:border-yellow-800 select-none"
                onCopy={(e) => e.preventDefault()}
              >
                <p className="text-sm text-gray-800 dark:text-white/90 whitespace-pre-wrap">{prescription.diagnosis}</p>
              </div>
            </div>
          </ComponentCard>
        )}

        {/* Medications Table (full detail in detail view, per spec 4.2) */}
        <ComponentCard title={`Medications (${prescription.medications?.length || 0} items)`}>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">#</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Medicine Name</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Dosage</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Frequency</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Duration</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Quantity</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Unit</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Instructions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {prescription.medications?.map((med, idx) => (
                    <TableRow key={med.id || idx}>
                      <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{idx + 1}</TableCell>
                      <TableCell className="px-5 py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-white/90">{med.medicineName}</TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{med.dosage || '-'}</TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{med.frequency || '-'}</TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{med.duration || '-'}</TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{med.quantity ?? '-'}</TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{med.unit || '-'}</TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 max-w-[200px]">
                        {med.instructions || '-'}
                        {med.notes && (
                          <p className="text-xs text-gray-400 mt-1 italic">Note: {med.notes}</p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!prescription.medications || prescription.medications.length === 0) && (
                    <TableRow>
                      <TableCell className="px-5 py-8 text-center text-gray-400 dark:text-gray-500">
                        No medications found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentCard>

        {/* General Notes */}
        {(prescription.notes || prescription.generalNotes) && (
          <ComponentCard title="Notes">
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 dark:bg-gray-800/50 dark:border-gray-700">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {prescription.generalNotes || prescription.notes}
              </p>
            </div>
          </ComponentCard>
        )}

        {/* Request Doctor Review CTA (if admin spots an issue) */}
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">Found an issue with this prescription?</p>
            <button
              onClick={() => alert('Request Doctor Review feature: This would create an internal ticket to the prescribing doctor for review.')}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Request Doctor Review
            </button>
          </div>
        </div>
      </div>

      {/* Email Modal - with patient requested confirmation */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 dark:bg-gray-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Send Prescription via Email</h3>
            {/* COPY watermark notice */}
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 mb-4 dark:bg-blue-900/10 dark:border-blue-800">
              <svg className="h-4 w-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-blue-700 dark:text-blue-400">
                The PDF will be sent as a <strong>COPY</strong> with watermark. Original is issued by the doctor only.
              </span>
            </div>
            <form onSubmit={handleSendEmail}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={emailForm.email}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    placeholder="patient@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Reason / Note (optional)</label>
                  <textarea
                    value={emailForm.customMessage}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, customMessage: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-transparent p-3 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    rows={2}
                    placeholder="Reason for resending (logged for audit)..."
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-400 mt-1">{emailForm.customMessage?.length || 0}/200</p>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={emailForm.includePDF}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, includePDF: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    Include PDF attachment
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={emailForm.sendCopy}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, sendCopy: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    Send copy to prescribing doctor
                  </label>
                  {/* Patient requested confirmation (REQUIRED) */}
                  <label className="flex items-start gap-2 text-sm rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 dark:bg-amber-900/10 dark:border-amber-800">
                    <input
                      type="checkbox"
                      checked={emailForm.patientRequested}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, patientRequested: e.target.checked }))}
                      className="rounded border-amber-300 mt-0.5"
                      required
                    />
                    <span className="text-amber-700 dark:text-amber-400">
                      <strong>Required:</strong> I confirm the patient has requested this email to be sent.
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={emailMutation.isPending || !emailForm.patientRequested}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {emailMutation.isPending ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
