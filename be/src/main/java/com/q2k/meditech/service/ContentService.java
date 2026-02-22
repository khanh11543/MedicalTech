package com.q2k.meditech.service;

import com.q2k.meditech.dto.ContentCreateDTO;
import com.q2k.meditech.dto.ContentDTO;
import com.q2k.meditech.entity.Content;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.ContentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContentService {

    @Autowired
    private ContentRepository contentRepository;

    /**
     * Get all contents with optional filters (admin)
     */
    public Page<ContentDTO> getAllContents(String keyword, String type, String status,
                                           int pageNumber, int pageSize) {
        Pageable pageable = PageRequest.of(pageNumber, pageSize);

        Page<Content> page;
        if (keyword != null && !keyword.trim().isEmpty()) {
            page = contentRepository.searchByKeyword(keyword.trim(), pageable);
        } else if (type != null && status != null) {
            page = contentRepository.findByTypeAndStatusOrderByCreatedAtDesc(
                    Content.ContentType.valueOf(type),
                    Content.ContentStatus.valueOf(status),
                    pageable);
        } else if (type != null) {
            page = contentRepository.findByTypeOrderByCreatedAtDesc(
                    Content.ContentType.valueOf(type), pageable);
        } else if (status != null) {
            page = contentRepository.findByStatusOrderByCreatedAtDesc(
                    Content.ContentStatus.valueOf(status), pageable);
        } else {
            page = contentRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        return page.map(this::convertToDTO);
    }

    /**
     * Get content by ID
     */
    public ContentDTO getContentById(Long id) {
        Content content = contentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Content", "id", id));
        return convertToDTO(content);
    }

    /**
     * Create new content
     */
    @Transactional
    public ContentDTO createContent(ContentCreateDTO dto) {
        if (dto.getTitle() == null || dto.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Title is required");
        }

        Content content = Content.builder()
                .title(dto.getTitle())
                .body(dto.getBody())
                .summary(dto.getSummary())
                .type(dto.getType() != null ? Content.ContentType.valueOf(dto.getType()) : Content.ContentType.ARTICLE)
                .status(dto.getStatus() != null ? Content.ContentStatus.valueOf(dto.getStatus()) : Content.ContentStatus.DRAFT)
                .author(dto.getAuthor())
                .thumbnailUrl(dto.getThumbnailUrl())
                .slug(dto.getSlug() != null ? dto.getSlug() : generateSlug(dto.getTitle()))
                .isPinned(dto.getIsPinned() != null ? dto.getIsPinned() : false)
                .build();

        Content saved = contentRepository.save(content);
        return convertToDTO(saved);
    }

    /**
     * Update existing content
     */
    @Transactional
    public ContentDTO updateContent(Long id, ContentCreateDTO dto) {
        Content content = contentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Content", "id", id));

        if (dto.getTitle() != null) content.setTitle(dto.getTitle());
        if (dto.getBody() != null) content.setBody(dto.getBody());
        if (dto.getSummary() != null) content.setSummary(dto.getSummary());
        if (dto.getType() != null) content.setType(Content.ContentType.valueOf(dto.getType()));
        if (dto.getStatus() != null) content.setStatus(Content.ContentStatus.valueOf(dto.getStatus()));
        if (dto.getAuthor() != null) content.setAuthor(dto.getAuthor());
        if (dto.getThumbnailUrl() != null) content.setThumbnailUrl(dto.getThumbnailUrl());
        if (dto.getSlug() != null) content.setSlug(dto.getSlug());
        if (dto.getIsPinned() != null) content.setIsPinned(dto.getIsPinned());

        Content saved = contentRepository.save(content);
        return convertToDTO(saved);
    }

    /**
     * Delete content
     */
    @Transactional
    public void deleteContent(Long id) {
        Content content = contentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Content", "id", id));
        contentRepository.delete(content);
    }

    /**
     * Toggle content status (publish/archive/draft)
     */
    @Transactional
    public ContentDTO updateStatus(Long id, String status) {
        Content content = contentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Content", "id", id));
        content.setStatus(Content.ContentStatus.valueOf(status));
        Content saved = contentRepository.save(content);
        return convertToDTO(saved);
    }

    private String generateSlug(String title) {
        if (title == null) return null;
        String slug = title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");

        // Ensure uniqueness
        if (contentRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis();
        }
        return slug;
    }

    private ContentDTO convertToDTO(Content content) {
        ContentDTO dto = new ContentDTO();
        dto.setId(content.getId());
        dto.setTitle(content.getTitle());
        dto.setBody(content.getBody());
        dto.setSummary(content.getSummary());
        dto.setType(content.getType() != null ? content.getType().name() : null);
        dto.setStatus(content.getStatus() != null ? content.getStatus().name() : null);
        dto.setAuthor(content.getAuthor());
        dto.setThumbnailUrl(content.getThumbnailUrl());
        dto.setSlug(content.getSlug());
        dto.setIsPinned(content.getIsPinned());
        dto.setViewCount(content.getViewCount());
        dto.setCreatedAt(content.getCreatedAt());
        dto.setUpdatedAt(content.getUpdatedAt());
        return dto;
    }
}
