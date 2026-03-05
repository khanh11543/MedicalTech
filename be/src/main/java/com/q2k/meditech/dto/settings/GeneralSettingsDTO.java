package com.q2k.meditech.dto.settings;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeneralSettingsDTO {

    // Clinic Information
    private String clinicName;
    private String tagline;
    private String logoUrl;
    private String faviconUrl;

    // Contact Information
    private String email;
    private String phone;
    private String fax;
    private String whatsapp;

    // Address
    private String street;
    private String city;
    private String state;
    private String zipCode;
    private String country;

    // Social Media
    private String facebook;
    private String twitter;
    private String instagram;
    private String linkedin;
    private String youtube;

    // Business Hours
    private List<BusinessHourDTO> businessHours;

    // Regional Settings
    private String timezone;
    private String language;
    private String dateFormat;
    private String timeFormat;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BusinessHourDTO {
        private String day;
        private String openTime;
        private String closeTime;
        private String breakStart;
        private String breakEnd;
        private boolean closed;
    }
}
