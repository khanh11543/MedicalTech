package com.q2k.meditech.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Service for handling file storage operations via Cloudinary
 */
public interface FileStorageService {

    /**
     * Store an avatar image and return its accessible URL
     */
    String storeAvatar(Long userId, MultipartFile file);

    /**
     * Delete an avatar by its URL or publicId
     */
    void deleteAvatar(String avatarUrl);

    /**
     * Upload a file to a specific folder and return the accessible URL
     * @param folder the Cloudinary folder (e.g. "reviews", "documents", "consultations")
     * @param file the file to upload
     * @return the Cloudinary secure URL
     */
    String uploadFile(String folder, MultipartFile file);

    /**
     * Delete a file by its Cloudinary URL or publicId
     */
    void deleteFile(String fileUrl);
}
