package com.q2k.meditech.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security Configuration
 * 
 * TEMPORARY: Currently disabling security for testing
 * TODO: Enable JWT authentication after implementing auth APIs
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF (since we're using JWT/stateless)
                .csrf(AbstractHttpConfigurer::disable)
                
                // Stateless session (no session cookies)
                .sessionManagement(session -> 
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                
                // TEMPORARY: Permit all requests (for testing only)
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()
                );
        
        /* 
         * TODO: Replace above with this when JWT is implemented:
         * 
         * .authorizeHttpRequests(auth -> auth
         *     // Public endpoints
         *     .requestMatchers("/auth/**", "/public/**").permitAll()
         *     .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
         *     
         *     // Admin endpoints
         *     .requestMatchers("/admin/**").hasRole("ADMIN")
         *     
         *     // Doctor endpoints
         *     .requestMatchers("/doctor/**").hasRole("DOCTOR")
         *     
         *     // Patient endpoints
         *     .requestMatchers("/patient/**").hasRole("PATIENT")
         *     
         *     // Receptionist endpoints
         *     .requestMatchers("/receptionist/**").hasRole("RECEPTIONIST")
         *     
         *     // All other requests need authentication
         *     .anyRequest().authenticated()
         * )
         * 
         * // Add JWT filter
         * .addFilterBefore(jwtAuthenticationFilter(), 
         *                  UsernamePasswordAuthenticationFilter.class);
         */
        
        return http.build();
    }
}