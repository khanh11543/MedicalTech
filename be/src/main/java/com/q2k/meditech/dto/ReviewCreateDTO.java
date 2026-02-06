package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewCreateDTO {

    private Long appointmentId;
    private Long patientId;
    private Integer rating;
    private String comment;
    private Boolean isAnonymous;
}
