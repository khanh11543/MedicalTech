package com.q2k.meditech.repository;

import com.q2k.meditech.entity.DeletionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeletionLogRepository extends JpaRepository<DeletionLog, Long>,
        JpaSpecificationExecutor<DeletionLog> {

    List<DeletionLog> findByUserIdOrderByExecutedDateDesc(Long userId);

    @Query("SELECT d FROM DeletionLog d WHERE d.deletionRequestId = :requestId")
    List<DeletionLog> findByDeletionRequestId(@Param("requestId") Long requestId);
}
