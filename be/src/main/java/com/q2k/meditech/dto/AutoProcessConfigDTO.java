package com.q2k.meditech.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AutoProcessConfigDTO {
    private Boolean enabled;

    @Builder.Default
    private Integer processWithinHours = 24;
}
