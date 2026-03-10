package com.q2k.meditech.repository;

import com.q2k.meditech.entity.UserPrinterSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserPrinterSettingRepository extends JpaRepository<UserPrinterSetting, Long> {

    Optional<UserPrinterSetting> findByUserId(Long userId);
}
