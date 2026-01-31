package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * StaffRegistry Entity - Whitelist cho nhân viên nội bộ
 * Admin tạo entry này để cho phép nhân viên đăng ký
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

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Staff code - Mã nhân viên duy nhất
     */
    @Column(name = "staff_code", nullable = false, unique = true, length = 50)
    private String staffCode;

    /**
     * Email của nhân viên được mời
     */
    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    /**
     * Phone của nhân viên (optional)
     */
    @Column(name = "phone", length = 20)
    private String phone;

    /**
     * Tên đầy đủ của nhân viên
     */
    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    /**
     * Role mong đợi khi nhân viên đăng ký (DOCTOR, RECEPTIONIST)
     * KHÔNG bao gồm PATIENT (chỉ staff nội bộ)
     */
    @Column(name = "expected_role", nullable = false, length = 50)
    private String expectedRole;

    /**
     * Department (phòng ban)
     */
    @Column(name = "department", length = 100)
    private String department;

    /**
     * Status của registry entry
     * PENDING - Chưa đăng ký
     * REGISTERED - Đã đăng ký thành công
     * DISABLED - Đã vô hiệu hóa
     * EXPIRED - Hết hạn (nếu có expiry)
     */
    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING";

    /**
     * Ngày hết hạn lời mời (optional)
     * Nếu null = không giới hạn
     */
    @Column(name = "invite_expires_at")
    private LocalDateTime inviteExpiresAt;

    /**
     * User ID sau khi đăng ký thành công
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registered_user_id", foreignKey = @ForeignKey(name = "fk_staff_registry_user"))
    private User registeredUser;

    /**
     * Ngày đăng ký thành công
     */
    @Column(name = "registered_at")
    private LocalDateTime registeredAt;

    /**
     * Admin tạo lời mời
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