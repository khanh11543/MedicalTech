package com.q2k.meditech.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Service for handling file storage operations (avatar uploads, etc.)
 */
public interface FileStorageService {

    /**
     * Store an avatar image and return its accessible URL
     */
    String storeAvatar(Long userId, MultipartFile file);

    /**
     * Delete an avatar by its URL
     */
    void deleteAvatar(String avatarUrl);
}
