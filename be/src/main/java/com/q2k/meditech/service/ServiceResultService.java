package com.q2k.meditech.service;

import com.q2k.meditech.dto.ServiceResultCreateDTO;
import com.q2k.meditech.dto.ServiceResultDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ServiceResultService {

    /**
     * Save or update a service result (draft or completed)
     */
    ServiceResultDTO saveResult(Long serviceOrderId, ServiceResultCreateDTO dto);

    /**
     * Get a service result by service order ID
     */
    ServiceResultDTO getResultByServiceOrderId(Long serviceOrderId);

    /**
     * Upload an attachment to a service result
     */
    ServiceResultDTO uploadAttachment(Long serviceOrderId, MultipartFile file);

    /**
     * Delete an attachment from a service result
     */
    void deleteAttachment(Long serviceOrderId, Long attachmentId);
}
