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
     * Lịch sử restore phân trang
     */
    Page<RestoreRecord> findAllByOrderByStartedAtDesc(Pageable pageable);

    /**
     * Tìm restore đang chạy
     */
    List<RestoreRecord> findByStatus(RestoreStatus status);

    /**
     * Tìm restore theo backup ID
     */
    List<RestoreRecord> findByBackupRecordIdOrderByStartedAtDesc(Long backupRecordId);

    /**
     * Đếm restore theo status
     */
    Long countByStatus(RestoreStatus status);
}
