package com.q2k.meditech.dto.auth;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Token Response DTO
 * Contains access token and refresh token
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TokenDTO {

    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime expiresAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime refreshExpiresAt;
    
    // Session information
    private String sessionKey;
    
    // User information
    private Long userId;
    private String email;
    private Set<String> roles;
}
