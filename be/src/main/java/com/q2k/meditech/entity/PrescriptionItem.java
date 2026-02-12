package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "prescription_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @Column(name = "medicine_name", nullable = false)
    private String medicineName; // Tên thuốc

    @Column(name = "dosage", nullable = false)
    private String dosage; // Liều lượng (vd: "500mg")

    @Column(name = "frequency", nullable = false)
    private String frequency; // Tần suất (vd: "2 lần/ngày")

    @Column(name = "duration")
    private String duration; // Thời gian dùng (vd: "7 ngày")

    @Column(name = "quantity")
    private Integer quantity; // Số lượng

    @Column(name = "unit")
    private String unit; // Đơn vị (viên, gói, chai...)

    @Column(name = "instructions", columnDefinition = "TEXT")
    private String instructions; // Hướng dẫn sử dụng (vd: "Uống sau ăn")

    @Column(name = "notes")
    private String notes; // Ghi chú thêm

    @Column(name = "item_order")
    private Integer itemOrder; // Thứ tự hiển thị
}