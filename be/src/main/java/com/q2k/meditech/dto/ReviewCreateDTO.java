package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewCreateDTO {

    /** Required for appointment-based review; null for general testimonial */
    private Long appointmentId;
    private Long patientId;
    /** Optional: doctor to associate with a general testimonial */
    private Long doctorId;
    private Integer rating;
    private String comment;
    private Boolean isAnonymous;
    /** Optional: image URLs from upload endpoint (for general testimonial) */
    private java.util.List<String> imageUrls;
}
