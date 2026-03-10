package com.q2k.meditech.repository;

import com.q2k.meditech.entity.ActivityLog;
import com.q2k.meditech.entity.enums.ActivityType;
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
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long>, JpaSpecificationExecutor<ActivityLog> {

    Page<ActivityLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<ActivityLog> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<ActivityLog> findByActivityTypeOrderByCreatedAtDesc(ActivityType activityType, Pageable pageable);

    List<ActivityLog> findByResourceTypeAndResourceIdOrderByCreatedAtDesc(
            String resourceType, Long resourceId);

    Page<ActivityLog> findByCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime from, LocalDateTime to, Pageable pageable);

    @Query("SELECT a FROM ActivityLog a WHERE a.user.id = :userId " +
           "AND a.createdAt BETWEEN :from AND :to ORDER BY a.createdAt DESC")
    List<ActivityLog> findUserActivityTimeline(
            @Param("userId") Long userId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(a) FROM ActivityLog a WHERE a.createdAt >= :since")
    long countSince(@Param("since") LocalDateTime since);

    @Query("SELECT a.activityType, COUNT(a) FROM ActivityLog a " +
           "WHERE a.createdAt BETWEEN :from AND :to " +
           "GROUP BY a.activityType ORDER BY COUNT(a) DESC")
    List<Object[]> countByActivityType(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("SELECT a.user.id, a.user.fullName, COUNT(a) FROM ActivityLog a " +
           "JOIN a.user " +
           "WHERE a.createdAt BETWEEN :from AND :to " +
           "GROUP BY a.user.id, a.user.fullName " +
           "ORDER BY COUNT(a) DESC")
    List<Object[]> findMostActiveUsers(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);
}
