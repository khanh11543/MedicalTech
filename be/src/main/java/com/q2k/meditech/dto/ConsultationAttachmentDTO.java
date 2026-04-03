package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for Consultation Attachment
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationAttachmentDTO {

    private Long id;
    private Long consultationId;
    private String filename;
    private String filePath;
    private String fileType;
    private Long fileSize;
    private String mimeType;
    private LocalDateTime createdAt;
    private String uploadedByUserName;
}
