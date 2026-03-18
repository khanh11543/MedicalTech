package com.q2k.meditech.controller;

import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * File Upload Controller
 * Handles avatar and file upload endpoints
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "File Upload", description = "File upload APIs")
public class FileUploadController {

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    /**
     * POST /api/users/me/avatar
     * Upload an avatar image for the current user.
     * Uploads to Cloudinary, updates user.avatarUrl, returns the URL.
     */
    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload avatar image", description = "Upload an image file to use as profile avatar")
    public ResponseEntity<Map<String, String>> uploadAvatar(
            @RequestParam("file") MultipartFile file) {

        User user = getAuthenticatedUser();

        // Delete old avatar if exists
        if (user.getAvatarUrl() != null) {
            fileStorageService.deleteAvatar(user.getAvatarUrl());
        }

        // Upload to Cloudinary
        String avatarUrl = fileStorageService.storeAvatar(user.getId(), file);

        // Update user
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);

        log.info("Avatar uploaded for user {}: {}", user.getEmail(), avatarUrl);

        return ResponseEntity.ok(Map.of(
                "avatarUrl", avatarUrl,
                "message", "Avatar uploaded successfully"
        ));
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmailWithRoles(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
