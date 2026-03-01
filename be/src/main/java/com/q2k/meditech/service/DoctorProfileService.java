package com.q2k.meditech.service;

import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.VerificationStatus;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Shared helper: resolves the authenticated user to a Doctor entity.
 * Auto-creates the doctor profile when it doesn't exist yet,
 * so new DOCTOR-role users never see "Doctor profile not found".
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorProfileService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    /**
     * Get the currently authenticated user's ID (non-null).
     */
    public Long requireUserId() {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) {
            throw new BadRequestException("User not authenticated");
        }
        return userId;
    }

    /**
     * Get (or auto-create) the Doctor entity for the given user ID.
     * If the user has the DOCTOR role but no doctors row yet,
     * a minimal profile is created automatically.
     */
    @Transactional
    public Doctor getOrCreateDoctor(Long userId) {
        return doctorRepository.findByUserId(userId)
                .orElseGet(() -> createDoctorProfile(userId));
    }

    /**
     * Convenience: requireUserId() + getOrCreateDoctor() in one call.
     */
    @Transactional
    public Doctor requireDoctor() {
        return getOrCreateDoctor(requireUserId());
    }

    // ----------------------------------------------------------------
    // PRIVATE
    // ----------------------------------------------------------------

    private Doctor createDoctorProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        String fullName = user.getFullName();
        if (fullName == null || fullName.isBlank()) {
            fullName = "Doctor #" + userId;
        }

        Doctor doctor = Doctor.builder()
                .user(user)
                .fullName(fullName)
                .verificationStatus(VerificationStatus.APPROVED)
                .isAvailable(true)
                .build();

        doctor = doctorRepository.save(doctor);
        log.info("Auto-created doctor profile id={} for user id={} ({})",
                doctor.getId(), userId, fullName);
        return doctor;
    }
}
