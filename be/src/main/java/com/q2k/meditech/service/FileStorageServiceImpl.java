package com.q2k.meditech.service;

import com.q2k.meditech.dto.CloudinaryResponse;
import com.q2k.meditech.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class FileStorageServiceImpl implements FileStorageService {

    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");
    private static final Set<String> ALLOWED_DOC_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp", "pdf");
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final long MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB

    private final CloudinaryService cloudinaryService;

    @Override
    public String storeAvatar(Long userId, MultipartFile file) {
        validateFile(file, MAX_IMAGE_SIZE, ALLOWED_IMAGE_EXTENSIONS);

        String fileName = "avatar_" + userId + "_" + UUID.randomUUID().toString().substring(0, 8);
        CloudinaryResponse response = cloudinaryService.uploadFile(file, "avatars/" + fileName);
        log.info("Avatar uploaded to Cloudinary for user {}: {}", userId, response.getUrl());
        return response.getUrl();
    }

    @Override
    public void deleteAvatar(String avatarUrl) {
        if (avatarUrl == null || avatarUrl.isBlank()) return;
        // Only delete Cloudinary URLs (skip legacy local paths)
        if (avatarUrl.contains("cloudinary") || avatarUrl.contains("res.cloudinary.com")) {
            String publicId = extractPublicId(avatarUrl);
            if (publicId != null) {
                cloudinaryService.deleteFile(publicId);
                log.info("Deleted avatar from Cloudinary: {}", publicId);
            }
        }
    }

    @Override
    public String uploadFile(String folder, MultipartFile file) {
        Set<String> allowed = folder.contains("document") || folder.contains("consultation") || folder.contains("service-result")
                ? ALLOWED_DOC_EXTENSIONS : ALLOWED_IMAGE_EXTENSIONS;
        long maxSize = folder.contains("document") || folder.contains("consultation") || folder.contains("service-result")
                ? MAX_DOC_SIZE : MAX_IMAGE_SIZE;

        validateFile(file, maxSize, allowed);

        String uniqueName = UUID.randomUUID().toString().substring(0, 8);
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.contains(".")) {
            String baseName = originalFilename.substring(0, originalFilename.lastIndexOf("."));
            uniqueName = sanitizeFileName(baseName) + "_" + uniqueName;
        }

        CloudinaryResponse response = cloudinaryService.uploadFile(file, folder + "/" + uniqueName);
        log.info("File uploaded to Cloudinary folder '{}': {}", folder, response.getUrl());
        return response.getUrl();
    }

    @Override
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return;
        if (fileUrl.contains("cloudinary") || fileUrl.contains("res.cloudinary.com")) {
            String publicId = extractPublicId(fileUrl);
            if (publicId != null) {
                cloudinaryService.deleteFile(publicId);
                log.info("Deleted file from Cloudinary: {}", publicId);
            }
        }
    }

    private void validateFile(MultipartFile file, long maxSize, Set<String> allowedExtensions) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        if (file.getSize() > maxSize) {
            throw new BadRequestException("File size must not exceed " + (maxSize / 1024 / 1024) + "MB");
        }

        String originalFilename = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        String extension = getFileExtension(originalFilename).toLowerCase();

        if (!allowedExtensions.contains(extension)) {
            throw new BadRequestException("Only these file types are allowed: " + allowedExtensions);
        }
    }

    private String getFileExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot + 1) : "";
    }

    private String sanitizeFileName(String name) {
        return name.replaceAll("[^a-zA-Z0-9_-]", "_");
    }

    /**
     * Extract Cloudinary public_id from a secure_url.
     * URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{ext}
     */
    private String extractPublicId(String url) {
        try {
            // Remove query params
            String clean = url.contains("?") ? url.substring(0, url.indexOf("?")) : url;
            // Find /upload/ or /image/upload/
            int uploadIdx = clean.indexOf("/upload/");
            if (uploadIdx == -1) return null;
            String afterUpload = clean.substring(uploadIdx + "/upload/".length());
            // Skip version (v1234567890/)
            if (afterUpload.startsWith("v") && afterUpload.contains("/")) {
                afterUpload = afterUpload.substring(afterUpload.indexOf("/") + 1);
            }
            // Remove file extension
            int lastDot = afterUpload.lastIndexOf(".");
            if (lastDot > 0) {
                afterUpload = afterUpload.substring(0, lastDot);
            }
            return afterUpload;
        } catch (Exception e) {
            log.warn("Could not extract publicId from URL: {}", url);
            return null;
        }
    }
}
