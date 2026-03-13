package com.q2k.meditech.entity.enums;

public enum VerificationStatus {
    AWAITING_DOCUMENTS,  // Newly created, awaiting document submission
    PENDING,             // Documents submitted, awaiting admin review
    VERIFIED,            // Admin verified
    EXPIRED,
    APPROVED,            // Approved (= VERIFIED, kept for backward compat)
    REJECTED,            // Rejected
    SUSPENDED,           // Suspended
    REVOKED              // Permanently revoked
}
