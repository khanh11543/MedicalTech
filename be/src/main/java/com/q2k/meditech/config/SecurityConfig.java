package com.q2k.meditech.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
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

import java.util.Map;

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
    private final MaintenanceFilter maintenanceFilter;

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                // Enable CORS using CorsConfigurationSource bean
                                .cors(Customizer.withDefaults())

                                // Disable CSRF (since we're using JWT/stateless)
                                .csrf(AbstractHttpConfigurer::disable)

                                // Stateless session (no session cookies)
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                                // Authorization rules
                                .authorizeHttpRequests(auth -> auth

                                                // These auth endpoints require valid JWT (must come before /auth/**)
                                                .requestMatchers("/auth/change-password").authenticated()
                                                .requestMatchers("/auth/logout").authenticated()

                                                // Public endpoints - no authentication required
                                                .requestMatchers("/auth/**").permitAll()
                                                .requestMatchers("/public/**").permitAll()
                                                .requestMatchers("/uploads/**").permitAll()
                                                .requestMatchers("/avatars/**").permitAll()

                                                // Swagger/OpenAPI endpoints
                                                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**",
                                                                "/swagger-ui.html")
                                                .permitAll()

                        // Static files (avatars, uploads)
                        .requestMatchers("/uploads/**").permitAll()

                        // WebSocket endpoint
                        .requestMatchers("/ws/**").permitAll()

                        // Swagger/OpenAPI endpoints
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()

                        // Payment Management - accessible by ADMIN and RECEPTIONIST
                        .requestMatchers("/admin/payments/**").hasAnyRole("ADMIN", "RECEPTIONIST")

                        // Backup & Maintenance - ADMIN only
                        .requestMatchers("/admin/backups/**").hasRole("ADMIN")
                        .requestMatchers("/admin/restore/**").hasRole("ADMIN")
                        .requestMatchers("/admin/maintenance/**").hasRole("ADMIN")
                        .requestMatchers("/admin/optimization/**").hasRole("ADMIN")

                        // Admin endpoints - require ADMIN role
                        .requestMatchers("/admin/**").hasRole("ADMIN")

                                                // Patient endpoints - require PATIENT role
                                                .requestMatchers("/patient/**").hasRole("PATIENT")

                                                // Receptionist endpoints - require RECEPTIONIST role
                                                .requestMatchers("/receptionist/**").hasRole("RECEPTIONIST")

                                                // All other requests need authentication
                                                .anyRequest().authenticated())

                                // Handle authentication/authorization errors properly
                                .exceptionHandling(ex -> ex
                                                // Return 401 for unauthenticated requests (e.g. expired/missing JWT)
                                                .authenticationEntryPoint((request, response, authException) -> {
                                                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                                        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                                                        new ObjectMapper().writeValue(response.getOutputStream(),
                                                                        Map.of("status", 401, "error", "Unauthorized",
                                                                                        "message",
                                                                                        "Authentication required. Please login again."));
                                                })
                                                // Return 403 for authenticated users lacking permissions
                                                .accessDeniedHandler((request, response, accessDeniedException) -> {
                                                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                                                        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                                                        new ObjectMapper().writeValue(response.getOutputStream(),
                                                                        Map.of("status", 403, "error", "Forbidden",
                                                                                        "message",
                                                                                        "Access denied. Insufficient permissions."));
                                                }))

                // Handle authentication/authorization errors with proper CORS headers
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            new ObjectMapper().writeValue(response.getOutputStream(),
                                    Map.of("status", 401, "message", "Unauthorized: " + authException.getMessage()));
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            new ObjectMapper().writeValue(response.getOutputStream(),
                                    Map.of("status", 403, "message", "Access Denied: " + accessDeniedException.getMessage()));
                        })
                )

                // Add JWT filter before UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

                // Add Maintenance filter after JWT (so we can check roles)
                .addFilterAfter(maintenanceFilter, JwtAuthenticationFilter.class);

                return http.build();
        }


    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}