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
@Table(name = "specialties")
public class Specialty extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "icon_url", length = 500)
    private String iconUrl;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(unique = true, length = 100)
    private String slug;

    @Column(length = 200)
    private String subtitle;

    @Column(columnDefinition = "TEXT")
    private String highlights;

    @Column(name = "is_active", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean isActive;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
