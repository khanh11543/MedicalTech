package com.q2k.meditech.repository;

import com.q2k.meditech.entity.UserPrivacySetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserPrivacySettingRepository extends JpaRepository<UserPrivacySetting, Long> {

    Optional<UserPrivacySetting> findByUserId(Long userId);
}
