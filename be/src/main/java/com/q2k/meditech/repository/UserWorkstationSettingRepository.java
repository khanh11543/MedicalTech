package com.q2k.meditech.repository;

import com.q2k.meditech.entity.UserWorkstationSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserWorkstationSettingRepository extends JpaRepository<UserWorkstationSetting, Long> {

    Optional<UserWorkstationSetting> findByUserId(Long userId);
}
