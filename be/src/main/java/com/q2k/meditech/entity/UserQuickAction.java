package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_quick_actions", indexes = {
        @Index(name = "idx_user_quick_actions_user", columnList = "user_id")
})
public class UserQuickAction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "action_key", nullable = false, length = 50)
    private String actionKey;

    @Column(name = "label", nullable = false, length = 100)
    private String label;

    @Column(name = "icon", length = 50)
    private String icon;

    @Builder.Default
    @Column(name = "sort_order", columnDefinition = "INT DEFAULT 0")
    private Integer sortOrder = 0;

    @Builder.Default
    @Column(name = "enabled", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean enabled = true;
}
