package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * ServiceResultAttachment — file attachments for service results
 * (e.g. X-ray images, PDF reports, lab result scans).
 */
@Entity
@Table(name = "service_result_attachments", indexes = {
    @Index(name = "idx_sra_result_id", columnList = "service_result_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ServiceResultAttachment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_result_id", nullable = false)
    private ServiceResult serviceResult;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_url", nullable = false, length = 2048)
    private String fileUrl;

    @Column(name = "file_type", length = 100)
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;
}
