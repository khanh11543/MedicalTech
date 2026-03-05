package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_printer_settings", indexes = {
        @Index(name = "idx_user_printer_settings_user", columnList = "user_id", unique = true)
})
public class UserPrinterSetting extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "default_printer", length = 255)
    private String defaultPrinter;

    @Builder.Default
    @Column(name = "auto_print_receipt", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean autoPrintReceipt = false;

    @Builder.Default
    @Column(name = "paper_size", length = 20)
    private String paperSize = "A4";

    @Builder.Default
    @Column(name = "print_copies", columnDefinition = "INT DEFAULT 1")
    private Integer printCopies = 1;
}
