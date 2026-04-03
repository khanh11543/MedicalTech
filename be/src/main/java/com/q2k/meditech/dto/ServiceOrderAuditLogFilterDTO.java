package com.q2k.meditech.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceOrderAuditLogFilterDTO {
    private List<String> eventTypes;
    private List<String> roles;
    private String search;          // keyword search in summary / actorName / patientName
    private String from;            // ISO date-time
    private String to;
    private Long appointmentId;
    private Long serviceOrderId;
    private Integer pageNumber;
    private Integer pageSize;
    private String sortBy;          // createdAt (default)
    private String sortDir;         // DESC (default)
}
