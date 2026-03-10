package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.AppointmentStatus;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for export filter parameters
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportFilterDTO {
    
    // Filter criteria
    private Long doctorId;
    private Long patientId;
    private AppointmentStatus status;
    private List<AppointmentStatus> statuses; // Multiple statuses
    private LocalDate from;
    private LocalDate to;
    private String appointmentType;
    
    // Search term
    private String search;
    
    // Export format: CSV, EXCEL, PDF
    @Builder.Default
    private String format = "CSV";
    
    // Columns to include (null = all columns)
    private List<String> columns;
    
    /**
     * Default columns for export
     */
    public static final List<String> DEFAULT_COLUMNS = List.of(
            "appointmentCode",
            "patientName",
            "patientPhone",
            "doctorName",
            "specialty",
            "appointmentDate",
            "startTime",
            "endTime",
            "status",
            "reasonForVisit",
            "createdAt"
    );
    
    /**
     * Get columns to export
     */
    public List<String> getColumnsToExport() {
        return columns != null && !columns.isEmpty() ? columns : DEFAULT_COLUMNS;
    }
}
