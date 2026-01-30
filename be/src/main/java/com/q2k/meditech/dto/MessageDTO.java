package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic message response DTO
 * Dùng cho các API response đơn giản chỉ trả message
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDTO {
    private String message;
    
    public static MessageDTO success(String message) {
        return MessageDTO.builder()
                .message(message)
                .build();
    }
}