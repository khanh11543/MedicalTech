package com.q2k.meditech.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicContentDTO {
    private Long id;
    private String title;
    private String body;
    private String summary;
    private String type;
    private String author;
    private String thumbnailUrl;
    private Boolean isPinned;
    private String createdAt;
}
