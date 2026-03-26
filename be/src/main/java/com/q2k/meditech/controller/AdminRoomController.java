package com.q2k.meditech.controller;

import com.q2k.meditech.dto.room.RoomDTO;
import com.q2k.meditech.dto.room.UpsertRoomDTO;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.Room;
import com.q2k.meditech.exception.DuplicateResourceException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.RoomRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/admin/rooms")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminRoomController {

    private final RoomRepository roomRepository;
    private final DoctorRepository doctorRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<RoomDTO>> listRooms() {
        List<Room> rooms = roomRepository.findAll();
        List<Doctor> doctors = doctorRepository.findAll();

        List<RoomDTO> result = rooms.stream()
                .map(r -> {
                    Optional<Doctor> assigned = doctors.stream()
                            .filter(d -> d.getRoom() != null && d.getRoom().getId().equals(r.getId()))
                            .findFirst();
                    return RoomDTO.builder()
                            .id(r.getId())
                            .roomNumber(r.getRoomNumber())
                            .name(r.getName())
                            .floor(r.getFloor())
                            .isActive(r.getIsActive())
                            .doctorId(assigned.map(Doctor::getId).orElse(null))
                            .doctorName(assigned.map(Doctor::getFullName).orElse(null))
                            .build();
                })
                .sorted(Comparator.comparing(RoomDTO::getRoomNumber, Comparator.nullsLast(String::compareTo)))
                .toList();

        return ResponseEntity.ok(result);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<RoomDTO> createRoom(@Valid @RequestBody UpsertRoomDTO dto) {
        String roomNumber = dto.getRoomNumber() != null ? dto.getRoomNumber().trim() : null;
        if (roomNumber == null || roomNumber.isBlank()) {
            throw new DuplicateResourceException("Room number is required");
        }

        if (roomRepository.existsByRoomNumber(roomNumber)) {
            throw new DuplicateResourceException("Room number already exists: " + roomNumber);
        }

        Room room = Room.builder()
                .roomNumber(roomNumber)
                .name(dto.getName())
                .floor(dto.getFloor())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();
        room = roomRepository.save(room);

        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(room, null));
    }

    @PutMapping("/{roomId}")
    @Transactional
    public ResponseEntity<RoomDTO> updateRoom(@PathVariable Long roomId, @Valid @RequestBody UpsertRoomDTO dto) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        String roomNumber = dto.getRoomNumber() != null ? dto.getRoomNumber().trim() : null;
        if (roomNumber == null || roomNumber.isBlank()) {
            throw new DuplicateResourceException("Room number is required");
        }

        if (!room.getRoomNumber().equals(roomNumber)
                && roomRepository.existsByRoomNumber(roomNumber)) {
            throw new DuplicateResourceException("Room number already exists: " + roomNumber);
        }

        room.setRoomNumber(roomNumber);
        room.setName(dto.getName());
        room.setFloor(dto.getFloor());
        if (dto.getIsActive() != null) {
            room.setIsActive(dto.getIsActive());
        }
        roomRepository.save(room);

        Doctor assigned = doctorRepository.findAll().stream()
                .filter(d -> d.getRoom() != null && d.getRoom().getId().equals(room.getId()))
                .findFirst()
                .orElse(null);

        // Keep doctor.currentRoom in sync if assigned
        if (assigned != null) {
            assigned.setCurrentRoom(room.getRoomNumber());
            doctorRepository.save(assigned);
        }

        return ResponseEntity.ok(toDto(room, assigned));
    }

    /**
     * Assign (or unassign) a doctor to a room.
     * - One doctor per room (enforced via doctors.room_id unique)
     * - One room per doctor (by model)
     */
    @PutMapping("/{roomId}/assign")
    @Transactional
    public ResponseEntity<RoomDTO> assignDoctor(
            @PathVariable Long roomId,
            @RequestParam(required = false) Long doctorId
    ) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        // Unassign any doctor currently in this room
        Doctor currentInRoom = doctorRepository.findAll().stream()
                .filter(d -> d.getRoom() != null && d.getRoom().getId().equals(roomId))
                .findFirst()
                .orElse(null);

        if (currentInRoom != null) {
            currentInRoom.setRoom(null);
            // keep legacy field consistent
            currentInRoom.setCurrentRoom(null);
            doctorRepository.save(currentInRoom);
        }

        Doctor assigned = null;
        if (doctorId != null) {
            assigned = doctorRepository.findByIdWithUser(doctorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));

            // If doctor already has a room, clear it first
            if (assigned.getRoom() != null) {
                assigned.setRoom(null);
                assigned.setCurrentRoom(null);
                doctorRepository.save(assigned);
            }

            assigned.setRoom(room);
            assigned.setCurrentRoom(room.getRoomNumber());
            doctorRepository.save(assigned);
        }

        return ResponseEntity.ok(toDto(room, assigned));
    }

    @DeleteMapping("/{roomId}")
    @Transactional
    public ResponseEntity<Void> deleteRoom(@PathVariable Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        // Unassign doctor if any
        doctorRepository.findAll().stream()
                .filter(d -> d.getRoom() != null && d.getRoom().getId().equals(roomId))
                .findFirst()
                .ifPresent(d -> {
                    d.setRoom(null);
                    d.setCurrentRoom(null);
                    doctorRepository.save(d);
                });

        roomRepository.delete(room);
        return ResponseEntity.noContent().build();
    }

    private RoomDTO toDto(Room room, Doctor assigned) {
        return RoomDTO.builder()
                .id(room.getId())
                .roomNumber(room.getRoomNumber())
                .name(room.getName())
                .floor(room.getFloor())
                .isActive(room.getIsActive())
                .doctorId(assigned != null ? assigned.getId() : null)
                .doctorName(assigned != null ? assigned.getFullName() : null)
                .build();
    }
}

