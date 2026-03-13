package com.q2k.meditech.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Note DTO
 * Used for actions that require notes (disable, reject, etc.)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteDTO {
    
    @Size(max = 500, message = "Note must not exceed 500 characters")
    private String note;
}