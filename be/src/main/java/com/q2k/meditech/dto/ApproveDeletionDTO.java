package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ApproveDeletionDTO {
    private LocalDateTime scheduleDate;

    @Builder.Default
    private Boolean executeImmediately = false;

    private String adminNotes;

    @Builder.Default
    private Boolean sendNotification = true;
}
