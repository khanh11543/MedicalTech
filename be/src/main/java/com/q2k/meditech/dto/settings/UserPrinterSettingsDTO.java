package com.q2k.meditech.dto.settings;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPrinterSettingsDTO {

    private String defaultPrinter;
    private Boolean autoPrintReceipt;
    private String paperSize;
    private Integer printCopies;
}
