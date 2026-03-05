package com.q2k.meditech.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CancelDeletionDTO {
    private String cancelReason;

    @Builder.Default
    private Boolean sendNotification = true;
}
