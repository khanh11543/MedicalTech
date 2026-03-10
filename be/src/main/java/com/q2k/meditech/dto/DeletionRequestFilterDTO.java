package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.DeletionRequestStatus;
import lombok.*;

import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DeletionRequestFilterDTO {
    private DeletionRequestStatus status;
    private Long userId;
    private LocalDate from;
    private LocalDate to;

    @Builder.Default
    private Integer page = 0;
    @Builder.Default
    private Integer size = 10;
    @Builder.Default
    private String sortBy = "createdAt";
    @Builder.Default
    private String sortDirection = "desc";
}
