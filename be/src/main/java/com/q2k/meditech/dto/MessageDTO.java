package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDTO {
    
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    private String message;
    private Boolean success;
    private String timestamp;
    
    public static MessageDTO success(String message) {
        return MessageDTO.builder()
                .message(message)
                .success(true)
                .timestamp(LocalDateTime.now().format(FORMATTER))
                .build();
    }
    
    public static MessageDTO error(String message) {
        return MessageDTO.builder()
                .message(message)
                .success(false)
                .timestamp(LocalDateTime.now().format(FORMATTER))
                .build();
    }
}
