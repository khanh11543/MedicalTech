package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.ConsentStatus;
import com.q2k.meditech.entity.enums.ConsentType;
import lombok.*;

import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ConsentFilterDTO {
    private Long userId;
    private ConsentType consentType;
    private ConsentStatus status;
    private LocalDate from;
    private LocalDate to;

    @Builder.Default
    private Integer page = 0;
    @Builder.Default
    private Integer size = 10;
    @Builder.Default
    private String sortBy = "consentDate";
    @Builder.Default
    private String sortDirection = "desc";
}
