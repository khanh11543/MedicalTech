package com.q2k.meditech.repository;

import com.q2k.meditech.entity.UserDisplaySetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserDisplaySettingRepository extends JpaRepository<UserDisplaySetting, Long> {

    Optional<UserDisplaySetting> findByUserId(Long userId);
}
