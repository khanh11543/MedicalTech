package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_display_settings", indexes = {
        @Index(name = "idx_user_display_settings_user", columnList = "user_id", unique = true)
})
public class UserDisplaySetting extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Builder.Default
    @Column(name = "language", length = 10)
    private String language = "VI";

    @Builder.Default
    @Column(name = "date_format", length = 20)
    private String dateFormat = "DD/MM/YYYY";

    @Builder.Default
    @Column(name = "time_format", length = 10)
    private String timeFormat = "24h";

    @Builder.Default
    @Column(name = "theme", length = 10)
    private String theme = "light";

    @Builder.Default
    @Column(name = "currency_display", length = 10)
    private String currencyDisplay = "VND";
}
