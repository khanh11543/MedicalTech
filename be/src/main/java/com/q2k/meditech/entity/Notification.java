package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

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
}
