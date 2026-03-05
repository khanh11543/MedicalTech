package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for file download response metadata
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileDownloadDTO {

    private String filename;
    private String contentType;
    private Long fileSize;
    private String downloadUrl;
    private String message;
}
