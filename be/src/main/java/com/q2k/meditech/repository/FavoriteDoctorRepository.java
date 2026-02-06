package com.q2k.meditech.repository;

import com.q2k.meditech.entity.FavoriteDoctor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FavoriteDoctorRepository extends JpaRepository<FavoriteDoctor, Long> {

    Page<FavoriteDoctor> findByPatientIdOrderByCreatedAtDesc(Long patientId, Pageable pageable);

    Optional<FavoriteDoctor> findByPatientIdAndDoctorId(Long patientId, Long doctorId);

    boolean existsByPatientIdAndDoctorId(Long patientId, Long doctorId);

    void deleteByIdAndPatientId(Long id, Long patientId);
}
