package com.q2k.meditech.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryUpdateDTO {

    /**
     * IMPORT → add quantity; EXPORT → subtract quantity; ADJUST → set quantity absolutely
     */
    @NotBlank(message = "Type is required (IMPORT, EXPORT, or ADJUST)")
    private String type;

    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    private Integer quantity;

    private String note;
}
