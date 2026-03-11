package com.q2k.meditech.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactMessageDTO {
    private String name;
    private String email;
    private String subject;
    private String message;
}
