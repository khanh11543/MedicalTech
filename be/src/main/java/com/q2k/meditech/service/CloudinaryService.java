package com.q2k.meditech.service;

import com.cloudinary.Cloudinary;
import com.q2k.meditech.dto.CloudinaryResponse;
import com.q2k.meditech.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
@Slf4j
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    public CloudinaryResponse uploadFile(final MultipartFile file, final String fileName) {
        try {
            final Map result = this.cloudinary.uploader()
                    .upload(file.getBytes(),
                            Map.of("public_id", "meditech/" + fileName)
                    );

            final String url = (String) result.get("secure_url");
            final String publicId = (String) result.get("public_id");

            return CloudinaryResponse.builder()
                    .publicId(publicId)
                    .url(url)
                    .build();

        } catch (final Exception e) {
            log.error("Failed to upload file to Cloudinary: {}", e.getMessage());
            throw new BadRequestException("Failed to upload file: " + e.getMessage());
        }
    }

    public void deleteFile(final String publicId) {
        try {
            this.cloudinary.uploader().destroy(publicId, Map.of());
        } catch (final Exception e) {
            log.error("Failed to delete file from Cloudinary: {}", e.getMessage());
            throw new BadRequestException("Failed to delete file: " + e.getMessage());
        }
    }
}
