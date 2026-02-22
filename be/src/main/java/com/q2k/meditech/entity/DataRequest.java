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
@Table(
        name = "data_requests",
        indexes = {
                @Index(name = "idx_data_requests_user", columnList = "user_id"),
                @Index(name = "idx_data_requests_type", columnList = "request_type"),
                @Index(name = "idx_data_requests_status", columnList = "status"),
                @Index(name = "idx_data_requests_created", columnList = "created_at")
        }
)
public class DataRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "request_type", nullable = false, length = 50)
    private String requestType; // DATA_EXPORT, DATA_DELETION, DATA_RECTIFICATION

    @Builder.Default
    @Column(name = "status", length = 20)
    private String status = "PENDING"; // PENDING, IN_PROGRESS, COMPLETED, REJECTED

    @Lob
    @Column(name = "request_reason")
    private String requestReason;

    @Lob
    @Column(name = "admin_notes")
    private String adminNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private User processedBy;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "data_file_path", length = 500)
    private String dataFilePath;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
