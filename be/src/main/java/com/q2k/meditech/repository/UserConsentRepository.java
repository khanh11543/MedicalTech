package com.q2k.meditech.repository;

import com.q2k.meditech.entity.UserConsent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserConsentRepository extends JpaRepository<UserConsent, Long> {

    List<UserConsent> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<UserConsent> findByConsentTypeOrderByCreatedAtDesc(String consentType);

    List<UserConsent> findByConsentGivenOrderByCreatedAtDesc(Boolean consentGiven);

    Optional<UserConsent> findByUserIdAndConsentType(Long userId, String consentType);

    Long countByConsentGiven(Boolean consentGiven);
}
