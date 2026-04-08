package com.q2k.meditech.service;

import com.q2k.meditech.dto.ContentCreateDTO;
import com.q2k.meditech.dto.ContentDTO;
import com.q2k.meditech.entity.Content;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.ContentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContentServiceTest {

    @Mock
    private ContentRepository contentRepository;

    private ContentService service;

    @BeforeEach
    void wire() {
        service = new ContentService();
        ReflectionTestUtils.setField(service, "contentRepository", contentRepository);
    }

    @Test
    void getAllContents_noFilters() {
        Pageable p = PageRequest.of(0, 10);
        Page<Content> page = new PageImpl<>(List.of(sampleContent()));
        when(contentRepository.findAllByOrderByCreatedAtDesc(p)).thenReturn(page);
        Page<ContentDTO> res = service.getAllContents(null, null, null, 0, 10);
        assertThat(res.getContent()).hasSize(1);
    }

    @Test
    void getAllContents_keyword() {
        Pageable p = PageRequest.of(0, 5);
        when(contentRepository.searchByKeyword(eq("k"), eq(p))).thenReturn(Page.empty(p));
        service.getAllContents(" k ", null, null, 0, 5);
    }

    @Test
    void getContentById_found() {
        Content c = sampleContent();
        c.setId(1L);
        when(contentRepository.findById(1L)).thenReturn(Optional.of(c));
        assertThat(service.getContentById(1L).getTitle()).isEqualTo("T");
    }

    @Test
    void createContent_requiresTitle() {
        assertThatThrownBy(() -> service.createContent(new ContentCreateDTO()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void createContent_saves() {
        ContentCreateDTO dto = new ContentCreateDTO();
        dto.setTitle("Hello");
        when(contentRepository.existsBySlug(any())).thenReturn(false);
        Content saved = sampleContent();
        saved.setId(9L);
        when(contentRepository.save(any(Content.class))).thenReturn(saved);
        ContentDTO out = service.createContent(dto);
        assertThat(out.getId()).isEqualTo(9L);
    }

    @Test
    void updateContent_delete_updateStatus() {
        Content c = sampleContent();
        c.setId(2L);
        when(contentRepository.findById(2L)).thenReturn(Optional.of(c));
        when(contentRepository.save(any(Content.class))).thenAnswer(inv -> inv.getArgument(0));
        ContentCreateDTO dto = new ContentCreateDTO();
        dto.setTitle("N");
        service.updateContent(2L, dto);
        when(contentRepository.findById(2L)).thenReturn(Optional.of(c));
        service.updateStatus(2L, "PUBLISHED");
        when(contentRepository.findById(2L)).thenReturn(Optional.of(c));
        service.deleteContent(2L);
        verify(contentRepository).delete(c);
    }

    private static Content sampleContent() {
        return Content.builder()
                .title("T")
                .type(Content.ContentType.ARTICLE)
                .status(Content.ContentStatus.DRAFT)
                .build();
    }
}
