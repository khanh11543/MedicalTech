package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long>, JpaSpecificationExecutor<Patient> {

    @Query("SELECT p FROM Patient p WHERE p.user.id = :userId")
    Optional<Patient> findByUserId(@Param("userId") Long userId);

    @Query("SELECT p FROM Patient p JOIN FETCH p.user WHERE p.id = :id")
    Optional<Patient> findByIdWithUser(@Param("id") Long id);

    boolean existsByUserId(Long userId);

    // ==================== SEARCH (DB-LEVEL) ====================

    @Query("SELECT p FROM Patient p JOIN p.user u " +
           "WHERE LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR u.phone LIKE CONCAT('%', :query, '%') " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Patient> searchByNamePhoneEmail(@Param("query") String query, Pageable pageable);

    // ==================== LIST ALL (FILTERED) ====================

    @Query("SELECT p FROM Patient p JOIN p.user u " +
           "WHERE (:search IS NULL OR :search = '' OR " +
           "       LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "       u.phone LIKE CONCAT('%', :search, '%') OR " +
           "       LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:gender IS NULL OR p.gender = :gender) " +
           "AND (:isActive IS NULL OR u.isActive = :isActive) " +
           "AND (:hasInsurance IS NULL OR " +
           "     (:hasInsurance = true AND p.insuranceNumber IS NOT NULL AND p.insuranceNumber != '') OR " +
           "     (:hasInsurance = false AND (p.insuranceNumber IS NULL OR p.insuranceNumber = '')))")
    Page<Patient> findAllWithFilters(
            @Param("search") String search,
            @Param("gender") String gender,
            @Param("isActive") Boolean isActive,
            @Param("hasInsurance") Boolean hasInsurance,
            Pageable pageable);

    // ==================== NEW PATIENTS THIS MONTH ====================

    @Query("SELECT p FROM Patient p JOIN p.user u " +
           "WHERE p.createdAt >= :startOfMonth " +
           "ORDER BY p.createdAt DESC")
    Page<Patient> findNewPatientsThisMonth(@Param("startOfMonth") LocalDateTime startOfMonth, Pageable pageable);

    @Query("SELECT COUNT(p) FROM Patient p WHERE p.createdAt >= :startOfMonth")
    Long countNewPatientsThisMonth(@Param("startOfMonth") LocalDateTime startOfMonth);

    // ==================== FREQUENT PATIENTS ====================

    @Query("SELECT p, COUNT(a) as visitCount FROM Patient p " +
           "JOIN p.user u " +
           "JOIN p.appointments a " +
           "WHERE a.status = 'COMPLETED' " +
           "GROUP BY p " +
           "HAVING COUNT(a) >= :minVisits " +
           "ORDER BY COUNT(a) DESC")
    Page<Object[]> findFrequentPatients(@Param("minVisits") Long minVisits, Pageable pageable);

    // ==================== STATISTICS ====================

    @Query("SELECT COUNT(p) FROM Patient p JOIN p.user u WHERE u.isActive = true")
    Long countActivePatients();

    @Query("SELECT COUNT(p) FROM Patient p JOIN p.user u WHERE u.isActive = false")
    Long countDeactivatedPatients();

    @Query("SELECT COUNT(p) FROM Patient p WHERE p.insuranceNumber IS NOT NULL AND p.insuranceNumber != ''")
    Long countInsuredPatients();

    @Query("SELECT COUNT(p) FROM Patient p WHERE p.insuranceNumber IS NULL OR p.insuranceNumber = ''")
    Long countUninsuredPatients();

    @Query("SELECT COUNT(p) FROM Patient p WHERE p.gender = :gender")
    Long countByGender(@Param("gender") String gender);

    // ==================== MOST VISITED DOCTOR PER PATIENT ====================

    @Query(value = "SELECT a.doctor_id, d_u.full_name, COUNT(*) as cnt " +
                   "FROM appointments a " +
                   "JOIN doctors d ON a.doctor_id = d.id " +
                   "JOIN users d_u ON d.user_id = d_u.id " +
                   "WHERE a.patient_id = :patientId AND a.status = 'COMPLETED' " +
                   "GROUP BY a.doctor_id, d_u.full_name " +
                   "ORDER BY cnt DESC LIMIT 1",
           nativeQuery = true)
    List<Object[]> findMostVisitedDoctor(@Param("patientId") Long patientId);
}


