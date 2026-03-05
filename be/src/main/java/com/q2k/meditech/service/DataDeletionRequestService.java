package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import org.springframework.data.domain.Page;

public interface DataDeletionRequestService {

    Page<DataDeletionRequestDTO> getDeletionRequests(DeletionRequestFilterDTO filter);

    DeletionReviewDetailDTO getReviewDetail(Long id);

    DataDeletionRequestDTO approveDeletionRequest(Long id, ApproveDeletionDTO dto);

    DataDeletionRequestDTO rejectDeletionRequest(Long id, RejectDeletionDTO dto);

    DataDeletionRequestDTO requestMoreInfo(Long id, RequestInfoDTO dto);

    DataDeletionRequestDTO cancelDeletionRequest(Long id, CancelDeletionDTO dto);

    DeletionExecutionResultDTO executeDeletion(Long id, ExecuteDeletionDTO dto);

    Page<DeletionLogDTO> getDeletionLog(Integer page, Integer size, String sortBy, String sortDirection);
}
