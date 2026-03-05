package com.q2k.meditech.controller;

import com.q2k.meditech.dto.security.*;
import com.q2k.meditech.entity.enums.ActivityType;
import com.q2k.meditech.service.ActivityLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/admin/security/activity-logs")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Activity Logs", description = "APIs for viewing user activity logs (10.4)")
public class AdminActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping
    @Operation(summary = "List activity logs", description = "Get paginated list of activity logs with filters")
    public ResponseEntity<Page<ActivityLogDTO>> getActivityLogs(
            @Parameter(description = "Search query") @RequestParam(required = false) String search,
            @Parameter(description = "Activity types filter") @RequestParam(required = false) List<ActivityType> activityTypes,
            @Parameter(description = "Filter by user ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "Filter by role name") @RequestParam(required = false) String roleName,
            @Parameter(description = "Filter by IP address") @RequestParam(required = false) String ipAddress,
            @Parameter(description = "Filter by resource type") @RequestParam(required = false) String resourceType,
            @Parameter(description = "Filter by resource ID") @RequestParam(required = false) Long resourceId,
            @Parameter(description = "From datetime") @RequestParam(required = false) LocalDateTime from,
            @Parameter(description = "To datetime") @RequestParam(required = false) LocalDateTime to,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "DESC") String sortDir,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") Integer pageNumber,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") Integer pageSize) {

        log.info("GET /admin/security/activity-logs - search: {}, userId: {}", search, userId);
        ActivityLogFilterDTO filter = ActivityLogFilterDTO.builder()
                .search(search)
                .activityTypes(activityTypes)
                .userId(userId)
                .roleName(roleName)
                .ipAddress(ipAddress)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .from(from)
                .to(to)
                .sortBy(sortBy)
                .sortDir(sortDir)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .build();

        return ResponseEntity.ok(activityLogService.getActivityLogs(filter));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get activity log detail", description = "Get a single activity log by ID")
    public ResponseEntity<ActivityLogDTO> getActivityLogById(
            @Parameter(description = "Activity log ID") @PathVariable Long id) {
        log.info("GET /admin/security/activity-logs/{}", id);
        return ResponseEntity.ok(activityLogService.getActivityLogById(id));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get activity log statistics", description = "Get statistics for activity logs in a period")
    public ResponseEntity<ActivityLogStatsDTO> getStats(
            @Parameter(description = "Period: 24h, 7d, 30d, 90d") @RequestParam(defaultValue = "24h") String period) {
        log.info("GET /admin/security/activity-logs/stats - period: {}", period);
        return ResponseEntity.ok(activityLogService.getActivityLogStats(period));
    }
}
