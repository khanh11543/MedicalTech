package com.q2k.meditech.repository;

import com.q2k.meditech.entity.TrustedDevice;
import com.q2k.meditech.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface TrustedDeviceRepository extends JpaRepository<TrustedDevice, Long> {

    @Query("""
            SELECT td FROM TrustedDevice td
            WHERE td.user = :user
              AND td.deviceId = :deviceId
              AND td.tokenHash = :tokenHash
              AND td.revokedAt IS NULL
              AND td.expiresAt > :now
            """)
    Optional<TrustedDevice> findActive(
            @Param("user") User user,
            @Param("deviceId") String deviceId,
            @Param("tokenHash") String tokenHash,
            @Param("now") LocalDateTime now
    );

    @Modifying
    @Query("""
            UPDATE TrustedDevice td SET td.revokedAt = :now
            WHERE td.user = :user AND td.deviceId = :deviceId AND td.revokedAt IS NULL
            """)
    void revokeByUserAndDevice(@Param("user") User user, @Param("deviceId") String deviceId, @Param("now") LocalDateTime now);
}

