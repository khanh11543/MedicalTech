package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.RestoreType;
import lombok.*;

import java.util.List;

/**
 * DTO for Restore request (FR-BACK-004)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestoreRequestDTO {

    /** ID của backup cần restore */
    private Long backupId;

    /** Loại restore: FULL, PARTIAL, TEST */
    @Builder.Default
    private RestoreType restoreType = RestoreType.FULL;

    /** Danh sách items cần restore (dùng cho PARTIAL) */
    private List<String> items;

    /** Mật khẩu giải mã (nếu backup được mã hóa) */
    private String password;

    /** Có tạo backup trước khi restore không */
    @Builder.Default
    private Boolean createPreRestoreBackup = true;
}
