package com.q2k.meditech.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * JWT Service for token generation and validation
 */
@Service
@Slf4j
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration; // milliseconds

    @Value("${jwt.refresh-expiration}")
    private Long refreshExpiration; // milliseconds

    @Value("${jwt.mfa-expiration:300000}")
    private Long mfaExpiration; // milliseconds (default 5 minutes)

    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Generate access token
     */
    public String generateAccessToken(UserDetails userDetails, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("roles", userDetails.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toList()));
        
        return createToken(claims, userDetails.getUsername(), expiration);
    }

    /**
     * Generate refresh token
     */
    public String generateRefreshToken(String username, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("type", "refresh");
        claims.put("jti", java.util.UUID.randomUUID().toString());
        
        return createToken(claims, username, refreshExpiration);
    }

    /**
     * Generate a short-lived token used only to complete MFA login.
     */
    public String generateMfaLoginToken(String username, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("type", "mfa_login");
        return createToken(claims, username, mfaExpiration);
    }

    public boolean validateMfaLoginToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            String type = claims.get("type", String.class);
            return "mfa_login".equals(type) && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Create JWT token
     */
    private String createToken(Map<String, Object> claims, String subject, Long validityPeriod) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + validityPeriod);

        return Jwts.builder()
            .claims(claims)
            .subject(subject)
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(secretKey)
            .compact();
    }

    /**
     * Extract username from token
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extract user ID from token
     */
    public Long extractUserId(String token) {
        return extractClaim(token, claims -> claims.get("userId", Long.class));
    }

    /**
     * Extract expiration date
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Extract specific claim
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Extract all claims
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    /**
     * Check if token is expired
     */
    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Validate token
     */
    public boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    /**
     * Get expiration time as LocalDateTime
     */
    public LocalDateTime getExpirationAsLocalDateTime(String token) {
        Date expirationDate = extractExpiration(token);
        return expirationDate.toInstant()
            .atZone(ZoneId.systemDefault())
            .toLocalDateTime();
    }

    /**
     * Calculate token expiration time
     */
    public LocalDateTime calculateAccessTokenExpiry() {
        return LocalDateTime.now().plusSeconds(expiration / 1000);
    }

    /**
     * Calculate refresh token expiration time
     */
    public LocalDateTime calculateRefreshTokenExpiry() {
        return LocalDateTime.now().plusSeconds(refreshExpiration / 1000);
    }

    /**
     * Generate email verification token (24h expiry)
     */
    public String generateVerificationToken(String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "email_verification");
        long verificationExpiry = 24 * 60 * 60 * 1000L; // 24 hours
        return createToken(claims, email, verificationExpiry);
    }

    /**
     * Extract email from verification token and validate
     */
    public String validateVerificationToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            String type = claims.get("type", String.class);
            if (!"email_verification".equals(type)) {
                return null;
            }
            if (isTokenExpired(token)) {
                return null;
            }
            return claims.getSubject();
        } catch (Exception e) {
            return null;
        }
    }
}
