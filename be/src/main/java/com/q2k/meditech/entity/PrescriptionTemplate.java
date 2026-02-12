package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "prescription_templates", indexes = {
        @Index(name = "idx_template_doctor", columnList = "doctor_id"),
        @Index(name = "idx_template_active", columnList = "is_active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionTemplate extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor; // Template thuộc về doctor nào

    @Column(name = "template_name", nullable = false)
    private String templateName; // Tên template (vd: "Điều trị cảm cúm thông thường")

    @Column(name = "description", columnDefinition = "TEXT")
    private String description; // Mô tả template

    @Column(name = "diagnosis_template", columnDefinition = "TEXT")
    private String diagnosisTemplate; // Chẩn đoán mẫu

    @Column(name = "notes_template", columnDefinition = "TEXT")
    private String notesTemplate; // Ghi chú mẫu

    @Column(name = "default_follow_up_days")
    private Integer defaultFollowUpDays; // Số ngày tái khám mặc định

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "usage_count")
    @Builder.Default
    private Integer usageCount = 0; // Số lần sử dụng template

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("itemOrder ASC")
    @Builder.Default
    private List<PrescriptionTemplateItem> items = new ArrayList<>();

    // Helper method để thêm item
    public void addItem(PrescriptionTemplateItem item) {
        items.add(item);
        item.setTemplate(this);
    }

    // Helper method để xóa item
    public void removeItem(PrescriptionTemplateItem item) {
        items.remove(item);
        item.setTemplate(null);
    }

    // Helper method để clear và set items
    public void setItems(List<PrescriptionTemplateItem> newItems) {
        this.items.clear();
        if (newItems != null) {
            newItems.forEach(this::addItem);
        }
    }

    // Tăng số lần sử dụng
    public void incrementUsageCount() {
        this.usageCount++;
    }
}