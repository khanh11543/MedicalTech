package com.q2k.meditech.repository;

import com.q2k.meditech.entity.UserConsent;
import com.q2k.meditech.entity.enums.ConsentStatus;
import com.q2k.meditech.entity.enums.ConsentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserConsentRepository extends JpaRepository<UserConsent, Long>,
        JpaSpecificationExecutor<UserConsent> {

    @Query("SELECT c FROM UserConsent c JOIN FETCH c.user WHERE c.id = :id")
    java.util.Optional<UserConsent> findByIdWithUser(@Param("id") Long id);

    @Query("SELECT c FROM UserConsent c JOIN FETCH c.user WHERE c.user.id = :userId ORDER BY c.consentDate DESC")
    List<UserConsent> findByUserIdWithUser(@Param("userId") Long userId);

    List<UserConsent> findByUserIdOrderByConsentDateDesc(Long userId);

    @Query("SELECT COUNT(c) FROM UserConsent c WHERE c.status = :status")
    long countByStatus(@Param("status") ConsentStatus status);

    @Query("SELECT COUNT(DISTINCT c.user.id) FROM UserConsent c")
    long countDistinctUsers();

    @Query("SELECT COUNT(c) FROM UserConsent c WHERE c.consentDate >= :since AND c.status = 'ACCEPTED'")
    long countRecentConsents(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(c) FROM UserConsent c WHERE c.revokedDate >= :since")
    long countRecentRevocations(@Param("since") LocalDateTime since);

    @Query("SELECT c.consentType, COUNT(c) FROM UserConsent c WHERE c.status = 'ACCEPTED' GROUP BY c.consentType")
    List<Object[]> countActiveConsentsByType();

    @Query("SELECT DISTINCT c.user.id FROM UserConsent c WHERE c.status = 'ACCEPTED' " +
            "GROUP BY c.user.id HAVING COUNT(DISTINCT c.consentType) = :totalTypes")
    List<Long> findUsersWithFullConsent(@Param("totalTypes") long totalTypes);

    @Query("SELECT c FROM UserConsent c JOIN FETCH c.user WHERE c.consentDate BETWEEN :from AND :to ORDER BY c.consentDate ASC")
    List<UserConsent> findByConsentDateBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT c FROM UserConsent c JOIN FETCH c.user WHERE c.consentDate BETWEEN :from AND :to AND c.consentType = :type ORDER BY c.consentDate ASC")
    List<UserConsent> findByConsentDateBetweenAndType(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, @Param("type") ConsentType type);
}
