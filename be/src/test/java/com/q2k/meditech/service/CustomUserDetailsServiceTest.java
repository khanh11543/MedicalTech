package com.q2k.meditech.service;

import com.q2k.meditech.entity.Role;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.UserRole;
import com.q2k.meditech.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void loadUserByUsername_notFound_throws() {
        when(userRepository.findByEmailWithRoles("a@b.c")).thenReturn(java.util.Optional.empty());
        assertThrows(UsernameNotFoundException.class, () -> customUserDetailsService.loadUserByUsername("a@b.c"));
    }

    @Test
    void loadUserByUsername_found_returnsUserDetails() {
        Role role = Role.builder().name("PATIENT").build();
        role.setId(1L);
        UserRole ur = UserRole.builder().role(role).build();
        User user = User.builder()
                .email("u@test.com")
                .passwordHash("hash")
                .isActive(true)
                .userRoles(Set.of(ur))
                .build();
        user.setId(10L);
        ur.setUser(user);
        when(userRepository.findByEmailWithRoles("u@test.com")).thenReturn(java.util.Optional.of(user));

        UserDetails details = customUserDetailsService.loadUserByUsername("u@test.com");
        assertEquals("u@test.com", details.getUsername());
        assertTrue(details.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT")));
    }
}
