package com.q2k.meditech.service;

import com.q2k.meditech.entity.RestoreRecord;
import com.q2k.meditech.entity.enums.RestoreType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Service interface for Restore operations (FR-BACK-004)
 */
public interface RestoreService {

    /**
     * Restore from an existing backup in the system
     * @param backupId Backup ID to restore
     * @param restoreType Restore type (FULL/PARTIAL/TEST)
     * @param items List of components to restore
     * @param password Confirmation password
     * @return RestoreRecord
     */
    RestoreRecord restoreFromBackup(Long backupId, RestoreType restoreType,
                                     List<String> items, String password);

    /**
     * Restore from uploaded file
     * @param file Backup upload file
     * @param restoreType Restore type
     * @param items List of components to restore
     * @param password Confirmation password
     * @return RestoreRecord
     */
    RestoreRecord restoreFromUpload(MultipartFile file, RestoreType restoreType,
                                     List<String> items, String password);

    /**
     * Get running restore progress
     */
    RestoreRecord getRestoreProgress(Long id);

    /**
     * Run test restore (sandbox)
     * @param backupId Backup ID to test
     * @return RestoreRecord with test results
     */
    RestoreRecord testRestore(Long backupId);

    /**
     * Get paginated restore history
     */
    Page<RestoreRecord> getRestoreHistory(Pageable pageable);

    /**
     * Get restore record details
     */
    RestoreRecord getRestoreDetail(Long id);

    /**
     * Get restore overview information
     * @return Map containing: totalRestores, lastRestore, activeRestores
     */
    Map<String, Object> getRestoreSummary();
}
