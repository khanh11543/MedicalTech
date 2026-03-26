package com.q2k.meditech.dto.room;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomDTO {
    private Long id;
    private String roomNumber;
    private String name;
    private Integer floor;
    private Boolean isActive;
    private Long doctorId;
    private String doctorName;
}

