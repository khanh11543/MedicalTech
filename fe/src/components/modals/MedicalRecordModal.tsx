import { useState, useEffect } from "react";
import { AppointmentDTO } from "../../services/appointmentService";
import consultationService, { ConsultationDTO } from "../../services/consultationService";
import { escHtml } from "../../utils/xss";

interface MedicalRecordModalProps {
    appointment: AppointmentDTO | null;
    isOpen: boolean;
    onClose: () => void;
}

const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

function formatVitals(vitals: ConsultationDTO["vitals"]): string[] {
    if (!vitals) return [];
    const lines: string[] = [];
    if (vitals.temperature) lines.push(`Temp: ${vitals.temperature}\u00b0C`);
    if (vitals.systolic && vitals.diastolic) lines.push(`BP: ${vitals.systolic}/${vitals.diastolic} mmHg`);
    if (vitals.heartRate) lines.push(`HR: ${vitals.heartRate} bpm`);
    if (vitals.respiratoryRate) lines.push(`RR: ${vitals.respiratoryRate} /min`);
    if (vitals.weight) lines.push(`Weight: ${vitals.weight} kg`);
    if (vitals.height) lines.push(`Height: ${vitals.height} cm`);
    if (vitals.bmi) lines.push(`BMI: ${vitals.bmi}`);
    return lines;
}

function handleDownloadPDF(appointment: AppointmentDTO, consultation: ConsultationDTO) {
    const vitalLines = formatVitals(consultation.vitals);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
  <title>Consultation Record - ${escHtml(appointment.patientName)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #111; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .subtitle { color: #555; font-size: 13px; margin-bottom: 24px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #555; margin-bottom: 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field-label { font-size: 11px; color: #888; text-transform: uppercase; }
    .field-value { font-size: 14px; margin-top: 2px; }
    .box { background: #f5f5f5; border-radius: 6px; padding: 12px; font-size: 14px; white-space: pre-wrap; min-height: 40px; }
    .no-data { color: #aaa; font-style: italic; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>Consultation Record</h1>
  <div class="subtitle">Doctor: ${escHtml(consultation.doctorName)}</div>

  <div class="section">
    <div class="section-title">Consultation Summary</div>
    <div class="grid">
      <div><div class="field-label">Date</div><div class="field-value">${escHtml(formatDateTime(appointment.appointmentDate))}</div></div>
      <div><div class="field-label">Duration</div><div class="field-value">${appointment.startTime} â€“ ${appointment.endTime}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Patient Information</div>
    <div class="field-value"><strong>${escHtml(appointment.patientName)}</strong></div>
    <div class="field-value">${escHtml(appointment.patientEmail)}</div>
    ${appointment.patientPhone ? `<div class="field-value">${escHtml(appointment.patientPhone)}</div>` : ""}
  </div>

  ${consultation.chiefComplaint ? `
  <div class="section">
    <div class="section-title">Chief Complaint</div>
    <div class="box">${escHtml(consultation.chiefComplaint)}</div>
  </div>` : ""}

  ${consultation.hpi ? `
  <div class="section">
    <div class="section-title">History of Present Illness</div>
    <div class="box">${escHtml(consultation.hpi)}</div>
  </div>` : ""}

  ${vitalLines.length > 0 ? `
  <div class="section">
    <div class="section-title">Vital Signs</div>
    <div class="box">${escHtml(vitalLines.join("  |  "))}</div>
  </div>` : ""}

  <div class="section">
    <div class="section-title">Physical Examination</div>
    <div class="box">${consultation.physicalExam ? escHtml(consultation.physicalExam) : '<span class="no-data">Not recorded</span>'}</div>
  </div>

  <div class="section">
    <div class="section-title">Diagnosis</div>
    <div class="box">${consultation.diagnosis ? escHtml(consultation.diagnosis) : '<span class="no-data">Not recorded</span>'}${consultation.diagnosticCode ? ` (${escHtml(consultation.diagnosticCode)})` : ""}</div>
  </div>

  <div class="section">
    <div class="section-title">Treatment Plan</div>
    <div class="box">${consultation.plan ? escHtml(consultation.plan) : '<span class="no-data">Not recorded</span>'}</div>
  </div>

  ${consultation.followUpInstructions ? `
  <div class="section">
    <div class="section-title">Follow-up Instructions</div>
    <div class="box">${escHtml(consultation.followUpInstructions)}</div>
  </div>` : ""}

  <div class="section">
    <div class="section-title">Record Date</div>
    <div class="field-value">${escHtml(formatDateTime(consultation.createdAt))}</div>
  </div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
}

export default function MedicalRecordModal({
    appointment,
    isOpen,
    onClose,
}: MedicalRecordModalProps) {
    const [consultation, setConsultation] = useState<ConsultationDTO | null>(null);
    const [loading, setLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!isOpen || !appointment || appointment.status !== "COMPLETED") {
            setConsultation(null);
            setNotFound(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setNotFound(false);
        consultationService.getConsultation(appointment.id).then((data) => {
            if (cancelled) return;
            setConsultation(data);
        }).catch(() => {
            if (!cancelled) setNotFound(true);
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [isOpen, appointment]);

    if (!isOpen || !appointment) return null;

    const isCompleted = appointment.status === "COMPLETED";
    const vitalLines = consultation ? formatVitals(consultation.vitals) : [];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 dark:bg-black/60"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Medical Record
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4 space-y-6">
                        {!isCompleted && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-4">
                                <p className="font-semibold text-yellow-900 dark:text-yellow-200 text-sm">No Medical Record Available</p>
                                <p className="text-xs text-yellow-800 dark:text-yellow-300 mt-0.5">
                                    Medical records are only available for completed appointments.
                                </p>
                            </div>
                        )}

                        {isCompleted && loading && (
                            <div className="flex justify-center py-8">
                                <svg className="w-8 h-8 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                            </div>
                        )}

                        {isCompleted && !loading && notFound && (
                            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    No consultation record was found for this appointment.
                                </p>
                            </div>
                        )}

                        {isCompleted && !loading && consultation && (
                            <>
                                {/* Consultation Summary */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">Consultation Summary</h4>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Date</span>
                                                <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDateTime(appointment.appointmentDate)}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Duration</span>
                                                <p className="mt-1 text-sm text-gray-900 dark:text-white">{appointment.startTime} - {appointment.endTime}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Patient Info */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">Patient Information</h4>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                        <p className="font-medium text-gray-900 dark:text-white">{appointment.patientName}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{appointment.patientEmail}</p>
                                    </div>
                                </div>

                                {/* Chief Complaint */}
                                {consultation.chiefComplaint && (
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">Chief Complaint</h4>
                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{consultation.chiefComplaint}</p>
                                        </div>
                                    </div>
                                )}

                                {/* HPI */}
                                {consultation.hpi && (
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">History of Present Illness</h4>
                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{consultation.hpi}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Vital Signs */}
                                {vitalLines.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">Vital Signs</h4>
                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 flex flex-wrap gap-3">
                                            {vitalLines.map((v, i) => (
                                                <span key={i} className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1">
                                                    {v}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Physical Examination */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">Physical Examination</h4>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                        {consultation.physicalExam ? (
                                            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{consultation.physicalExam}</p>
                                        ) : (
                                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">Not recorded</p>
                                        )}
                                    </div>
                                </div>

                                {/* Diagnosis */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">Clinical Assessment</h4>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                        {consultation.diagnosis ? (
                                            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                                                {consultation.diagnosis}
                                                {consultation.diagnosticCode && (
                                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({consultation.diagnosticCode})</span>
                                                )}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">Not recorded</p>
                                        )}
                                    </div>
                                </div>

                                {/* Treatment Plan */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">Treatment Plan</h4>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                        {consultation.plan ? (
                                            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{consultation.plan}</p>
                                        ) : (
                                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">Not recorded</p>
                                        )}
                                    </div>
                                </div>

                                {/* Follow-up Instructions */}
                                {consultation.followUpInstructions && (
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">Follow-up Instructions</h4>
                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{consultation.followUpInstructions}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Record Date */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase mb-1">Record Date</p>
                                    <p className="text-sm text-gray-900 dark:text-white">{formatDateTime(consultation.createdAt)}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
                        >
                            Close
                        </button>
                        {isCompleted && consultation && (
                            <button
                                onClick={() => handleDownloadPDF(appointment, consultation)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                            >
                                Download PDF
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
