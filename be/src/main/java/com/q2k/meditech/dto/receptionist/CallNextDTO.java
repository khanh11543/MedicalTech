package com.q2k.meditech.dto.receptionist;

import lombok.*;

/**
 * Request body for calling the next patient in a doctor's queue.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallNextDTO {

    /**
     * Optional: specific queue number to call (skip queue).
     * If null, the next sequential number is called.
     */
    private Integer queueNumber;

    /**
     * Optional note for the call (e.g. "Room 3")
     */
    private String note;

    /**
     * Notification method: DISPLAY, SPEAKER, SMS, or combination.
     * Default: DISPLAY.
     */
    private String notifyMethod;

    /**
     * Room number to display on call notification.
     */
    private String roomNumber;
}
