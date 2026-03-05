package com.q2k.meditech.dto.settings;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserQuickActionDTO {

    private Long id;
    private String actionKey;
    private String label;
    private String icon;
    private Integer sortOrder;
    private Boolean enabled;
}
