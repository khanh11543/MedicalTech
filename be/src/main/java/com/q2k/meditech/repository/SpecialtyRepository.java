package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Specialty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpecialtyRepository extends JpaRepository<Specialty, Long> {

    /**
     * Find specialties by name containing keyword (case-insensitive)
     */
    @Query("SELECT s FROM Specialty s WHERE " +
            "(:query IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "AND (:isActive IS NULL OR s.isActive = :isActive) " +
            "ORDER BY s.name ASC")
    List<Specialty> searchSpecialties(@Param("query") String query, @Param("isActive") Boolean isActive);

    /**
     * Find all active specialties
     */
    List<Specialty> findByIsActiveTrueOrderByNameAsc();

    java.util.Optional<Specialty> findByName(String name);

    @Query("SELECT s FROM Specialty s WHERE LOWER(s.name) = LOWER(:name)")
    java.util.Optional<Specialty> findByNameIgnoreCase(@Param("name") String name);

    java.util.Optional<Specialty> findBySlug(String slug);
}
