package com.q2k.meditech.repository;

import com.q2k.meditech.entity.TimeSlotTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TimeSlotTemplateRepository extends JpaRepository<TimeSlotTemplate, Long> {
    
    /**
     * Find all active templates
     */
    List<TimeSlotTemplate> findByIsActiveTrueOrderByTemplateNameAsc();
    
    /**
     * Find all templates
     */
    List<TimeSlotTemplate> findAllByOrderByTemplateNameAsc();
    
    /**
     * Check if template name exists
     */
    boolean existsByTemplateName(String templateName);
    
    /**
     * Check if template name exists excluding one ID
     */
    boolean existsByTemplateNameAndIdNot(String templateName, Long id);
    
    /**
     * Find template by name
     */
    Optional<TimeSlotTemplate> findByTemplateName(String templateName);
}
