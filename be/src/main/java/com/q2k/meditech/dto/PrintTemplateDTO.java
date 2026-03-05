package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for print-friendly prescription template
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrintTemplateDTO {

    private String format; // HTML or PDF
    private String content; // HTML content for web printing or base64 PDF
    private String filename;
    private PrescriptionDetailDTO prescription;
}
