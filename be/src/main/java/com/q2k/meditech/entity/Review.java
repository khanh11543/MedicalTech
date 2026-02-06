package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "reviews")
public class Review extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // unique appointment_id
    @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name="appointment_id", nullable = false, unique = true)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="doctor_id", nullable = false)
    private Doctor doctor;

    @Column(nullable = false)
    private Integer rating; // 1..5

    @Lob
    private String comment;

    @Column(name="is_anonymous")
    private Boolean isAnonymous = false;

    @Column(name="is_visible")
    private Boolean isVisible = true;

    @Lob
    @Column(name="admin_response")
    private String adminResponse;

    @Column(name="responded_at")
    private LocalDateTime respondedAt;
    @OneToOne
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private Appointment appointment;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(nullable = false)
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "is_anonymous", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean isAnonymous;

    @Column(name = "is_visible", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean isVisible;

    @Column(name = "admin_response", columnDefinition = "TEXT")
    private String adminResponse;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isAnonymous == null) {
            isAnonymous = false;
        }
        if (isVisible == null) {
            isVisible = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
