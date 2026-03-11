package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Content;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ContentRepository extends JpaRepository<Content, Long> {

    Page<Content> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Content> findByTypeOrderByCreatedAtDesc(Content.ContentType type, Pageable pageable);

    Page<Content> findByStatusOrderByCreatedAtDesc(Content.ContentStatus status, Pageable pageable);

    Page<Content> findByTypeAndStatusOrderByCreatedAtDesc(Content.ContentType type, Content.ContentStatus status, Pageable pageable);

    @Query("SELECT c FROM Content c WHERE " +
           "LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.author) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.summary) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY c.createdAt DESC")
    Page<Content> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    boolean existsBySlug(String slug);

    Page<Content> findByTypeAndStatusOrderByIsPinnedDescCreatedAtDesc(
            Content.ContentType type, Content.ContentStatus status, Pageable pageable);
}
