package com.q2k.meditech.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorBasicDTO {
    private Long id;           // Doctor.id (not user.id)
    private String fullName;
    private String email;
    private String avatar;
    private String specialization;
}
