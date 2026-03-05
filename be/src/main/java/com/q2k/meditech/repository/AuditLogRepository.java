package com.q2k.meditech.repository;

import com.q2k.meditech.entity.AuditLog;
import com.q2k.meditech.entity.enums.AuditActionType;
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
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, Long entityId);

    List<AuditLog> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<AuditLog> findByActionOrderByCreatedAtDesc(String action);

    List<AuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime from, LocalDateTime to);

    // ===== Paginated queries =====

    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<AuditLog> findByActionTypeOrderByCreatedAtDesc(AuditActionType actionType, Pageable pageable);

    Page<AuditLog> findByEntityTypeOrderByCreatedAtDesc(String entityType, Pageable pageable);

    // ===== Statistics queries =====

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.createdAt BETWEEN :from AND :to")
    long countBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT a.actionType, COUNT(a) FROM AuditLog a " +
           "WHERE a.createdAt BETWEEN :from AND :to " +
           "GROUP BY a.actionType ORDER BY COUNT(a) DESC")
    List<Object[]> countByActionTypeGrouped(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("SELECT a.entityType, COUNT(a) FROM AuditLog a " +
           "WHERE a.createdAt BETWEEN :from AND :to " +
           "GROUP BY a.entityType ORDER BY COUNT(a) DESC")
    List<Object[]> countByEntityTypeGrouped(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("SELECT a.user.id, a.user.fullName, COUNT(a) FROM AuditLog a " +
           "JOIN a.user " +
           "WHERE a.createdAt BETWEEN :from AND :to " +
           "GROUP BY a.user.id, a.user.fullName " +
           "ORDER BY COUNT(a) DESC")
    List<Object[]> findMostActiveUsers(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    @Query("SELECT FUNCTION('DATE', a.createdAt), COUNT(a) FROM AuditLog a " +
           "WHERE a.createdAt BETWEEN :from AND :to " +
           "GROUP BY FUNCTION('DATE', a.createdAt) ORDER BY FUNCTION('DATE', a.createdAt)")
    List<Object[]> countByDateGrouped(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("SELECT FUNCTION('DAYOFWEEK', a.createdAt), FUNCTION('HOUR', a.createdAt), COUNT(a) " +
           "FROM AuditLog a WHERE a.createdAt BETWEEN :from AND :to " +
           "GROUP BY FUNCTION('DAYOFWEEK', a.createdAt), FUNCTION('HOUR', a.createdAt)")
    List<Object[]> getActivityHeatmap(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // ===== IP-based queries =====

    List<AuditLog> findByIpAddressOrderByCreatedAtDesc(String ipAddress);

    Page<AuditLog> findByIpAddressOrderByCreatedAtDesc(String ipAddress, Pageable pageable);

    // ===== Entity navigation =====

    @Query("SELECT a FROM AuditLog a WHERE a.user.id = :userId " +
           "AND a.id < :currentId ORDER BY a.id DESC")
    List<AuditLog> findPreviousByUser(
            @Param("userId") Long userId,
            @Param("currentId") Long currentId,
            Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.user.id = :userId " +
           "AND a.id > :currentId ORDER BY a.id ASC")
    List<AuditLog> findNextByUser(
            @Param("userId") Long userId,
            @Param("currentId") Long currentId,
            Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.entityType = :entityType " +
           "AND a.entityId = :entityId AND a.id <> :currentId " +
           "ORDER BY a.createdAt DESC")
    List<AuditLog> findOtherByEntity(
            @Param("entityType") String entityType,
            @Param("entityId") Long entityId,
            @Param("currentId") Long currentId,
            Pageable pageable);

    // ===== Compliance queries =====

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.actionType = 'SENSITIVE_ACCESS' " +
           "AND a.createdAt BETWEEN :from AND :to")
    long countSensitiveAccessBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.actionType = 'DELETE' " +
           "AND a.createdAt BETWEEN :from AND :to")
    long countDeletesBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
