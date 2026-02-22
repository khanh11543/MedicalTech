package com.q2k.meditech.repository;

import com.q2k.meditech.entity.DataRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DataRequestRepository extends JpaRepository<DataRequest, Long> {

    List<DataRequest> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<DataRequest> findByRequestTypeOrderByCreatedAtDesc(String requestType);

    List<DataRequest> findByStatusOrderByCreatedAtDesc(String status);

    List<DataRequest> findByProcessedByIdOrderByProcessedAtDesc(Long processedById);

    List<DataRequest> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime from, LocalDateTime to);

    Long countByStatus(String status);

    @Query("SELECT COUNT(dr) FROM DataRequest dr WHERE dr.status = 'PENDING' AND dr.createdAt < :threshold")
    Long countOverdueRequests(LocalDateTime threshold);
}
