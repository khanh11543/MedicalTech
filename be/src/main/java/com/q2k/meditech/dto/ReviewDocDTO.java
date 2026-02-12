package com.q2k.meditech.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO for reviewing (approve/reject) a doctor document
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewDocDTO {
    
    @Size(max = 1000, message = "Review note must not exceed 1000 characters")
    private String reviewNote;
}