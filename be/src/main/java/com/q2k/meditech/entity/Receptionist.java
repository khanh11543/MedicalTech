package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "receptionists")
public class Receptionist extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "employee_id", unique = true)
    private String employeeId;

    private String department;

    @Column(length = 20)
    private String shift; // MORNING/AFTERNOON/EVENING/NIGHT

    @Column(name = "is_active")
    private Boolean isActive = true;
}
