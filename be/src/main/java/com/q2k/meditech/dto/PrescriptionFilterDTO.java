package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionFilterDTO {

    private String search; // Search by code, patient name, doctor name
    private Long patientId;
    private Long doctorId;
    private String status; // ACTIVE, EXPIRED
    private LocalDate from;
    private LocalDate to;

    @Builder.Default
    private Integer pageNumber = 0;

    @Builder.Default
    private Integer pageSize = 10;

    @Builder.Default
    private String sortBy = "prescribedDate";

    @Builder.Default
    private String sortDir = "DESC";
}