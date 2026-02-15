package com.q2k.meditech.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.Customizer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Security Configuration
 * Configures JWT authentication and authorization
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Enable CORS using CorsConfigurationSource bean
                .cors(Customizer.withDefaults())

                // Disable CSRF (since we're using JWT/stateless)
                .csrf(AbstractHttpConfigurer::disable)

                // Stateless session (no session cookies)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Authorization rules
                .authorizeHttpRequests(auth -> auth

                        // These auth endpoints require valid JWT (must come before /auth/**)
                        .requestMatchers("/auth/change-password").authenticated()
                        .requestMatchers("/auth/logout").authenticated()


                        // Public endpoints - no authentication required
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/public/**").permitAll()

                        // Swagger/OpenAPI endpoints
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()

                        // Admin endpoints - require ADMIN role
                        .requestMatchers("/admin/**").hasRole("ADMIN")

                        // Doctor endpoints - require DOCTOR role
                        .requestMatchers("/doctor/**").hasRole("DOCTOR")

                        // Patient endpoints - require PATIENT role
                        .requestMatchers("/patient/**").hasRole("PATIENT")

                        // Receptionist endpoints - require RECEPTIONIST role
                        .requestMatchers("/receptionist/**").hasRole("RECEPTIONIST")

                        // All other requests need authentication
                        .anyRequest().authenticated()
                )

                // Add JWT filter before UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}