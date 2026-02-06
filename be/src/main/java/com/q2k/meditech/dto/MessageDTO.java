package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {

    private String message;
    private Boolean success;

    public MessageDTO(String message) {
        this.message = message;
        this.success = true;
    }
}
