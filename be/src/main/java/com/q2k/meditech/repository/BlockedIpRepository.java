package com.q2k.meditech.repository;

import com.q2k.meditech.entity.BlockedIp;
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
import java.util.Optional;

@Repository
public interface BlockedIpRepository extends JpaRepository<BlockedIp, Long>, JpaSpecificationExecutor<BlockedIp> {

    Optional<BlockedIp> findByIpAddressAndIsActiveTrue(String ipAddress);

    boolean existsByIpAddressAndIsActiveTrue(String ipAddress);

    List<BlockedIp> findByIsActiveTrueOrderByBlockedAtDesc();

    Page<BlockedIp> findByIsActiveTrueOrderByBlockedAtDesc(Pageable pageable);

    @Query("SELECT COUNT(b) FROM BlockedIp b WHERE b.isActive = true")
    long countActiveBlocked();

    @Query("SELECT COUNT(b) FROM BlockedIp b WHERE b.isActive = true AND b.isAutoBlocked = true")
    long countActiveAutoBlocked();

    @Query("SELECT COUNT(b) FROM BlockedIp b WHERE b.isActive = true AND b.isAutoBlocked = true " +
           "AND b.blockedAt >= :since")
    long countAutoBlockedSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(b) FROM BlockedIp b WHERE b.isActive = true " +
           "AND (b.isAutoBlocked = false OR b.isAutoBlocked IS NULL)")
    long countManuallyBlocked();

    @Query("SELECT COUNT(b) FROM BlockedIp b WHERE b.isActive = true " +
           "AND b.blockType = com.q2k.meditech.entity.enums.BlockType.TEMPORARY")
    long countTemporaryBlocks();

    @Query("SELECT b FROM BlockedIp b WHERE b.isActive = true " +
           "AND b.expiresAt IS NOT NULL AND b.expiresAt <= :now")
    List<BlockedIp> findExpiredBlocks(@Param("now") LocalDateTime now);

    List<BlockedIp> findByBlockedByOrderByBlockedAtDesc(User blockedBy);

    @Query("SELECT b FROM BlockedIp b WHERE b.isActive = true " +
           "AND LOWER(b.ipAddress) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<BlockedIp> searchActiveByIpAddress(@Param("search") String search, Pageable pageable);
}
