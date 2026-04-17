import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs.min.js';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8083/ws';

/**
 * Hook para gerenciar conexão WebSocket via STOMP/SockJS.
 * @returns {{ client: Client|null, connected: boolean }}
 */
export function useWebSocket() {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        console.log('[WebSocket] Conectado ao notification-service');
      },
      onDisconnect: () => {
        setConnected(false);
        console.log('[WebSocket] Desconectado');
      },
      onStompError: (frame) => {
        console.error('[WebSocket] Erro STOMP:', frame.headers?.message);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, []);

  return { client: clientRef.current, connected };
}
