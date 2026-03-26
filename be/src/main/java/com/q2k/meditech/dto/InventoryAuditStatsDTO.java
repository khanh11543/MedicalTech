package com.q2k.meditech.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryAuditStatsDTO {
    private long totalLogs;
    private long logsToday;
    private long logsThisWeek;
    private long logsThisMonth;
    private Map<String, Long> countByAction;
    private List<String> availableActions;
    private List<String> availableReferenceTypes;
}
