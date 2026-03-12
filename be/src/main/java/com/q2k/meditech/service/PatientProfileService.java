package com.q2k.meditech.service;

import com.q2k.meditech.entity.Patient;

/**
 * Service for resolving Patient profile for the current user (e.g. get-or-create for booking).
 */
public interface PatientProfileService {

    /**
     * Returns the Patient linked to the given user ID. If no Patient exists (e.g. user
     * registered but profile was never created), creates one from User data and returns it.
     *
     * @param userId the authenticated user's ID (must have ROLE_PATIENT)
     * @return the existing or newly created Patient
     * @throws com.q2k.meditech.exception.ResourceNotFoundException if user not found
     */
    Patient getOrCreatePatientForUser(Long userId);
}
