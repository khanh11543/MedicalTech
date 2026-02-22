package com.q2k.meditech.controller;

import com.q2k.meditech.dto.ContentCreateDTO;
import com.q2k.meditech.dto.ContentDTO;
import com.q2k.meditech.dto.ContentStatusDTO;
import com.q2k.meditech.service.ContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/contents")
public class AdminContentController {

    @Autowired
    private ContentService contentService;

    /**
     * GET /admin/contents - List all contents (paginated, with filters)
     */
    @GetMapping
    public ResponseEntity<Page<ContentDTO>> getAllContents(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "10") int pageSize) {

        Page<ContentDTO> contents = contentService.getAllContents(keyword, type, status, pageNumber, pageSize);
        return ResponseEntity.ok(contents);
    }

    /**
     * GET /admin/contents/{id} - Get content detail
     */
    @GetMapping("/{id}")
    public ResponseEntity<ContentDTO> getContentDetail(@PathVariable Long id) {
        ContentDTO content = contentService.getContentById(id);
        return ResponseEntity.ok(content);
    }

    /**
     * POST /admin/contents - Create new content
     */
    @PostMapping
    public ResponseEntity<ContentDTO> createContent(@RequestBody ContentCreateDTO dto) {
        ContentDTO content = contentService.createContent(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(content);
    }

    /**
     * PUT /admin/contents/{id} - Update content
     */
    @PutMapping("/{id}")
    public ResponseEntity<ContentDTO> updateContent(
            @PathVariable Long id,
            @RequestBody ContentCreateDTO dto) {
        ContentDTO content = contentService.updateContent(id, dto);
        return ResponseEntity.ok(content);
    }

    /**
     * PATCH /admin/contents/{id}/status - Update content status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ContentDTO> updateContentStatus(
            @PathVariable Long id,
            @RequestBody ContentStatusDTO dto) {
        ContentDTO content = contentService.updateStatus(id, dto.getStatus());
        return ResponseEntity.ok(content);
    }

    /**
     * DELETE /admin/contents/{id} - Delete content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContent(@PathVariable Long id) {
        contentService.deleteContent(id);
        return ResponseEntity.noContent().build();
    }
}
