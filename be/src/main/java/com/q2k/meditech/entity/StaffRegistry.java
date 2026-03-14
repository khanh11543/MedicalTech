package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * StaffRegistry Entity - Whitelist for internal staff
 * Admin creates this entry to allow staff to register
 * Maps to 'staff_registry' table in database
 */
@Entity
@Table(name = "staff_registry", indexes = {
        @Index(name = "idx_staff_registry_email", columnList = "email"),
        @Index(name = "idx_staff_registry_phone", columnList = "phone"),
        @Index(name = "idx_staff_registry_status", columnList = "status"),
        @Index(name = "idx_staff_registry_role", columnList = "expected_role")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffRegistry extends BaseEntity {

    /**
     * Staff code - Unique staff code
     */
    @Column(name = "staff_code", nullable = false, unique = true, length = 50)
    private String staffCode;

    /**
     * Email of the invited staff member
     */
    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    /**
     * Phone of the staff member (optional)
     */
    @Column(name = "phone", length = 20)
    private String phone;

    /**
     * Full name of the staff member
     */
    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    /**
     * Expected role when the staff member registers (DOCTOR, RECEPTIONIST)
     * Does NOT include PATIENT (internal staff only)
     */
    @Column(name = "expected_role", nullable = false, length = 50)
    private String expectedRole;

    /**
     * Department
     */
    @Column(name = "department", length = 100)
    private String department;

    /**
     * Status of the registry entry
     * PENDING - Not yet registered
     * REGISTERED - Successfully registered
     * DISABLED - Deactivated
     * EXPIRED - Expired (if applicable)
     */
    @Builder.Default
    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING";

    /**
     * Invitation expiry date (optional)
     * If null = no time limit
     */
    @Column(name = "invite_expires_at")
    private LocalDateTime inviteExpiresAt;

    /**
     * User ID after successful registration
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registered_user_id", foreignKey = @ForeignKey(name = "fk_staff_registry_user"))
    private User registeredUser;

    /**
     * Successful registration date
     */
    @Column(name = "registered_at")
    private LocalDateTime registeredAt;

    /**
     * Admin who created the invitation
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by", foreignKey = @ForeignKey(name = "fk_staff_registry_invited_by"))
    private User invitedBy;

    /**
     * Ngày tạo lời mời
     */
    @Column(name = "invited_at", nullable = false)
    private LocalDateTime invitedAt;

    /**
     * Admin disable entry (nếu có)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disabled_by", foreignKey = @ForeignKey(name = "fk_staff_registry_disabled_by"))
    private User disabledBy;

    /**
     * Ngày disable
     */
    @Column(name = "disabled_at")
    private LocalDateTime disabledAt;

    /**
     * Lý do disable
     */
    @Column(name = "disable_reason", length = 500)
    private String disableReason;

    /**
     * Ghi chú thêm
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    /**
     * Invitation token (để verify khi đăng ký)
     * Optional - có thể dùng để secure registration process
     */
    @Column(name = "invitation_token", length = 255)
    private String invitationToken;

    // Helper methods
    public boolean isExpired() {
        return inviteExpiresAt != null && inviteExpiresAt.isBefore(LocalDateTime.now());
    }

    public boolean canRegister() {
        return "PENDING".equals(status) && !isExpired();
    }
}