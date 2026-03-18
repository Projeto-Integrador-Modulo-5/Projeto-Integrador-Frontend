import { useEffect, useState } from "react";
import SockJS from "sockjs-client/dist/sockjs.min.js";
import { Client } from "@stomp/stompjs";
import axios from "axios";

const WS_URL      = import.meta.env.VITE_WS_URL;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function HelloWorld() {
  const [mensagens, setMensagens] = useState([]);
  const [conectado, setConectado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    // Conecta no WebSocket do notification-service
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      onConnect: () => {
        setConectado(true);
        console.log("WebSocket conectado!");

        // Se inscreve no canal /topic/hello
        client.subscribe("/topic/hello", (frame) => {
          const mensagem = frame.body;
          console.log("Mensagem recebida via WebSocket:", mensagem);
          setMensagens((prev) => [
            { id: Date.now(), texto: mensagem, hora: new Date().toLocaleTimeString() },
            ...prev,
          ]);
        });
      },
      onDisconnect: () => {
        setConectado(false);
        console.log("WebSocket desconectado.");
      },
      onStompError: (frame) => {
        console.error("Erro STOMP:", frame);
      },
    });

    client.activate();

    // Limpa ao desmontar o componente
    return () => client.deactivate();
  }, []);

  const enviarHello = async () => {
    setCarregando(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/hello`);
      console.log("Resposta do backend:", response.data);
    } catch (error) {
      console.error("Erro ao chamar o backend:", error);
      setMensagens((prev) => [
        { id: Date.now(), texto: "Erro ao conectar no backend. Kafka está rodando?", hora: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.titulo}>Hello World — Arquitetura Kafka</h1>

      {/* Status da conexão WebSocket */}
      <div style={{ ...styles.badge, background: conectado ? "#d4edda" : "#f8d7da", color: conectado ? "#155724" : "#721c24" }}>
        {conectado ? "✅ WebSocket conectado" : "⏳ Conectando WebSocket..."}
      </div>

      {/* Botão */}
      <button
        onClick={enviarHello}
        disabled={carregando || !conectado}
        style={{ ...styles.botao, opacity: carregando || !conectado ? 0.6 : 1 }}
      >
        {carregando ? "Enviando..." : "🚀 Enviar Hello World pelo Kafka"}
      </button>

      <p style={styles.descricao}>
        Clique no botão → backend publica no Kafka → notification-service consome →
        mensagem aparece abaixo via WebSocket (sem recarregar a página)
      </p>

      {/* Lista de mensagens recebidas */}
      <div style={styles.lista}>
        <h3 style={styles.listaTitulo}>
          Mensagens recebidas via WebSocket {mensagens.length > 0 && `(${mensagens.length})`}
        </h3>

        {mensagens.length === 0 ? (
          <p style={styles.vazio}>Nenhuma mensagem ainda. Clique no botão acima!</p>
        ) : (
          mensagens.map((m) => (
            <div key={m.id} style={styles.mensagem}>
              <span style={styles.hora}>{m.hora}</span>
              <span style={styles.texto}>{m.texto}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 640,
    margin: "40px auto",
    padding: "0 24px",
    fontFamily: "Arial, sans-serif",
  },
  titulo: {
    color: "#1F4E79",
    marginBottom: 16,
  },
  badge: {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 20,
  },
  botao: {
    display: "block",
    width: "100%",
    padding: "14px 24px",
    background: "#2E75B6",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: 12,
  },
  descricao: {
    color: "#666",
    fontSize: 13,
    marginBottom: 24,
    lineHeight: 1.6,
  },
  lista: {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 16,
    background: "#f9f9f9",
  },
  listaTitulo: {
    color: "#333",
    margin: "0 0 12px 0",
    fontSize: 14,
  },
  vazio: {
    color: "#999",
    fontSize: 13,
    textAlign: "center",
    padding: "20px 0",
  },
  mensagem: {
    display: "flex",
    gap: 12,
    padding: "8px 12px",
    background: "#fff",
    borderRadius: 6,
    marginBottom: 8,
    borderLeft: "3px solid #2E75B6",
  },
  hora: {
    color: "#999",
    fontSize: 12,
    whiteSpace: "nowrap",
    paddingTop: 2,
  },
  texto: {
    color: "#1F4E79",
    fontWeight: "bold",
    fontSize: 14,
  },
};
