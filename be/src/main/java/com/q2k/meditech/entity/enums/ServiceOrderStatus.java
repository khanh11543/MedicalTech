package com.q2k.meditech.entity.enums;

public enum ServiceOrderStatus {
    ORDERED,           // Doctor has ordered the service
    PENDING_PAYMENT,   // Waiting for patient to pay
    PAID,              // Payment received
    IN_PROGRESS,       // Service is being performed
    COMPLETED,         // Service completed with results
    CANCELLED          // Service cancelled
}
