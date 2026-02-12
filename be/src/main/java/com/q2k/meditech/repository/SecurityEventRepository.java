package com.q2k.meditech.repository;

import com.q2k.meditech.entity.SecurityEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {
    
    List<SecurityEvent> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<SecurityEvent> findByEventTypeOrderByCreatedAtDesc(String eventType);
    
    List<SecurityEvent> findBySeverityOrderByCreatedAtDesc(String severity);
    
    List<SecurityEvent> findByIpAddressOrderByCreatedAtDesc(String ipAddress);
    
    List<SecurityEvent> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime from, LocalDateTime to);
}
