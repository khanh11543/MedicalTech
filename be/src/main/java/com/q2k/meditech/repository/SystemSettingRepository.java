package com.q2k.meditech.repository;

import com.q2k.meditech.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemSettingRepository extends JpaRepository<SystemSetting, Long> {

    Optional<SystemSetting> findBySettingKey(String settingKey);

    List<SystemSetting> findBySettingGroup(String settingGroup);

    boolean existsBySettingKey(String settingKey);

    void deleteBySettingKey(String settingKey);

    void deleteBySettingGroup(String settingGroup);
}
