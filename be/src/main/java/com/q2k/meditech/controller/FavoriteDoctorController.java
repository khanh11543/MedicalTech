package com.q2k.meditech.controller;

import com.q2k.meditech.dto.FavoriteListResponse;
import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.service.FavoriteDoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patient/favorites")
public class FavoriteDoctorController {

    @Autowired
    private FavoriteDoctorService favoriteDoctorService;

    // TODO: Replace patientId parameter with SecurityContext when authentication is implemented
    @GetMapping
    public ResponseEntity<FavoriteListResponse> getFavorites(
            @RequestParam Long patientId,
            @RequestParam(required = false, defaultValue = "0") Integer pageNumber,
            @RequestParam(required = false, defaultValue = "20") Integer pageSize) {

        FavoriteListResponse response = favoriteDoctorService.getFavorites(patientId, pageNumber, pageSize);
        return ResponseEntity.ok(response);
    }

    // TODO: Replace patientId parameter with SecurityContext when authentication is implemented
    @DeleteMapping("/{id}")
    public ResponseEntity<MessageDTO> removeFavorite(
            @PathVariable Long id,
            @RequestParam Long patientId) {

        favoriteDoctorService.removeFavorite(id, patientId);

        MessageDTO response = new MessageDTO("Favorite removed successfully", true);
        return ResponseEntity.ok(response);
    }
}
