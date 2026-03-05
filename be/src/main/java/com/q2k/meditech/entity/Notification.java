package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.NotificationCategory;
import com.q2k.meditech.entity.enums.NotificationPriority;
import com.q2k.meditech.entity.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notif_user_read", columnList = "user_id, is_read"),
        @Index(name = "idx_notif_user_type", columnList = "user_id, type"),
        @Index(name = "idx_notif_created", columnList = "created_at"),
        @Index(name = "idx_notif_archived", columnList = "archived_at")
})
public class Notification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    // High-level type: APPOINTMENT, PAYMENT, PATIENT, SYSTEM
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    // Detailed sub-category: NEW_BOOKING, PAYMENT_FAILED, etc.
    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private NotificationCategory category;

    // Priority: INFO, IMPORTANT, URGENT
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationPriority priority = NotificationPriority.INFO;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Builder.Default
    @Column(name = "is_read", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean isRead = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    // For URGENT notifications — must be explicitly acknowledged
    @Builder.Default
    @Column(name = "acknowledged", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean acknowledged = false;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    // Auto-archive after 30 days
    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sent_via", columnDefinition = "JSON")
    private Map<String, Object> sentVia;

    @Builder.Default
    @Column(name = "email_sent", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean emailSent = false;

    @Builder.Default
    @Column(name = "sms_sent", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean smsSent = false;

    @Builder.Default
    @Column(name = "push_sent", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean pushSent = false;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;
}
