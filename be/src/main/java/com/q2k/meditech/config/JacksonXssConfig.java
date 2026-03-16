package com.q2k.meditech.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Jackson configuration to register XSS sanitization for all String fields
 * in JSON request bodies. Uses a customizer so it doesn't override
 * Spring Boot's auto-configured ObjectMapper.
 */
@Configuration
public class JacksonXssConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer xssCustomizer() {
        return builder -> {
            SimpleModule xssModule = new SimpleModule("XssProtectionModule");
            xssModule.addDeserializer(String.class, new XssStringDeserializer());
            builder.modulesToInstall(xssModule);
        };
    }
}
