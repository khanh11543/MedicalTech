package com.q2k.meditech.dto.settings;

import jakarta.validation.Valid;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateQuickActionsDTO {

    @Valid
    private List<UserQuickActionDTO> actions;
}
