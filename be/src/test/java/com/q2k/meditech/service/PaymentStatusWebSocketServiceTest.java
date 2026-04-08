package com.q2k.meditech.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Map;

import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PaymentStatusWebSocketServiceTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private PaymentStatusWebSocketService service;

    @Test
    void broadcastPaymentStatusChange_sendsToTopic() {
        service.broadcastPaymentStatusChange(5L, "PAY-1", "PAID", "MOMO");
        verify(messagingTemplate).convertAndSend(eq("/topic/payments/5/status"), anyMap());
    }

    @Test
    void broadcastPaymentStatusChange_nullCodeAndMethod_usesEmptyStrings() {
        service.broadcastPaymentStatusChange(1L, null, "X", null);
        verify(messagingTemplate).convertAndSend(eq("/topic/payments/1/status"), anyMap());
    }

    @Test
    void broadcastReceptionistUpdate_swallowsSendException() {
        doThrow(new RuntimeException("fail")).when(messagingTemplate)
                .convertAndSend(eq("/topic/receptionist/payments"), anyMap());
        service.broadcastReceptionistUpdate("EVT", Map.of("k", "v"));
    }
}
