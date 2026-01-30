package com.q2k.meditech.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * JPA Configuration
 * Enable JPA Auditing for automatic createdAt/updatedAt timestamps
 */
@Configuration
@EnableJpaAuditing
public class JpaConfig {
    // JPA Auditing is now enabled
    // BaseEntity's @CreatedDate and @LastModifiedDate will work automatically
}