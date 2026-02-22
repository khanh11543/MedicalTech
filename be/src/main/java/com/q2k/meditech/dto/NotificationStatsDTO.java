package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationStatsDTO {
    
    private Long totalNotifications;
    private Long totalUnread;
    private Long totalRead;
    private Long sentToday;
    private Long sentThisWeek;
    private Long sentThisMonth;
    private Long scheduledCount;
}
