package com.q2k.meditech.repository;

import com.q2k.meditech.entity.DataExportRequest;
import com.q2k.meditech.entity.enums.ExportRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DataExportRequestRepository
        extends JpaRepository<DataExportRequest, Long>,
                JpaSpecificationExecutor<DataExportRequest> {

    @Query("SELECT r FROM DataExportRequest r JOIN FETCH r.user u WHERE r.id = :id")
    Optional<DataExportRequest> findByIdWithUser(@Param("id") Long id);

    List<DataExportRequest> findByStatusAndRequestedDateBefore(
            ExportRequestStatus status, LocalDate date);

    Long countByStatus(ExportRequestStatus status);

    Long countByUserId(Long userId);

    @Query("SELECT r FROM DataExportRequest r WHERE r.status = :status ORDER BY r.requestedDate ASC")
    List<DataExportRequest> findPendingRequests(@Param("status") ExportRequestStatus status);

    boolean existsByUserIdAndStatus(Long userId, ExportRequestStatus status);
}
