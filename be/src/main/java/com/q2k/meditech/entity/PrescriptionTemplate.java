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
    private Doctor doctor; // Which doctor owns this template

    @Column(name = "template_name", nullable = false)
    private String templateName; // Template name (e.g., "Common flu treatment")

    @Column(name = "description", columnDefinition = "TEXT")
    private String description; // Template description

    @Column(name = "diagnosis_template", columnDefinition = "TEXT")
    private String diagnosisTemplate; // Diagnosis template

    @Column(name = "notes_template", columnDefinition = "TEXT")
    private String notesTemplate; // Notes template

    @Column(name = "default_follow_up_days")
    private Integer defaultFollowUpDays; // Default follow-up days

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "usage_count")
    @Builder.Default
    private Integer usageCount = 0; // Template usage count

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("itemOrder ASC")
    @Builder.Default
    private List<PrescriptionTemplateItem> items = new ArrayList<>();

    // Helper method to add item
    public void addItem(PrescriptionTemplateItem item) {
        items.add(item);
        item.setTemplate(this);
    }

    // Helper method to remove item
    public void removeItem(PrescriptionTemplateItem item) {
        items.remove(item);
        item.setTemplate(null);
    }

    // Helper method to clear and set items
    public void setItems(List<PrescriptionTemplateItem> newItems) {
        this.items.clear();
        if (newItems != null) {
            newItems.forEach(this::addItem);
        }
    }

    // Increment usage count
    public void incrementUsageCount() {
        this.usageCount++;
    }
}