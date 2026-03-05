package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.InvestigationStatus;
import com.q2k.meditech.entity.enums.InvestigationType;
import com.q2k.meditech.entity.enums.SecuritySeverity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "investigations",
        indexes = {
                @Index(name = "idx_investigations_status", columnList = "status"),
                @Index(name = "idx_investigations_type", columnList = "type"),
                @Index(name = "idx_investigations_assigned", columnList = "assigned_to"),
                @Index(name = "idx_investigations_created", columnList = "created_at"),
                @Index(name = "idx_investigations_due", columnList = "due_date")
        }
)
public class Investigation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Lob
    @Column(name = "description")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 10)
    private SecuritySeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private InvestigationType type;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private InvestigationStatus status = InvestigationStatus.OPEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Lob
    @Column(name = "resolution_summary")
    private String resolutionSummary;

    @Lob
    @Column(name = "preventive_measures")
    private String preventiveMeasures;

    // Related users (many-to-many)
    @Builder.Default
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "investigation_related_users",
            joinColumns = @JoinColumn(name = "investigation_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> relatedUsers = new HashSet<>();

    // Related IPs stored as comma-separated or element collection
    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "investigation_related_ips",
            joinColumns = @JoinColumn(name = "investigation_id"))
    @Column(name = "ip_address", length = 45)
    private List<String> relatedIps = new ArrayList<>();

    // Related security event IDs
    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "investigation_related_events",
            joinColumns = @JoinColumn(name = "investigation_id"))
    @Column(name = "security_event_id")
    private List<Long> relatedEventIds = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "investigation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InvestigationNote> notes = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "investigation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InvestigationEvidence> evidence = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        if (status == null) status = InvestigationStatus.OPEN;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
