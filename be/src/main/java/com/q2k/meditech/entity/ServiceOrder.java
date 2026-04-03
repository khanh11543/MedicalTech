package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.ServiceCategory;
import com.q2k.meditech.entity.enums.ServiceOrderStatus;
import com.q2k.meditech.entity.enums.ServicePriority;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * ServiceOrder Entity — represents a medical service ordered by a doctor
 * during a consultation (e.g. X-ray, CBC, Ultrasound, ECG).
 * 
 * The category denotes which specialty/department should perform this service.
 */
@Entity
@Table(name = "service_orders", indexes = {
    @Index(name = "idx_so_consultation_id", columnList = "consultation_id"),
    @Index(name = "idx_so_appointment_id", columnList = "appointment_id"),
    @Index(name = "idx_so_specialty_id", columnList = "specialty_id"),
    @Index(name = "idx_so_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ServiceOrder extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "consultation_id", nullable = false)
    private Consultation consultation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ordered_by_doctor_id", nullable = false)
    private Doctor orderedByDoctor;

    @Column(name = "service_name", nullable = false, length = 200)
    private String serviceName;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private ServiceCategory category;

    /** The catalog medical service (if selected from catalog) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_service_id")
    private MedicalService medicalService;

    /** The specialty/department that will perform this service */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "specialty_id")
    private Specialty specialty;

    @Column(name = "price", precision = 12, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    @Builder.Default
    private ServicePriority priority = ServicePriority.ROUTINE;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ServiceOrderStatus status = ServiceOrderStatus.ORDERED;

    @Column(name = "ordered_at", nullable = false)
    private LocalDateTime orderedAt;

    // ── Payment fields ──

    @Column(name = "payment_method", length = 20)
    private String paymentMethod; // CASH, MOMO

    @Column(name = "payment_status", length = 20)
    @Builder.Default
    private String paymentStatus = "UNPAID"; // UNPAID, PAID

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paid_by_user_id")
    private User paidBy;

    /** Doctor who accepted/is performing this service (from the specialty department) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_doctor_id")
    private Doctor assignedDoctor;

    // ── Result fields ──

    /** Who performed the service (technician, lab staff, etc.) */
    @Column(name = "performed_by", length = 200)
    private String performedBy;

    /** Result summary when completed */
    @Column(name = "result", columnDefinition = "TEXT")
    private String result;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    /** Link to detailed service result */
    @OneToOne(mappedBy = "serviceOrder", fetch = FetchType.LAZY)
    private ServiceResult serviceResult;

    @PrePersist
    @Override
    protected void onCreate() {
        super.onCreate();
        if (this.orderedAt == null) {
            this.orderedAt = LocalDateTime.now();
        }
    }
}
