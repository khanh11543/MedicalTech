package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ExportRequestFilterDTO {
    private String status;
    private Long userId;
    private LocalDate from;
    private LocalDate to;

    @Builder.Default
    private Integer pageNumber = 0;

    @Builder.Default
    private Integer pageSize = 10;

    @Builder.Default
    private String sortBy = "requestedDate";

    @Builder.Default
    private String sortDir = "DESC";
}
