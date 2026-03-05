package com.q2k.meditech.service;

import com.maxmind.geoip2.DatabaseReader;
import com.maxmind.geoip2.exception.GeoIp2Exception;
import com.maxmind.geoip2.model.CityResponse;
import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.net.InetAddress;

/**
 * GeoLocation service for resolving IP addresses to geographic information.
 * Uses MaxMind GeoIP2 database (GeoLite2-City.mmdb).
 * <p>
 * If the database file is not found, the service operates in a degraded mode
 * (returns null for all lookups) without failing application startup.
 * </p>
 *
 * <p>To use this service:</p>
 * <ol>
 *   <li>Download GeoLite2-City.mmdb from https://dev.maxmind.com/geoip/geolite2-free-geolocation-data</li>
 *   <li>Place it at the path configured by <code>geoip.database.path</code> in application.properties</li>
 * </ol>
 */
@Service
@Slf4j
public class GeoLocationService {

    @Value("${geoip.database.path:data/GeoLite2-City.mmdb}")
    private String databasePath;

    private DatabaseReader databaseReader;
    private boolean available = false;

    @PostConstruct
    public void init() {
        try {
            File database = new File(databasePath);
            if (database.exists()) {
                databaseReader = new DatabaseReader.Builder(database).build();
                available = true;
                log.info("GeoIP2 database loaded from: {}", databasePath);
            } else {
                log.warn("GeoIP2 database not found at: {}. Geo-location lookups will return null. " +
                         "Download GeoLite2-City.mmdb from MaxMind and place it at the configured path.", databasePath);
            }
        } catch (IOException e) {
            log.error("Failed to load GeoIP2 database: {}", e.getMessage());
        }
    }

    /**
     * Lookup geographic information for an IP address.
     *
     * @param ipAddress the IP address (IPv4 or IPv6)
     * @return GeoInfo with country and city, or null if lookup fails or DB unavailable
     */
    public GeoInfo lookup(String ipAddress) {
        if (!available || ipAddress == null || ipAddress.isBlank()) {
            return null;
        }

        // Skip private/local IPs
        if (isPrivateIp(ipAddress)) {
            return GeoInfo.builder()
                    .country("Local")
                    .city("Local")
                    .latitude(0.0)
                    .longitude(0.0)
                    .build();
        }

        try {
            InetAddress address = InetAddress.getByName(ipAddress);
            CityResponse response = databaseReader.city(address);

            return GeoInfo.builder()
                    .country(response.getCountry() != null ? response.getCountry().getName() : null)
                    .countryIso(response.getCountry() != null ? response.getCountry().getIsoCode() : null)
                    .city(response.getCity() != null ? response.getCity().getName() : null)
                    .latitude(response.getLocation() != null ? response.getLocation().getLatitude() : null)
                    .longitude(response.getLocation() != null ? response.getLocation().getLongitude() : null)
                    .timezone(response.getLocation() != null ? response.getLocation().getTimeZone() : null)
                    .isp(response.getTraits() != null ? response.getTraits().getIsp() : null)
                    .build();
        } catch (GeoIp2Exception e) {
            log.debug("GeoIP2 lookup failed for IP {}: {}", ipAddress, e.getMessage());
        } catch (IOException e) {
            log.warn("GeoIP2 IO error for IP {}: {}", ipAddress, e.getMessage());
        }

        return null;
    }

    /**
     * Check if the GeoIP2 database is available.
     */
    public boolean isAvailable() {
        return available;
    }

    private boolean isPrivateIp(String ip) {
        return ip.startsWith("10.") ||
               ip.startsWith("172.16.") || ip.startsWith("172.17.") || ip.startsWith("172.18.") ||
               ip.startsWith("172.19.") || ip.startsWith("172.20.") || ip.startsWith("172.21.") ||
               ip.startsWith("172.22.") || ip.startsWith("172.23.") || ip.startsWith("172.24.") ||
               ip.startsWith("172.25.") || ip.startsWith("172.26.") || ip.startsWith("172.27.") ||
               ip.startsWith("172.28.") || ip.startsWith("172.29.") || ip.startsWith("172.30.") ||
               ip.startsWith("172.31.") ||
               ip.startsWith("192.168.") ||
               ip.equals("127.0.0.1") || ip.equals("0:0:0:0:0:0:0:1") || ip.equals("::1");
    }

    /**
     * Value object for geographic information.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GeoInfo {
        private String country;
        private String countryIso;
        private String city;
        private Double latitude;
        private Double longitude;
        private String timezone;
        private String isp;
    }
}
