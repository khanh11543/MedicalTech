package com.q2k.meditech.dto.receptionist;

import lombok.*;

/**
 * Summary of a document associated with an appointment.
 * Clinical documents show "exists" but are not accessible by receptionist.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentSummaryDTO {

    /** Document type: SLIP, INVOICE, RECEIPT, PRESCRIPTION, MEDICAL_RECORD */
    private String type;

    /** Whether this document exists */
    private boolean exists;

    /** Whether the receptionist can access/download this document */
    private boolean accessible;

    /** Download URL — only populated if accessible is true */
    private String downloadUrl;

    /** Display label for the document */
    private String label;
}
