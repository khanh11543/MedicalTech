package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Doctor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long>, JpaSpecificationExecutor<Doctor> {

    /**
     * Search doctors with filters (for public search)
     * Only returns APPROVED and available doctors
     */
    @Query("SELECT DISTINCT d FROM Doctor d " +
            "LEFT JOIN DoctorSpecialty ds ON ds.doctor = d " +
            "LEFT JOIN d.user u " +
            "WHERE d.verificationStatus = 'APPROVED' " +
            "AND d.isAvailable = true " +
            "AND (:query IS NULL OR " +
            "     LOWER(d.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "     LOWER(d.hospitalAffiliation) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "AND (:specialtyId IS NULL OR ds.specialty.id = :specialtyId) " +
            "AND (:city IS NULL OR LOWER(d.officeAddress) LIKE LOWER(CONCAT('%', :city, '%'))) " +
            "AND (:minFee IS NULL OR d.consultationFee >= :minFee) " +
            "AND (:maxFee IS NULL OR d.consultationFee <= :maxFee)")
    Page<Doctor> searchDoctors(
            @Param("query") String query,
            @Param("specialtyId") Integer specialtyId,
            @Param("city") String city,
            @Param("minFee") BigDecimal minFee,
            @Param("maxFee") BigDecimal maxFee,
            Pageable pageable
    );
    @Query("SELECT d FROM Doctor d WHERE d.user.id = :userId")
    Optional<Doctor> findByUserId(@Param("userId") Long userId);

    @Query("SELECT d FROM Doctor d JOIN FETCH d.user WHERE d.id = :id")
    Optional<Doctor> findByIdWithUser(@Param("id") Long id);

    List<Doctor> findBySpecialization(String specialization);

    List<Doctor> findByIsAvailableTrue();

    /**
     * Find doctor by ID with verification check (for public view)
     */
    @Query("SELECT d FROM Doctor d " +
            "LEFT JOIN FETCH d.user u " +
            "WHERE d.id = :doctorId " +
            "AND d.verificationStatus = 'APPROVED' " +
            "AND d.isAvailable = true")
    Optional<Doctor> findByIdForPublic(@Param("doctorId") Long doctorId);

    /**
     * Find doctor by ID (admin view - all statuses)
     */
    Optional<Doctor> findById(Long id);

    /**
     * Check if doctor exists by license number
     */
    boolean existsByLicenseNumber(String licenseNumber);
}