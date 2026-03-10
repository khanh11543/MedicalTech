package com.q2k.meditech.dto.settings;

import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDisplaySettingsDTO {

    @Pattern(regexp = "^(VI|EN)$", message = "Language must be VI or EN")
    private String language;

    @Pattern(regexp = "^(DD/MM/YYYY|MM/DD/YYYY|YYYY-MM-DD)$", message = "Invalid date format")
    private String dateFormat;

    @Pattern(regexp = "^(12h|24h)$", message = "Time format must be 12h or 24h")
    private String timeFormat;

    @Pattern(regexp = "^(light|dark)$", message = "Theme must be light or dark")
    private String theme;

    @Pattern(regexp = "^(VND|USD|EUR)$", message = "Currency must be VND, USD, or EUR")
    private String currencyDisplay;
}
