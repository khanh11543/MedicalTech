package com.q2k.meditech.repository;

import com.q2k.meditech.entity.MedicalService;
import com.q2k.meditech.entity.enums.ServiceCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalServiceRepository extends JpaRepository<MedicalService, Long> {

    List<MedicalService> findByActiveTrueOrderByServiceNameAsc();

    List<MedicalService> findByCategoryAndActiveTrueOrderByServiceNameAsc(ServiceCategory category);
}
