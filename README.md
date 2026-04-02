# Projeto-Integrador-Frontend

Frontend do e-commerce de camisetas — Projeto Integrador ADS 4º Período · PUC Goiás · 2026/1.

SPA React + Vite que exibe a vitrine de produtos, gerencia o carrinho, realiza pedidos via REST e exibe atualizações de status em tempo real via WebSocket/STOMP — sem recarregar a página.

---

## Responsabilidades

- Vitrine de produtos (catálogo de camisetas)
- Carrinho de compras
- Criação de pedidos via `POST /api/orders` (Backend Service)
- Acompanhamento de pedido em tempo real via WebSocket/STOMP (`Notification Service`)
- Painel administrativo (listagem de pedidos, atualização de status)

---

## Stack

| Camada       | Tecnologia                         |
|--------------|------------------------------------|
| Framework    | React 18                           |
| Build        | Vite                               |
| WebSocket    | SockJS + STOMP (`@stomp/stompjs`)  |
| HTTP         | Fetch API / Axios                  |
| Linguagem    | JavaScript (ESLint configurado)    |

---

## Fluxo em tempo real

```
Frontend ──[REST]──► Backend Service (:8080)
Frontend ──[SockJS/STOMP]──► Notification Service (:8082/ws)
  └─► subscribe: /topic/orders/{id}
          ↑
  Atualização de status empurrada pelo Notification Service
```

O badge de status do pedido é atualizado automaticamente conforme o pedido avança: `Processando → Confirmado → Enviado → Entregue`.

---

## Configuração

```bash
cp .env.example .env
```

Variáveis necessárias no `.env`:

```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8082/ws
```

> **Atenção:** a URL do WebSocket usa `http://`, não `ws://` — o SockJS faz o upgrade automaticamente.

---

## Instalação e execução

```bash
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

---

## Build para produção

```bash
npm run build
```

---

## Notas técnicas

- O `vite.config.js` inclui `define: { global: 'globalThis' }` para compatibilidade com SockJS no ambiente Vite.
- O import do SockJS usa o caminho `sockjs-client/dist/sockjs.min.js` para evitar o erro `global is not defined`.

---

## Repositórios relacionados

| Repositório | Responsabilidade |
|---|---|
| [Projeto-Integrador-Infra](https://github.com/Projeto-Integrador-Modulo-5/Projeto-Integrador-Infra) | Docker Compose e infraestrutura |
| [Projeto-Integrador-Backend](https://github.com/Projeto-Integrador-Modulo-5/Projeto-Integrador-Backend) | API REST — pedidos, produtos, autenticação |
| [Projeto-Integrador-Logistics-Service](https://github.com/Projeto-Integrador-Modulo-5/Projeto-Integrador-Logistics-Service) | Processamento de pedidos |
| [Projeto-Integrador-Notification-Service](https://github.com/Projeto-Integrador-Modulo-5/Projeto-Integrador-Notification-Service) | WebSocket/STOMP — atualizações em tempo real |
