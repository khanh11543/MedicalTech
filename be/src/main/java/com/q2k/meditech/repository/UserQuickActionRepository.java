package com.q2k.meditech.repository;

import com.q2k.meditech.entity.UserQuickAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserQuickActionRepository extends JpaRepository<UserQuickAction, Long> {

    List<UserQuickAction> findByUserIdOrderBySortOrderAsc(Long userId);

    void deleteByUserId(Long userId);
}
