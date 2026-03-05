package com.q2k.meditech.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ProcessExportRequestDTO {
    @Builder.Default
    private Boolean includeProfile = true;

    @Builder.Default
    private Boolean includeAppointments = true;

    @Builder.Default
    private Boolean includePrescriptions = true;

    @Builder.Default
    private Boolean includePayments = true;

    @Builder.Default
    private Boolean includeReviews = true;

    @Builder.Default
    private Boolean includeActivityLogs = true;

    @Builder.Default
    private String format = "JSON";

    @Builder.Default
    private Boolean sendEmail = true;
}
