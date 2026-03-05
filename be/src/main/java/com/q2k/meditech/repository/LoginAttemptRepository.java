package com.q2k.meditech.repository;

import com.q2k.meditech.entity.LoginAttempt;
import com.q2k.meditech.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for LoginAttempt entity
 */
@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long>,
        JpaSpecificationExecutor<LoginAttempt> {

    // ===== Existing methods =====

    @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.email = :email " +
           "AND la.success = false AND la.attemptedAt > :since")
    long countFailedAttemptsByEmailSince(
        @Param("email") String email,
        @Param("since") LocalDateTime since
    );

    @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.ipAddress = :ipAddress " +
           "AND la.success = false AND la.attemptedAt > :since")
    long countFailedAttemptsByIpSince(
        @Param("ipAddress") String ipAddress,
        @Param("since") LocalDateTime since
    );

    @Query("SELECT la FROM LoginAttempt la WHERE la.user = :user " +
           "ORDER BY la.attemptedAt DESC")
    List<LoginAttempt> findRecentAttemptsByUser(
        @Param("user") User user,
        Pageable pageable
    );

    List<LoginAttempt> findByEmailOrderByAttemptedAtDesc(String email);

    void deleteByAttemptedAtBefore(LocalDateTime date);

    // ===== New: Statistics queries =====

    @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.success = :success " +
           "AND la.attemptedAt BETWEEN :from AND :to")
    long countBySuccessBetween(
            @Param("success") boolean success,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(DISTINCT la.ipAddress) FROM LoginAttempt la " +
           "WHERE la.success = :success AND la.attemptedAt BETWEEN :from AND :to")
    long countDistinctIpBySuccessBetween(
            @Param("success") boolean success,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("SELECT FUNCTION('DATE', la.attemptedAt), " +
           "SUM(CASE WHEN la.success = true THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN la.success = false THEN 1 ELSE 0 END) " +
           "FROM LoginAttempt la WHERE la.attemptedAt BETWEEN :from AND :to " +
           "GROUP BY FUNCTION('DATE', la.attemptedAt) " +
           "ORDER BY FUNCTION('DATE', la.attemptedAt)")
    List<Object[]> countByDateGrouped(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("SELECT FUNCTION('HOUR', la.attemptedAt), COUNT(la) FROM LoginAttempt la " +
           "WHERE la.success = false AND la.attemptedAt BETWEEN :from AND :to " +
           "GROUP BY FUNCTION('HOUR', la.attemptedAt) " +
           "ORDER BY COUNT(la) DESC")
    List<Object[]> failedAttemptsByHourGrouped(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // ===== New: IP-based queries =====

    Page<LoginAttempt> findByIpAddressOrderByAttemptedAtDesc(String ipAddress, Pageable pageable);

    @Query("SELECT la.ipAddress, COUNT(la) FROM LoginAttempt la " +
           "WHERE la.success = false AND la.attemptedAt > :since " +
           "GROUP BY la.ipAddress ORDER BY COUNT(la) DESC")
    List<Object[]> findTopFailedIps(
            @Param("since") LocalDateTime since,
            Pageable pageable);

    // ===== New: Geo queries =====

    @Query("SELECT la.geoCountry, COUNT(la) FROM LoginAttempt la " +
           "WHERE la.attemptedAt BETWEEN :from AND :to AND la.geoCountry IS NOT NULL " +
           "GROUP BY la.geoCountry ORDER BY COUNT(la) DESC")
    List<Object[]> countByCountryGrouped(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // ===== New: User lookups =====

    @Query("SELECT la FROM LoginAttempt la WHERE la.user.id = :userId " +
           "ORDER BY la.attemptedAt DESC")
    Page<LoginAttempt> findByUserIdOrderByAttemptedAtDesc(
            @Param("userId") Long userId, Pageable pageable);
}
