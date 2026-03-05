import { useEffect, useRef, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client, type IMessage } from "@stomp/stompjs";
import type { NotificationDTO } from "../services/notificationService";

const WS_URL = "http://localhost:8080/ws";

interface UseNotificationWebSocketOptions {
  /** Current user ID — needed for the personal topic */
  userId: number | null;
  /** JWT access token (sent as a STOMP header for auth) */
  token: string | null;
  /** Callback invoked on each incoming notification */
  onNotification: (notification: NotificationDTO) => void;
}

/**
 * Hook that maintains a STOMP-over-SockJS connection and
 * subscribes to:
 *   /topic/notifications/{userId}   — personal notifications
 *   /topic/notifications/broadcast   — system-wide broadcast
 *
 * The connection auto-reconnects every 5 s when lost.
 */
export default function useNotificationWebSocket({
  userId,
  token,
  onNotification,
}: UseNotificationWebSocketOptions) {
  const clientRef = useRef<Client | null>(null);
  // Keep the latest callback in a ref so we don't re-subscribe on every render
  const callbackRef = useRef(onNotification);
  callbackRef.current = onNotification;

  const connect = useCallback(() => {
    if (!userId || !token) return;

    const stompClient = new Client({
      // SockJS factory — @stomp/stompjs uses this instead of raw WebSocket
      webSocketFactory: () => new SockJS(WS_URL) as unknown as WebSocket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000, // auto-reconnect every 5s
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // debug: (msg) => console.debug("[STOMP]", msg),
    });

    stompClient.onConnect = () => {
      // Personal channel
      stompClient.subscribe(
        `/topic/notifications/${userId}`,
        (message: IMessage) => {
          try {
            const dto: NotificationDTO = JSON.parse(message.body);
            callbackRef.current(dto);
          } catch {
            /* malformed frame — skip */
          }
        }
      );

      // Broadcast channel
      stompClient.subscribe(
        "/topic/notifications/broadcast",
        (message: IMessage) => {
          try {
            const dto: NotificationDTO = JSON.parse(message.body);
            callbackRef.current(dto);
          } catch {
            /* malformed frame — skip */
          }
        }
      );
    };

    stompClient.onStompError = (frame) => {
      console.error("[Notification WS] STOMP error:", frame.headers["message"]);
    };

    stompClient.activate();
    clientRef.current = stompClient;
  }, [userId, token]);

  useEffect(() => {
    connect();

    return () => {
      if (clientRef.current?.active) {
        clientRef.current.deactivate();
      }
    };
  }, [connect]);

  /** Imperatively disconnect (e.g. on logout) */
  const disconnect = useCallback(() => {
    if (clientRef.current?.active) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
  }, []);

  return { disconnect };
}
