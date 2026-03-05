package com.q2k.meditech.repository;

import com.q2k.meditech.entity.PasswordHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PasswordHistoryRepository extends JpaRepository<PasswordHistory, Long> {

    List<PasswordHistory> findTop3ByUserIdOrderByCreatedAtDesc(Long userId);

    void deleteByUserId(Long userId);
}
