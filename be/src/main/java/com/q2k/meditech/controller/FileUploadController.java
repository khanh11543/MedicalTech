package com.q2k.meditech.controller;

import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

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

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.upload.max-avatar-size:5242880}") // 5MB default
    private long maxAvatarSize;

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );

    /**
     * POST /api/users/me/avatar
     * Upload an avatar image for the current user.
     * Saves to disk, updates user.avatarUrl, returns the URL.
     */
    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload avatar image", description = "Upload an image file to use as profile avatar")
    public ResponseEntity<Map<String, String>> uploadAvatar(
            @RequestParam("file") MultipartFile file) {

        // Validate file
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "File is empty"));
        }
        if (file.getSize() > maxAvatarSize) {
            return ResponseEntity.badRequest().body(Map.of("message", "File size exceeds 5MB limit"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Invalid file type. Allowed: JPEG, PNG, GIF, WebP"
            ));
        }

        try {
            User user = getAuthenticatedUser();

            // Create upload directory
            Path avatarDir = Paths.get(uploadDir, "avatars");
            Files.createDirectories(avatarDir);

            // Generate unique filename
            String originalName = file.getOriginalFilename();
            String extension = "";
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf("."));
            }
            String filename = "avatar_" + user.getId() + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;

            // Save file
            Path filePath = avatarDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Build URL (served by the static resource handler)
            String avatarUrl = "/uploads/avatars/" + filename;

            // Update user
            user.setAvatarUrl(avatarUrl);
            userRepository.save(user);

            log.info("Avatar uploaded for user {}: {}", user.getEmail(), avatarUrl);

            return ResponseEntity.ok(Map.of(
                    "avatarUrl", avatarUrl,
                    "message", "Avatar uploaded successfully"
            ));

        } catch (IOException e) {
            log.error("Failed to upload avatar", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to save file"));
        }
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmailWithRoles(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
