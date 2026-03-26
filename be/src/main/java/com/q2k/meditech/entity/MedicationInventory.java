package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "medication_inventory")
public class MedicationInventory extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medication_id", nullable = false, unique = true)
    private Medication medication;

    @Builder.Default
    @Column(nullable = false)
    private Integer quantity = 0;

    @Column(name = "last_note")
    private String lastNote;
}
