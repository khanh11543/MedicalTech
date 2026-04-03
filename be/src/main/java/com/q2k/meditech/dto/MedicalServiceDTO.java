package com.q2k.meditech.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalServiceDTO {
    private Long id;
    private String serviceName;
    private String category;
    private BigDecimal defaultPrice;
    private String description;
    private Boolean active;
}
