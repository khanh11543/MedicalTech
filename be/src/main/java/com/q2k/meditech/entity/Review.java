package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

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
}
