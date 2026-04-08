package com.q2k.meditech.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.q2k.meditech.dto.CloudinaryResponse;
import com.q2k.meditech.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CloudinaryServiceTest {

    @Mock
    private Cloudinary cloudinary;
    @Mock
    private Uploader uploader;

    private final CloudinaryService cloudinaryService = new CloudinaryService();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(cloudinaryService, "cloudinary", cloudinary);
        when(cloudinary.uploader()).thenReturn(uploader);
    }

    @Test
    void uploadFile_success_returnsResponse() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getBytes()).thenReturn(new byte[]{1, 2});
        when(uploader.upload(any(), any())).thenReturn(Map.of(
                "secure_url", "https://example.com/x",
                "public_id", "meditech/name"
        ));
        CloudinaryResponse r = cloudinaryService.uploadFile(file, "name");
        assertNotNull(r.getUrl());
        assertEquals("meditech/name", r.getPublicId());
    }

    @Test
    void uploadFile_failure_throwsBadRequest() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getBytes()).thenThrow(new RuntimeException("io"));
        assertThrows(BadRequestException.class, () -> cloudinaryService.uploadFile(file, "n"));
    }

    @Test
    void deleteFile_failure_throwsBadRequest() throws Exception {
        doThrow(new RuntimeException("x")).when(uploader).destroy(anyString(), any());
        assertThrows(BadRequestException.class, () -> cloudinaryService.deleteFile("pid"));
    }
}
