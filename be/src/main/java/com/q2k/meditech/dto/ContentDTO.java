package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContentDTO {

    private Long id;
    private String title;
    private String body;
    private String summary;
    private String type;
    private String status;
    private String author;
    private String thumbnailUrl;
    private String slug;
    private Boolean isPinned;
    private Integer viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
