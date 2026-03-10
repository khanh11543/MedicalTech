package com.q2k.meditech.repository;

import com.q2k.meditech.entity.SecurityEvent;
import com.q2k.meditech.entity.enums.SecurityEventStatus;
import com.q2k.meditech.entity.enums.SecurityEventType;
import com.q2k.meditech.entity.enums.SecuritySeverity;
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
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long>, JpaSpecificationExecutor<SecurityEvent> {

    List<SecurityEvent> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<SecurityEvent> findByEventTypeOrderByCreatedAtDesc(SecurityEventType eventType);

    List<SecurityEvent> findBySeverityOrderByCreatedAtDesc(SecuritySeverity severity);

    List<SecurityEvent> findByIpAddressOrderByCreatedAtDesc(String ipAddress);

    List<SecurityEvent> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime from, LocalDateTime to);

    // ===== Statistics queries =====

    @Query("SELECT COUNT(e) FROM SecurityEvent e WHERE e.eventType = :type AND e.createdAt >= :since")
    long countByEventTypeAndCreatedAtAfter(
            @Param("type") SecurityEventType type,
            @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(DISTINCT e.ipAddress) FROM SecurityEvent e " +
           "WHERE e.eventType = :type AND e.createdAt >= :since")
    long countDistinctIpByEventTypeAndCreatedAtAfter(
            @Param("type") SecurityEventType type,
            @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(e) FROM SecurityEvent e WHERE e.severity = :severity AND e.createdAt >= :since")
    long countBySeverityAndCreatedAtAfter(
            @Param("severity") SecuritySeverity severity,
            @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(e) FROM SecurityEvent e WHERE e.createdAt >= :since")
    long countSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(e) FROM SecurityEvent e WHERE e.status = :status AND e.createdAt >= :since")
    long countByStatusAndCreatedAtAfter(
            @Param("status") SecurityEventStatus status,
            @Param("since") LocalDateTime since);

    // ===== Paginated queries =====

    Page<SecurityEvent> findByStatusOrderByCreatedAtDesc(SecurityEventStatus status, Pageable pageable);

    Page<SecurityEvent> findBySeverityOrderByCreatedAtDesc(SecuritySeverity severity, Pageable pageable);

    // ===== Related events =====

    @Query("SELECT e FROM SecurityEvent e WHERE e.ipAddress = :ipAddress " +
           "AND e.createdAt >= :since ORDER BY e.createdAt DESC")
    List<SecurityEvent> findByIpAddressAndCreatedAtAfter(
            @Param("ipAddress") String ipAddress,
            @Param("since") LocalDateTime since);

    @Query("SELECT e FROM SecurityEvent e WHERE e.user.id = :userId " +
           "AND e.createdAt >= :since ORDER BY e.createdAt DESC")
    List<SecurityEvent> findByUserIdAndCreatedAtAfter(
            @Param("userId") Long userId,
            @Param("since") LocalDateTime since);

    // ===== Aggregation queries =====

    @Query("SELECT e.eventType, COUNT(e) FROM SecurityEvent e " +
           "WHERE e.createdAt BETWEEN :from AND :to " +
           "GROUP BY e.eventType ORDER BY COUNT(e) DESC")
    List<Object[]> countByEventTypeGrouped(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("SELECT e.severity, COUNT(e) FROM SecurityEvent e " +
           "WHERE e.createdAt >= :since GROUP BY e.severity")
    List<Object[]> countBySeverityGrouped(@Param("since") LocalDateTime since);

    @Query("SELECT FUNCTION('DATE', e.createdAt), COUNT(e) FROM SecurityEvent e " +
           "WHERE e.createdAt BETWEEN :from AND :to " +
           "GROUP BY FUNCTION('DATE', e.createdAt) ORDER BY FUNCTION('DATE', e.createdAt)")
    List<Object[]> countByDateGrouped(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
