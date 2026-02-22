package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByDoctorIdOrderByCreatedAtDesc(Long doctorId, Pageable pageable);

    Optional<Review> findByAppointmentId(Long appointmentId);

    boolean existsByAppointmentId(Long appointmentId);

    /**
     * Find all reviews, ordered by creation date descending (for admin)
     */
    Page<Review> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Find reviews filtered by visibility status
     */
    Page<Review> findByIsVisibleOrderByCreatedAtDesc(Boolean isVisible, Pageable pageable);

    /**
     * Find reviews filtered by rating
     */
    Page<Review> findByRatingOrderByCreatedAtDesc(Integer rating, Pageable pageable);

    /**
     * Search reviews by doctor name, patient user name/email
     */
    @Query("SELECT r FROM Review r " +
           "LEFT JOIN r.doctor d " +
           "LEFT JOIN r.patient p " +
           "LEFT JOIN p.user pu " +
           "WHERE LOWER(d.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(pu.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(pu.email) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(r.comment) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY r.createdAt DESC")
    Page<Review> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
}
