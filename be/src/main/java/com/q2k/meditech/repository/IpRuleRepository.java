package com.q2k.meditech.repository;

import com.q2k.meditech.entity.IpRule;
import com.q2k.meditech.entity.enums.IpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IpRuleRepository extends JpaRepository<IpRule, Long>, JpaSpecificationExecutor<IpRule> {

    Optional<IpRule> findByIpAddressAndIsActiveTrue(String ipAddress);

    boolean existsByIpAddressAndIsActiveTrue(String ipAddress);

    List<IpRule> findByRuleTypeAndIsActiveTrueOrderByCreatedAtDesc(String ruleType);

    Page<IpRule> findByStatusAndIsActiveTrueOrderByCreatedAtDesc(IpStatus status, Pageable pageable);

    Page<IpRule> findByRuleTypeAndIsActiveTrueOrderByCreatedAtDesc(String ruleType, Pageable pageable);

    @Query("SELECT COUNT(r) FROM IpRule r WHERE r.status = :status AND r.isActive = true")
    long countByStatusAndActive(@Param("status") IpStatus status);

    @Query("SELECT r FROM IpRule r WHERE r.isActive = true " +
           "AND LOWER(r.ipAddress) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<IpRule> searchByIpAddress(@Param("search") String search, Pageable pageable);

    List<IpRule> findByStatusAndIsActiveTrue(IpStatus status);
}
