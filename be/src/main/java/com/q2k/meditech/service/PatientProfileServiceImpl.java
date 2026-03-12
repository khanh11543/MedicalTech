package com.q2k.meditech.service;

import com.q2k.meditech.entity.Patient;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.PatientRepository;
import com.q2k.meditech.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatientProfileServiceImpl implements PatientProfileService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Patient getOrCreatePatientForUser(Long userId) {
        Optional<Patient> existing = patientRepository.findByUserId(userId);
        if (existing.isPresent()) {
            return existing.get();
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        String fullName = Optional.ofNullable(user.getFullName())
                .filter(s -> !s.isBlank())
                .orElse(user.getEmail() != null ? user.getEmail() : "Patient");
        Patient patient = Patient.builder()
                .user(user)
                .fullName(fullName)
                .build();
        patient = patientRepository.save(patient);
        log.info("Created missing Patient profile for user {} (patientId={})", userId, patient.getId());
        return patient;
    }
}
