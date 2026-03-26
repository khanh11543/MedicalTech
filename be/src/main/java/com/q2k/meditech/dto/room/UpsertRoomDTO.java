package com.q2k.meditech.dto.room;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpsertRoomDTO {

    @NotBlank
    @Size(max = 20)
    private String roomNumber;

    @Size(max = 255)
    private String name;

    private Integer floor;

    private Boolean isActive;
}

