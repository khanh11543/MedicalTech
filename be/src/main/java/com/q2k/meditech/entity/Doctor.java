package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.DoctorQueueStatus;
import com.q2k.meditech.entity.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "doctors",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_doctors_user_id", columnNames = "user_id"),
                @UniqueConstraint(name = "uk_doctors_license_number", columnNames = "license_number"),
                @UniqueConstraint(name = "uk_doctors_staff_registry_id", columnNames = "staff_registry_id")
        },
        indexes = {
                @Index(name = "idx_doctors_user_id", columnList = "user_id"),
                @Index(name = "idx_doctors_verification_status", columnList = "verification_status"),
                @Index(name = "idx_doctors_available", columnList = "is_available")
        }
)
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * user_id: tài khoản đăng nhập
     */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_doctors_user"))
    private User user;

    /**
     * staff_registry_id: whitelist nội bộ
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_registry_id", foreignKey = @ForeignKey(name = "fk_doctors_staff_registry"))
    private StaffRegistry staffRegistry;

    @Column(name="full_name", nullable = false, length = 255)
    private String fullName;

    @Column(name="license_number", length = 50)
    private String licenseNumber;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(columnDefinition = "TEXT")
    private String education;

    @Column(name="specialization", length = 255)
    private String specialization;

    @Builder.Default
    @Column(name="experience_years")
    private Integer experienceYears = 0;

    @Builder.Default
    @Column(name="consultation_fee", precision = 12, scale = 2)
    private BigDecimal consultationFee = BigDecimal.ZERO;

    @Builder.Default
    @Column(name="follow_up_fee", precision = 12, scale = 2)
    private BigDecimal followUpFee = BigDecimal.ZERO;

    @Builder.Default
    @Column(name="rating_avg", precision = 3, scale = 2)
    private BigDecimal ratingAvg = BigDecimal.ZERO;

    @Builder.Default
    @Column(name="rating_count")
    private Integer ratingCount = 0;

    @Builder.Default
    @Column(name="is_available", nullable = false)
    private Boolean isAvailable = true;

    // ===== Queue Management =====
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "queue_status", length = 20)
    private DoctorQueueStatus queueStatus = DoctorQueueStatus.OFFLINE;

    @Column(name = "current_room", length = 20)
    private String currentRoom;

    @Column(name="hospital_affiliation", length = 255)
    private String hospitalAffiliation;

    @Column(name="office_address", columnDefinition = "TEXT")
    private String officeAddress;

    // ===== Verification (Model B) =====
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name="verification_status", nullable = false, length = 20)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Column(name="verified_at")
    private LocalDateTime verifiedAt;

    /**
     * admin user duyệt
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by", foreignKey = @ForeignKey(name = "fk_doctors_verified_by"))
    private User verifiedBy;

    @Column(name="rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    // ===== timestamps (nếu bạn đã có BaseEntity thì có thể bỏ 2 field dưới) =====
    @Builder.Default
    @Column(name="created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(name="updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ===== Relations =====
    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DoctorDocument> documents = new ArrayList<>();

    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DoctorSpecialty> doctorSpecialties = new ArrayList<>();

    /**
     * Helper method to get list of Specialty objects
     */
    public List<Specialty> getSpecialties() {
        if (doctorSpecialties == null) {
            return new ArrayList<>();
        }
        return doctorSpecialties.stream()
                .map(DoctorSpecialty::getSpecialty)
                .collect(java.util.stream.Collectors.toList());
    }
}
