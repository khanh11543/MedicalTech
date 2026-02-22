package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "system_settings", uniqueConstraints = {
    @UniqueConstraint(columnNames = "setting_key")
})
public class SystemSetting extends BaseEntity {

    @Column(name = "setting_key", nullable = false, unique = true, length = 100)
    private String settingKey;

    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String settingValue;

    @Column(name = "setting_group", nullable = false, length = 50)
    private String settingGroup;

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(length = 255)
    private String description;

    @Column(name = "value_type", length = 20)
    @Builder.Default
    private String valueType = "STRING"; // STRING, NUMBER, BOOLEAN, JSON
}
