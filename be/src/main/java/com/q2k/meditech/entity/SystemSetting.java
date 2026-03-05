package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "system_settings", indexes = {
        @Index(name = "idx_system_settings_group", columnList = "setting_group"),
        @Index(name = "idx_system_settings_key", columnList = "setting_key", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSetting extends BaseEntity {

    @Column(name = "setting_key", nullable = false, unique = true, length = 100)
    private String settingKey;

    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String settingValue;

    @Column(name = "setting_group", nullable = false, length = 50)
    private String settingGroup;

    @Column(name = "description", length = 500)
    private String description;
}
