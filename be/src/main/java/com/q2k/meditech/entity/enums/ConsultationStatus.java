package com.q2k.meditech.entity.enums;

/**
 * Consultation Status Enum
 */
public enum ConsultationStatus {
    DRAFT,              // Draft - can be edited
    AWAITING_RESULTS,   // Waiting for ordered service results
    READY_TO_FINALIZE,  // All service results received, ready for doctor to finalize
    FINALIZED,          // Finalized and signed - locked
    AMENDED             // Has amendments
}
