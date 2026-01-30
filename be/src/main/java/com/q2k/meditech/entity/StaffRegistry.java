package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.StaffRegistryStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "staff_registry",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_staff_registry_email", columnNames = "email"),
                @UniqueConstraint(name = "uk_staff_registry_staff_code", columnNames = "staff_code")
        },
        indexes = {
                @Index(name = "idx_staff_registry_email", columnList = "email"),
                @Index(name = "idx_staff_registry_status", columnList = "status")
        }
)
public class StaffRegistry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="staff_code", nullable = false, length = 50)
    private String staffCode;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(name="full_name", nullable = false, length = 255)
    private String fullName;

    @Column(length = 100)
    private String department;

    /**
     * Nếu bạn muốn gán sẵn specialty cho staff nội bộ (optional).
     * Nếu không dùng, bạn có thể xóa field + mapping này.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "specialty_id", foreignKey = @ForeignKey(name = "fk_staff_registry_specialty"))
    private Specialty specialty;

    @Column(name="license_number", length = 50)
    private String licenseNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StaffRegistryStatus status = StaffRegistryStatus.INVITED;

    @Column(name="invited_at", nullable = false)
    private LocalDateTime invitedAt = LocalDateTime.now();

    /**
     * invited_by: admin user
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by", foreignKey = @ForeignKey(name = "fk_staff_registry_invited_by"))
    private User invitedBy;

    @Column(name="claimed_at")
    private LocalDateTime claimedAt;

    /**
     * claimed_user_id: user doctor sau khi doctor đăng ký thành công
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claimed_user_id", foreignKey = @ForeignKey(name = "fk_staff_registry_claimed_user"))
    private User claimedUser;

    @Column(columnDefinition = "TEXT")
    private String notes;

    /**
     * 1 staff_registry -> 1 doctor (sau khi claim)
     * mappedBy: field staffRegistry trong Doctor
     */
    @OneToOne(mappedBy = "staffRegistry", fetch = FetchType.LAZY)
    private Doctor doctor;
}
