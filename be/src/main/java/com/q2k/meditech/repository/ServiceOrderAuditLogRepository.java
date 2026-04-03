package com.q2k.meditech.repository;

import com.q2k.meditech.entity.ServiceOrderAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ServiceOrderAuditLogRepository
        extends JpaRepository<ServiceOrderAuditLog, Long>,
                JpaSpecificationExecutor<ServiceOrderAuditLog> {

    List<ServiceOrderAuditLog> findByAppointmentIdOrderByCreatedAtAsc(Long appointmentId);

    List<ServiceOrderAuditLog> findByServiceOrderIdOrderByCreatedAtAsc(Long serviceOrderId);

    Page<ServiceOrderAuditLog> findByEventTypeOrderByCreatedAtDesc(String eventType, Pageable pageable);

    @Query("SELECT DISTINCT l.eventType FROM ServiceOrderAuditLog l ORDER BY l.eventType")
    List<String> findDistinctEventTypes();

    @Query("SELECT COUNT(l) FROM ServiceOrderAuditLog l WHERE l.createdAt BETWEEN :from AND :to")
    long countBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
