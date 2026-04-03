package com.q2k.meditech.repository;

import com.q2k.meditech.entity.ServiceResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ServiceResultRepository extends JpaRepository<ServiceResult, Long> {

    Optional<ServiceResult> findByServiceOrderId(Long serviceOrderId);

    @Query("SELECT sr FROM ServiceResult sr " +
           "LEFT JOIN FETCH sr.attachments " +
           "WHERE sr.serviceOrder.id = :serviceOrderId")
    Optional<ServiceResult> findByServiceOrderIdWithAttachments(@Param("serviceOrderId") Long serviceOrderId);

    boolean existsByServiceOrderId(Long serviceOrderId);
}
