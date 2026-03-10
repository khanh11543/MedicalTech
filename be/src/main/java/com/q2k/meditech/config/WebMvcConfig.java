package com.q2k.meditech.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Web MVC Configuration
 * Configures static resource handlers for serving uploaded files (avatars, etc.)
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.avatar-dir:uploads/avatars}")
    private String avatarDir;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path avatarPath = Paths.get(avatarDir).toAbsolutePath().normalize();
        registry.addResourceHandler("/uploads/avatars/**")
                .addResourceLocations("file:" + avatarPath.toString() + "/");

        Path documentsPath = Paths.get(uploadDir, "documents").toAbsolutePath().normalize();
        registry.addResourceHandler("/uploads/documents/**")
                .addResourceLocations("file:" + documentsPath.toString() + "/");
    }
}
