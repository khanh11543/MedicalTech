import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ConsultationForm from "../../components/forms/ConsultationForm";
import appointmentService, { AppointmentDTO, AppointmentStatus } from "../../services/appointmentService";
import consultationService, { ConsultationRecord } from "../../services/consultationService";
import { useToast } from "../../hooks/useToast";

type ViewMode = "selector" | "drafts" | "form";

interface SelectedItem {
    appointmentId?: number;
    draftId?: string;
}

export default function DoctorConsultation() {
    const { showToast } = useToast();
    const [viewMode, setViewMode] = useState<ViewMode>("selector");
    const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
    const [draftConsultations, setDraftConsultations] = useState<ConsultationRecord[]>([]);
    const [loadingDrafts, setLoadingDrafts] = useState(false);

    // Load drafts on mount
    useEffect(() => {
        loadDraftConsultations();
    }, []);

    const loadDraftConsultations = async () => {
        setLoadingDrafts(true);
        try {
            const drafts = await consultationService.getDraftConsultations();
            setDraftConsultations(drafts);
        } catch (error) {
            console.error("Error loading draft consultations:", error);
            showToast("Error loading draft consultations", "error");
        } finally {
            setLoadingDrafts(false);
        }
    };

    const handleSelectAppointment = (appointmentId: number) => {
        setSelectedItem({ appointmentId });
        setViewMode("form");
    };

    const handleSelectDraft = (draftId: string) => {
        setSelectedItem({ draftId });
        setViewMode("form");
    };

    const handleDraftSaved = () => {
        // Reload drafts after saving
        loadDraftConsultations();
    };

    const handleBack = () => {
        setSelectedItem(null);
        setViewMode("selector");
        loadDraftConsultations(); // Reload drafts in case one was finalized
    };

    const handleViewDrafts = () => {
        setViewMode("drafts");
    };

    return (
        <>
            <PageMeta title="Consultation | Doctor Panel" description="Doctor Consultation Workspace" />
            <PageBreadcrumb pageTitle="Doctor Consultation" />

            <div className="rounded-lg bg-white shadow-md dark:bg-gray-800">
                {viewMode === "form" && selectedItem ? (
                    <ConsultationForm 
                        appointmentId={selectedItem.appointmentId}
                        draftId={selectedItem.draftId}
                        onBack={handleBack}
                        onDraftSaved={handleDraftSaved}
                    />
                ) : viewMode === "drafts" ? (
                    <DraftConsultationsList 
                        drafts={draftConsultations}
                        loading={loadingDrafts}
                        onSelectDraft={handleSelectDraft}
                        onBack={() => setViewMode("selector")}
                        onDraftFinalized={loadDraftConsultations}
                    />
                ) : (
                    <AppointmentSelector 
                        onSelect={handleSelectAppointment}
                        onViewDrafts={handleViewDrafts}
                        draftCount={draftConsultations.length}
                    />
                )}
            </div>
        </>
    );
}

// Appointment selector component
function AppointmentSelector({ 
    onSelect,
    onViewDrafts,
    draftCount
}: { 
    onSelect: (appointmentId: number) => void;
    onViewDrafts: () => void;
    draftCount: number;
}) {
    const { showToast } = useToast();
    const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCheckedInAppointments = async () => {
            setLoading(true);
            try {
                const response = await appointmentService.getDoctorAppointments({
                    status: AppointmentStatus.CHECKED_IN,
                    pageNumber: 0,
                    pageSize: 50,
                });
                setAppointments(response.content);
                
                if (response.content.length === 0) {
                    showToast("No checked-in appointments found", "info");
                }
            } catch (error) {
                console.error("Error loading appointments:", error);
                showToast("Error loading appointments", "error");
                setAppointments([]);
            } finally {
                setLoading(false);
            }
        };

        loadCheckedInAppointments();
    }, [showToast]);

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="inline-block animate-spin">
                    <svg className="h-8 w-8 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Start New Consultation
                </h2>
                {draftCount > 0 && (
                    <button
                        onClick={onViewDrafts}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50"
                    >
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-600 text-xs font-bold text-white dark:bg-amber-500">
                            {draftCount}
                        </span>
                        View Drafts
                    </button>
                )}
            </div>

            {appointments.length === 0 ? (
                <div className="p-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400">No checked-in appointments available for consultation</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.map((apt) => (
                        <div
                            key={apt.id}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-brand-500 hover:bg-white dark:border-gray-700 dark:bg-gray-700/50 dark:hover:bg-gray-700"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-base font-medium text-gray-900 dark:text-white">
                                        {apt.patientName}
                                    </h3>
                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                        {apt.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {apt.appointmentDate} {apt.startTime} - {apt.endTime} • {apt.reasonForVisit}
                                </p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                                    {apt.patientPhone} • {apt.patientEmail}
                                </p>
                            </div>
                            <button
                                onClick={() => onSelect(apt.id)}
                                className="ml-4 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700"
                            >
                                Start Consultation
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Draft consultations list component
function DraftConsultationsList({
    drafts,
    loading,
    onSelectDraft,
    onBack,
    onDraftFinalized,
}: {
    drafts: ConsultationRecord[];
    loading: boolean;
    onSelectDraft: (draftId: string) => void;
    onBack: () => void;
    onDraftFinalized: () => void;
}) {
    const { showToast } = useToast();
    const [finalizing, setFinalizing] = useState<string | null>(null);

    const handleFinalizeDraft = async (draft: ConsultationRecord) => {
        if (!draft.id) return;
        
        setFinalizing(draft.id);
        try {
            await consultationService.finalize(draft);
            showToast("Consultation finalized successfully", "success");
            onDraftFinalized();
        } catch (error) {
            console.error("Error finalizing consultation:", error);
            showToast("Error finalizing consultation", "error");
        } finally {
            setFinalizing(null);
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="inline-block animate-spin">
                    <svg className="h-8 w-8 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Draft Consultations ({drafts.length})
                </h2>
            </div>

            {drafts.length === 0 ? (
                <div className="p-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400">No draft consultations found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {drafts.map((draft) => (
                        <div
                            key={draft.id}
                            className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/50"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-base font-medium text-gray-900 dark:text-white">
                                            Draft #{draft.id?.substring(0, 8)}...
                                        </h3>
                                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                                            {draft.status}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            <span className="font-medium">Chief Complaint:</span> {draft.chiefComplaint || "Not filled"}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            <span className="font-medium">Last Saved:</span> {new Date(draft.lastSavedAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => onSelectDraft(draft.id!)}
                                        className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleFinalizeDraft(draft)}
                                        disabled={finalizing === draft.id}
                                        className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-600 dark:hover:bg-green-700"
                                    >
                                        {finalizing === draft.id ? "Finalizing..." : "Finalize"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

