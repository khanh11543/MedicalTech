package com.q2k.meditech.service;

import com.q2k.meditech.dto.CloudinaryResponse;
import com.q2k.meditech.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileStorageServiceImplTest {

    @Mock CloudinaryService cloudinaryService;

    @InjectMocks FileStorageServiceImpl fileStorageService;

    @Test
    void storeAvatar_invalidFile_throws() {
        MultipartFile f = mock(MultipartFile.class);
        when(f.isEmpty()).thenReturn(true);
        assertThatThrownBy(() -> fileStorageService.storeAvatar(1L, f)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void storeAvatar_returnsUrl() {
        MultipartFile f = mock(MultipartFile.class);
        when(f.isEmpty()).thenReturn(false);
        when(f.getSize()).thenReturn(100L);
        when(f.getOriginalFilename()).thenReturn("a.jpg");
        when(cloudinaryService.uploadFile(eq(f), contains("avatars/")))
                .thenReturn(CloudinaryResponse.builder().url("https://res.cloudinary.com/x/image/upload/v1/a").build());
        assertThat(fileStorageService.storeAvatar(1L, f)).contains("cloudinary");
    }

    @Test
    void deleteAvatar_blank_noop() {
        fileStorageService.deleteAvatar("");
        verifyNoInteractions(cloudinaryService);
    }

    @Test
    void deleteAvatar_cloudinary_deletes() {
        fileStorageService.deleteAvatar("https://res.cloudinary.com/c/image/upload/v123/folder/id.jpg");
        verify(cloudinaryService).deleteFile(anyString());
    }

    @Test
    void uploadFile_valid() {
        MultipartFile f = mock(MultipartFile.class);
        when(f.isEmpty()).thenReturn(false);
        when(f.getSize()).thenReturn(10L);
        when(f.getOriginalFilename()).thenReturn("doc.pdf");
        when(cloudinaryService.uploadFile(eq(f), contains("consultation")))
                .thenReturn(CloudinaryResponse.builder().url("u").build());
        assertThat(fileStorageService.uploadFile("consultation/x", f)).isEqualTo("u");
    }

    @Test
    void deleteFile_noopForNonCloudinary() {
        fileStorageService.deleteFile("http://other.com/f");
        verifyNoInteractions(cloudinaryService);
    }
}
