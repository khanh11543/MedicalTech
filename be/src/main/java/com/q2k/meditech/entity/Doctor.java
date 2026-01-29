package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "doctors")
public class Doctor extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "license_number", unique = true)
    private String licenseNumber;

    @Lob
    private String bio;

    @Lob
    private String education;

    @Column(name = "experience_years")
    private Integer experienceYears = 0;

    @Column(name = "consultation_fee")
    private BigDecimal consultationFee = BigDecimal.ZERO;

    @Column(name = "follow_up_fee")
    private BigDecimal followUpFee = BigDecimal.ZERO;

    @Column(name = "rating_avg")
    private BigDecimal ratingAvg = BigDecimal.ZERO;

    @Column(name = "rating_count")
    private Integer ratingCount = 0;

    @Column(name = "is_available")
    private Boolean isAvailable = true;

    @Column(name = "hospital_affiliation")
    private String hospitalAffiliation;

    @Lob
    @Column(name = "office_address")
    private String officeAddress;
}
