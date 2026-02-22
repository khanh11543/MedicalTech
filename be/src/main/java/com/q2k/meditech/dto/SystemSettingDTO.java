package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingDTO {

    private Long id;
    private String settingKey;
    private String settingValue;
    private String settingGroup;
    private String displayName;
    private String description;
    private String valueType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
