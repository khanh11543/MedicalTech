package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUserResponseDTO {

    private Long userId;
    private String email;
    private String fullName;
    private String phone;
    private Boolean isActive;
    private Set<String> roles;

    // Doctor-specific info (null if not a doctor)
    private Long doctorId;
    private String specialization;
    private String verificationStatus;

    // Invite info
    private String inviteStatus; // "sent", "failed", "not_sent"
    private String inviteMessage;
}
