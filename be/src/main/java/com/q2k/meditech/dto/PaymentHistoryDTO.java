package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Payment History/Timeline
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentHistoryDTO {

    private Long paymentId;
    private String paymentCode;
    private List<HistoryEvent> events;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HistoryEvent {
        
        private Long id;
        
        private String eventType; // CREATED, STATUS_CHANGED, REFUND_REQUESTED, REFUND_PROCESSED, RECEIPT_SENT, NOTE_ADDED, etc.
        
        private String description;
        
        private String previousValue;
        
        private String newValue;
        
        private String performedByName;
        
        private Long performedById;
        
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime eventTime;
        
        private Object metadata; // Additional event data

        // JSON aliases for frontend compatibility
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        public LocalDateTime getTimestamp() { return eventTime; }
        public String getEvent() { return eventType; }
        public String getUser() { return performedByName; }
    }
}
