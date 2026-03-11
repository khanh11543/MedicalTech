package com.q2k.meditech.repository;

import com.q2k.meditech.entity.DoctorSpecialty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorSpecialtyRepository extends JpaRepository<DoctorSpecialty, Long> {

    /**
     * Find all specialties for a doctor
     */
    @Query("SELECT ds FROM DoctorSpecialty ds " +
            "JOIN FETCH ds.specialty s " +
            "WHERE ds.doctor.id = :doctorId " +
            "ORDER BY ds.isPrimary DESC, s.name ASC")
    List<DoctorSpecialty> findByDoctorIdWithSpecialty(@Param("doctorId") Long doctorId);

    /**
     * Batch find specialties for multiple doctors (avoids N+1)
     */
    @Query("SELECT ds FROM DoctorSpecialty ds " +
            "JOIN FETCH ds.specialty s " +
            "WHERE ds.doctor.id IN :doctorIds " +
            "ORDER BY ds.isPrimary DESC, s.name ASC")
    List<DoctorSpecialty> findByDoctorIdInWithSpecialty(@Param("doctorIds") List<Long> doctorIds);

    /**
     * Find primary specialty for a doctor
     */
    @Query("SELECT ds FROM DoctorSpecialty ds " +
            "JOIN FETCH ds.specialty s " +
            "WHERE ds.doctor.id = :doctorId AND ds.isPrimary = true")
    DoctorSpecialty findPrimarySpecialty(@Param("doctorId") Long doctorId);

    /**
     * Find all doctors for a specialty
     */
    List<DoctorSpecialty> findBySpecialtyId(Long specialtyId);
}
