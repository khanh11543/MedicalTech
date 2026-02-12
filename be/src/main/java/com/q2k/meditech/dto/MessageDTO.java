package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDTO {
    
    private String message;
    private Boolean success;
    private LocalDateTime timestamp;
    
    public static MessageDTO success(String message) {
        return MessageDTO.builder()
                .message(message)
                .success(true)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    public static MessageDTO error(String message) {
        return MessageDTO.builder()
                .message(message)
                .success(false)
                .timestamp(LocalDateTime.now())
                .build();
    }
}