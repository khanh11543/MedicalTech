package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "contents")
public class Content extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "LONGTEXT")
    private String body;

    @Column(length = 500)
    private String summary;

    @Column(nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ContentType type = ContentType.ARTICLE;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ContentStatus status = ContentStatus.DRAFT;

    @Column(length = 255)
    private String author;

    @Column(length = 500)
    private String thumbnailUrl;

    @Column(length = 500)
    private String slug;

    @Column(name = "is_pinned")
    @Builder.Default
    private Boolean isPinned = false;

    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0;

    public enum ContentType {
        ARTICLE, FAQ, POLICY, NEWS, GUIDE
    }

    public enum ContentStatus {
        DRAFT, PUBLISHED, ARCHIVED
    }
}
