package com.q2k.meditech.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SendExportEmailDTO {
    private String email;
    private String customMessage;
}
