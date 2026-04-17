import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs.min.js';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8083/ws';

/**
 * Hook para receber notificações em tempo real de um usuário.
 * @param {string|null} userId - UUID do usuário logado. Se null, não conecta.
 * @returns {{ notifications: Array, connected: boolean, clearNotifications: Function }}
 */
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    // Só conecta se houver userId
    if (!userId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        console.log(`[Notifications] Inscrito em /topic/notifications/${userId}`);

        client.subscribe(`/topic/notifications/${userId}`, (frame) => {
          try {
            const payload = JSON.parse(frame.body);
            console.log('[Notifications] Nova notificação recebida:', payload);

            setNotifications((prev) => [
              {
                id: Date.now(),
                orderId: payload.orderId,
                type: payload.type,
                message: payload.message,
                trackingCode: payload.trackingCode,
                sentAt: payload.sentAt || new Date().toISOString(),
                read: false,
              },
              ...prev,
            ]);
          } catch (err) {
            console.error('[Notifications] Erro ao parsear payload:', err);
          }
        });
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('[Notifications] Erro STOMP:', frame.headers?.message);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [userId]);

  const clearNotifications = () => setNotifications([]);

  return { notifications, connected, clearNotifications };
}
