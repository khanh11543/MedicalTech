package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
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


public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Lob
    @Column(nullable = false)
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 30)
    private String type;

    @Column(name="reference_type", length = 50)
    private String referenceType; // appointment/payment...

    @Column(name="reference_id")
    private Long referenceId;

    @Column(name="is_read")
    private Boolean isRead = false;

    @Column(name="read_at")
    private LocalDateTime readAt;

    // JSON: ["IN_APP","EMAIL","SMS"]
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name="sent_via", columnDefinition = "json")
    private Object sentVia;

    @Column(name="email_sent")
    private Boolean emailSent = false;

    @Column(name="sms_sent")
    private Boolean smsSent = false;

    @Column(name="push_sent")
    private Boolean pushSent = false;

    @Column(name="scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name="sent_at")
    private LocalDateTime sentAt;
    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "is_read", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean isRead;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sent_via", columnDefinition = "JSON")
    private Map<String, Object> sentVia;

    @Column(name = "email_sent", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean emailSent;

    @Column(name = "sms_sent", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean smsSent;

    @Column(name = "push_sent", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean pushSent;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isRead == null) {
            isRead = false;
        }
        if (emailSent == null) {
            emailSent = false;
        }
        if (smsSent == null) {
            smsSent = false;
        }
        if (pushSent == null) {
            pushSent = false;
        }
    }
}
