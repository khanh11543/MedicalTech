package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContentCreateDTO {

    private String title;
    private String body;
    private String summary;
    private String type;
    private String status;
    private String author;
    private String thumbnailUrl;
    private String slug;
    private Boolean isPinned;
}
