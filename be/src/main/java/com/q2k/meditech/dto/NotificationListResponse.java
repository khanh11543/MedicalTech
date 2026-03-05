package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationListResponse {

    private List<NotificationDTO> notifications;
    private Integer totalPages;
    private Long totalElements;
    private Integer currentPage;
    private Integer pageSize;
    private Long unreadCount;

    /** Unread count per type: { "APPOINTMENT": 3, "PAYMENT": 1, ... } */
    private Map<String, Long> unreadCountByType;
}
