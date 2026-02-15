package com.q2k.meditech.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * RestTemplate Configuration
 * Configures HTTP client for external API calls (MoMo, etc.)
 * 
 * NOTE: Do NOT define a custom ObjectMapper bean here.
 * Spring Boot auto-configures ObjectMapper with JavaTimeModule, JSR310, etc.
 * Overriding it will break LocalDateTime serialization in DTOs.
 */
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
