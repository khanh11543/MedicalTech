package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Notification;
import com.q2k.meditech.entity.enums.NotificationPriority;
import com.q2k.meditech.entity.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long>, JpaSpecificationExecutor<Notification> {

    // ==================== Basic queries (existing) ====================

    Page<Notification> findByUserIdAndArchivedAtIsNullOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Notification> findByUserIdAndIsReadAndArchivedAtIsNullOrderByCreatedAtDesc(Long userId, Boolean isRead, Pageable pageable);

    Long countByUserIdAndIsRead(Long userId, Boolean isRead);

    /**
     * Find notifications by reference type and reference ID
     */
    @Query("SELECT n FROM Notification n WHERE n.referenceType = :referenceType AND n.referenceId = :referenceId ORDER BY n.createdAt DESC")
    List<Notification> findByReferenceTypeAndReferenceId(@Param("referenceType") String referenceType, @Param("referenceId") Long referenceId);

    // ==================== Filter by type ====================

    Page<Notification> findByUserIdAndTypeAndArchivedAtIsNullOrderByCreatedAtDesc(
            Long userId, NotificationType type, Pageable pageable);

    Page<Notification> findByUserIdAndTypeAndIsReadAndArchivedAtIsNullOrderByCreatedAtDesc(
            Long userId, NotificationType type, Boolean isRead, Pageable pageable);

    // ==================== Unread counts ====================

    Long countByUserIdAndIsReadAndArchivedAtIsNull(Long userId, Boolean isRead);

    Long countByUserIdAndIsReadAndTypeAndArchivedAtIsNull(Long userId, Boolean isRead, NotificationType type);

    // ==================== Mark all as read ====================

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :now " +
           "WHERE n.user.id = :userId AND n.isRead = false AND n.archivedAt IS NULL")
    int markAllAsReadByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    // ==================== Archive ====================

    @Query("SELECT n FROM Notification n WHERE n.archivedAt IS NULL AND n.createdAt < :threshold")
    List<Notification> findNotificationsToArchive(@Param("threshold") LocalDateTime threshold);

    @Modifying
    @Query("UPDATE Notification n SET n.archivedAt = :now WHERE n.archivedAt IS NULL AND n.createdAt < :threshold")
    int archiveOldNotifications(@Param("now") LocalDateTime now, @Param("threshold") LocalDateTime threshold);

    // ==================== Overdue / Urgent queries ====================

    /**
     * Find unacknowledged URGENT notifications for a user
     */
    Page<Notification> findByUserIdAndPriorityAndAcknowledgedAndArchivedAtIsNullOrderByCreatedAtDesc(
            Long userId, NotificationPriority priority, Boolean acknowledged, Pageable pageable);
}
