package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByDoctorIdOrderByCreatedAtDesc(Long doctorId, Pageable pageable);

    Optional<Review> findByAppointmentId(Long appointmentId);

    boolean existsByAppointmentId(Long appointmentId);

    Page<Review> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Review> findByIsVisibleOrderByCreatedAtDesc(Boolean isVisible, Pageable pageable);

    Page<Review> findByRatingOrderByCreatedAtDesc(Integer rating, Pageable pageable);

    @Query("SELECT r FROM Review r " +
           "LEFT JOIN FETCH r.doctor d " +
           "LEFT JOIN FETCH r.patient p " +
           "LEFT JOIN FETCH p.user pu " +
           "WHERE (d IS NOT NULL AND LOWER(d.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "OR LOWER(pu.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(pu.email) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(r.comment) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY r.createdAt DESC")
    Page<Review> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.doctor.id = :doctorId AND r.createdAt >= :since")
    Long countByDoctorIdAndCreatedAtAfter(
            @Param("doctorId") Long doctorId,
            @Param("since") java.time.LocalDateTime since);

    @Query(value = "SELECT r FROM Review r " +
           "LEFT JOIN FETCH r.doctor d " +
           "LEFT JOIN FETCH r.patient p " +
           "LEFT JOIN FETCH p.user " +
           "LEFT JOIN FETCH d.doctorSpecialties ds " +
           "LEFT JOIN FETCH ds.specialty " +
           "WHERE r.isVisible = true ORDER BY r.createdAt DESC",
           countQuery = "SELECT COUNT(r) FROM Review r WHERE r.isVisible = true")
    Page<Review> findByIsVisibleTrueOrderByCreatedAtDesc(Pageable pageable);

    @Query(value = "SELECT r FROM Review r " +
           "LEFT JOIN FETCH r.doctor d " +
           "LEFT JOIN FETCH r.patient p " +
           "LEFT JOIN FETCH p.user " +
           "LEFT JOIN FETCH d.doctorSpecialties ds " +
           "LEFT JOIN FETCH ds.specialty " +
           "WHERE r.doctor.id = :doctorId AND r.isVisible = true ORDER BY r.createdAt DESC",
           countQuery = "SELECT COUNT(r) FROM Review r WHERE r.doctor.id = :doctorId AND r.isVisible = true")
    Page<Review> findByDoctorIdAndIsVisibleTrueOrderByCreatedAtDesc(@Param("doctorId") Long doctorId, Pageable pageable);

    // Rating breakdown for a doctor (counts per star value)
    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.doctor.id = :doctorId GROUP BY r.rating")
    List<Object[]> countReviewsByRatingForDoctor(@Param("doctorId") Long doctorId);
}
