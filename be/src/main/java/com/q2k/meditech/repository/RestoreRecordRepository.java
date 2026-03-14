package com.q2k.meditech.repository;

import com.q2k.meditech.entity.RestoreRecord;
import com.q2k.meditech.entity.enums.RestoreStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestoreRecordRepository extends JpaRepository<RestoreRecord, Long> {

    /**
     * Paginated restore history
     */
    Page<RestoreRecord> findAllByOrderByStartedAtDesc(Pageable pageable);

    /**
     * Find running restores
     */
    List<RestoreRecord> findByStatus(RestoreStatus status);

    /**
     * Find restore by backup ID
     */
    List<RestoreRecord> findByBackupRecordIdOrderByStartedAtDesc(Long backupRecordId);

    /**
     * Count restore by status
     */
    Long countByStatus(RestoreStatus status);
}
