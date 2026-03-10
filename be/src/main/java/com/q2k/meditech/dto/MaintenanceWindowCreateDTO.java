package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.q2k.meditech.entity.enums.MaintenanceType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for creating/scheduling a Maintenance Window (FR-BACK-005)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceWindowCreateDTO {

    /** Tiêu đề bảo trì */
    private String title;

    /** Mô tả chi tiết */
    private String description;

    /** Loại bảo trì */
    private MaintenanceType maintenanceType;

    /** Thời gian bắt đầu */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startTime;

    /** Thời gian kết thúc */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endTime;

    /** Thông báo hiển thị cho người dùng */
    private String message;

    /** Số phút thông báo trước khi bắt đầu */
    @Builder.Default
    private Integer notifyBeforeMinutes = 30;

    /** Cho phép admin truy cập trong thời gian bảo trì */
    @Builder.Default
    private Boolean allowAdminAccess = true;

    /** Danh sách IP được phép truy cập */
    private List<String> whitelistedIps;

    /** Mức độ ảnh hưởng */
    private String impact;

    /** Các dịch vụ bị ảnh hưởng */
    private String affectedServices;
}
