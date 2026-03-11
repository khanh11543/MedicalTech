package com.q2k.meditech.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicReviewDTO {
    private Long id;
    private String patientName;
    private String doctorName;
    private String doctorSpecialty;
    private Integer rating;
    private String comment;
    private java.util.List<String> imageUrls;
    private Boolean isAnonymous;
    private String createdAt;
}
