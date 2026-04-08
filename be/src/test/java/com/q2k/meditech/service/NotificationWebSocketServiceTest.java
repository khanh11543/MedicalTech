package com.q2k.meditech.service;

import com.q2k.meditech.dto.NotificationDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class NotificationWebSocketServiceTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationWebSocketService service;

    @Test
    void sendToUser_sendsToUserTopic() {
        NotificationDTO dto = NotificationDTO.builder().title("t").category("c").build();
        service.sendToUser(9L, dto);
        verify(messagingTemplate).convertAndSend(eq("/topic/notifications/9"), eq(dto));
    }

    @Test
    void broadcast_sendsToBroadcastTopic() {
        NotificationDTO dto = NotificationDTO.builder().title("t").category("c").build();
        service.broadcast(dto);
        verify(messagingTemplate).convertAndSend(eq("/topic/notifications/broadcast"), eq(dto));
    }

    @Test
    void sendToUser_swallowsException() {
        NotificationDTO dto = NotificationDTO.builder().title("t").category("c").build();
        doThrow(new RuntimeException("x")).when(messagingTemplate)
                .convertAndSend(eq("/topic/notifications/1"), eq(dto));
        service.sendToUser(1L, dto);
    }
}
