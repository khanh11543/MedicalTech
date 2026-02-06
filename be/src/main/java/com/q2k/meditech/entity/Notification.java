package com.q2k.meditech.entity;

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
@Table(name = "notifications")
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

    @Column(nullable = false, length = 30)
    private String type;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Builder.Default
    @Column(name = "is_read", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean isRead = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

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
