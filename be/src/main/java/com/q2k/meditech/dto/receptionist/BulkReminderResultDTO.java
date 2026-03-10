package com.q2k.meditech.dto.receptionist;

import lombok.*;

/**
 * Extended bulk action result that includes quota information.
 * Used for receptionist bulk reminders which have daily quota limits.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkReminderResultDTO {

    private Integer totalProcessed;
    private Integer successCount;
    private Integer failCount;
    private String message;

    /** Remaining reminder quota for today */
    private Integer quotaRemaining;

    /** Daily quota limit */
    private Integer quotaLimit;

    private java.util.List<com.q2k.meditech.dto.BulkActionResultDTO.ItemResult> results;
}
