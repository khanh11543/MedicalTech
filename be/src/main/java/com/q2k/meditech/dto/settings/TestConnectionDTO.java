package com.q2k.meditech.dto.settings;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestConnectionDTO {
    private boolean success;
    private String message;
    private long responseTimeMs;
}
