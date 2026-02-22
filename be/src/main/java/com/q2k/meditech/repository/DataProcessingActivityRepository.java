package com.q2k.meditech.repository;

import com.q2k.meditech.entity.DataProcessingActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DataProcessingActivityRepository extends JpaRepository<DataProcessingActivity, Long> {

    List<DataProcessingActivity> findByIsActiveOrderByCreatedAtDesc(Boolean isActive);

    List<DataProcessingActivity> findByActivityNameContainingIgnoreCaseOrderByCreatedAtDesc(String name);

    List<DataProcessingActivity> findByLegalBasisOrderByCreatedAtDesc(String legalBasis);
}
