package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingUpdateDTO {

    private String settingKey;
    private String settingValue;
    private String settingGroup;
    private String displayName;
    private String description;
    private String valueType;
}
