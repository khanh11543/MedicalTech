package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "prescription_template_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionTemplateItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private PrescriptionTemplate template;

    @Column(name = "medicine_name", nullable = false)
    private String medicineName; // Tên thuốc

    @Column(name = "default_dosage", nullable = false)
    private String defaultDosage; // Liều lượng mặc định

    @Column(name = "default_frequency", nullable = false)
    private String defaultFrequency; // Tần suất mặc định

    @Column(name = "default_duration")
    private String defaultDuration; // Thời gian dùng mặc định

    @Column(name = "default_quantity")
    private Integer defaultQuantity; // Số lượng mặc định

    @Column(name = "unit")
    private String unit; // Đơn vị

    @Column(name = "default_instructions", columnDefinition = "TEXT")
    private String defaultInstructions; // Hướng dẫn mặc định

    @Column(name = "notes")
    private String notes;

    @Column(name = "item_order")
    private Integer itemOrder; // Thứ tự hiển thị
}