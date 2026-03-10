package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;

public interface DataExportRequestService {

    /**
     * Get paginated list of data export requests with filters
     */
    Page<DataExportRequestDTO> getExportRequests(ExportRequestFilterDTO filter);

    /**
     * Process a data export request - generate the export file
     */
    DataExportRequestDTO processExportRequest(Long id, ProcessExportRequestDTO dto);

    /**
     * Download the generated export file
     */
    Resource downloadExportFile(Long id);

    /**
     * Get the filename for download
     */
    String getExportFileName(Long id);

    /**
     * Send export file to user via email
     */
    MessageDTO sendExportEmail(Long id, SendExportEmailDTO dto);

    /**
     * Delete export request and associated files
     */
    MessageDTO deleteExportRequest(Long id);

    /**
     * Toggle auto-process configuration
     */
    AutoProcessConfigDTO toggleAutoProcess(AutoProcessConfigDTO dto);

    /**
     * Get current auto-process configuration
     */
    AutoProcessConfigDTO getAutoProcessConfig();
}
