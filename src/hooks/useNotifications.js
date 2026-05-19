import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs.min.js';
import { getNotificationsApi, markAllAsReadApi } from '../api/notificationApi';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8083/ws';

/**
 * Hook para notificações: busca persistidas na API + recebe em tempo real via WebSocket.
 * @param {string|null} userId - UUID do usuário logado.
 * @returns {{ notifications, unreadCount, connected, markAllRead, refresh }}
 */
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected]         = useState(false);
  const clientRef = useRef(null);

  /** Busca notificações persistidas no banco */
  const refresh = useCallback(() => {
    if (!userId) return;
    getNotificationsApi()
      .then(({ data }) => {
        setNotifications(data ?? []);
      })
      .catch(() => {});
  }, [userId]);

  /** Carrega notificações ao montar e quando userId muda */
  useEffect(() => {
    refresh();
  }, [refresh]);

  /** WebSocket — adiciona notificações em tempo real */
  useEffect(() => {
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

            // Adiciona no topo sem duplicar (o backend já persistiu, mas pode chegar antes do refresh)
            setNotifications((prev) => {
              const newNotif = {
                id:           payload.id ?? `ws-${Date.now()}`,
                orderId:      payload.orderId,
                type:         payload.type,
                message:      payload.message,
                trackingCode: payload.trackingCode,
                sentAt:       payload.sentAt || new Date().toISOString(),
                read:         false,
              };
              // Evita duplicata por orderId+type
              const exists = prev.some(
                (n) => n.orderId === newNotif.orderId && n.type === newNotif.type && !n.id?.toString().startsWith('ws-')
              );
              return exists ? prev : [newNotif, ...prev];
            });

            // Sincroniza com o banco após 1s para pegar o ID real persistido
            setTimeout(refresh, 1000);
          } catch (err) {
            console.error('[Notifications] Erro ao parsear payload:', err);
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError:  (frame) => console.error('[Notifications] Erro STOMP:', frame.headers?.message),
    });

    client.activate();
    clientRef.current = client;

    return () => client.deactivate();
  }, [userId, refresh]);

  const markAllRead = useCallback(async () => {
    try {
      await markAllAsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, connected, markAllRead, refresh };
}
