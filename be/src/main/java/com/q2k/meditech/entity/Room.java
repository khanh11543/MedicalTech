package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "rooms",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_rooms_room_number", columnNames = "room_number")
        },
        indexes = {
                @Index(name = "idx_rooms_room_number", columnList = "room_number"),
                @Index(name = "idx_rooms_active", columnList = "is_active")
        }
)
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_number", nullable = false, length = 20)
    private String roomNumber;

    @Column(name = "name", length = 255)
    private String name;

    @Column(name = "floor")
    private Integer floor;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Builder.Default
    @Column(name="created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(name="updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

